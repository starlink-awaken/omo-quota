/**
 * Notification Hook
 *
 * 监听session.idle事件，在会话结束时提供配额状态摘要
 * 识别低配额提供商并提供建议操作
 */

import type { Event } from "@opencode-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * 通知配置选项
 */
export interface NotificationConfig {
  /** 低配额阈值百分比 (0-100)，默认20 */
  lowQuotaThreshold: number;
  /** 是否启用低配额通知，默认true */
  notifyOnLowQuota: boolean;
  /** tracker文件路径 */
  trackerPath: string;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: NotificationConfig = {
  lowQuotaThreshold: 20,
  notifyOnLowQuota: true,
  trackerPath: join(homedir(), ".omo-quota-tracker.json"),
};

/**
 * Provider状态数据
 */
interface ProviderStatus {
  lastReset?: string;
  nextReset?: string;
  resetInterval?: string;
  usage?: number;
  used?: number;
  limit?: number;
  month?: string;
  balance?: string;
  currency?: string;
}

/**
 * Tracker数据结构
 */
interface TrackerData {
  providers: Record<string, ProviderStatus>;
  currentStrategy: string;
}

/**
 * 低配额提供商信息
 */
interface LowQuotaProvider {
  /** 提供商ID */
  provider: string;
  /** 显示名称 */
  displayName: string;
  /** 剩余配额百分比 */
  remainingPercentage: number;
  /** 状态等级 */
  level: "warning" | "critical";
}

/**
 * 提供商显示名称映射
 */
const PROVIDER_NAMES: Record<string, string> = {
  anthropic: "Claude Pro",
  "google-1": "Gemini Pro #1",
  "google-2": "Gemini Pro #2",
  zhipuai: "ZhiPuAI Max",
  fangzhou: "方舟 CodingPlan Pro",
  "github-copilot-premium": "GitHub Copilot Premium",
  deepseek: "DeepSeek",
  siliconflow: "硅基流动",
  openrouter: "OpenRouter",
  "github-copilot-free": "GitHub Copilot Free",
  openai: "OpenAI",
};

/**
 * 读取tracker文件
 */
function loadTracker(trackerPath: string): TrackerData | null {
  try {
    if (!existsSync(trackerPath)) {
      return null;
    }
    const content = readFileSync(trackerPath, "utf-8");
    return JSON.parse(content) as TrackerData;
  } catch {
    return null;
  }
}

/**
 * 计算提供商剩余配额百分比
 *
 * 对于不同类型的提供商：
 * - HourlyResetProvider: 基于时间重置周期计算
 * - MonthlyResetProvider: 使用 (limit - used) / limit * 100
 * - BalanceProvider: 基于余额比例计算
 */
function calculateRemainingPercentage(
  provider: string,
  status: ProviderStatus
): number | null {
  // 月度重置类型 (如 github-copilot-premium)
  if (
    "limit" in status &&
    status.limit !== undefined &&
    "used" in status &&
    status.used !== undefined
  ) {
    const remaining = status.limit - status.used;
    const percentage = (remaining / status.limit) * 100;
    return Math.round(percentage * 10) / 10;
  }

  // 小时重置类型 - 基于时间计算剩余配额
  if ("nextReset" in status && status.nextReset && "usage" in status) {
    try {
      const now = Date.now();
      const nextReset = new Date(status.nextReset).getTime();
      const lastReset = status.lastReset
        ? new Date(status.lastReset).getTime()
        : nextReset - 5 * 60 * 60 * 1000; // 默认5小时间隔

      const totalInterval = nextReset - lastReset;
      const elapsed = now - lastReset;

      if (totalInterval > 0 && elapsed < totalInterval) {
        // 剩余时间百分比（假设配额随时间线性恢复）
        const remainingTime = nextReset - now;
        const timeRemainingPercentage = (remainingTime / totalInterval) * 100;

        // 如果有usage字段，考虑它来调整百分比
        if (status.usage !== undefined && typeof status.usage === "number") {
          // usage表示已使用百分比，取两者中较小的
          return Math.min(100 - status.usage, timeRemainingPercentage);
        }

        return Math.round(timeRemainingPercentage * 10) / 10;
      }
    } catch {
      // 日期解析失败
    }
  }

  // 余额类型 (如 deepseek, siliconflow)
  if ("balance" in status && status.balance) {
    const balanceStr = status.balance;
    const match = balanceStr.match(/[\d.]+/);
    if (match) {
      const balance = parseFloat(match[0]);
      // 假设初始余额为 ¥500 或 $100
      const currency = status.currency || "CNY";
      const initialBalance = currency === "CNY" ? 500 : 100;

      if (balance >= initialBalance) {
        return 100; // 可能未使用过
      }

      const remainingPercentage = (balance / initialBalance) * 100;
      return Math.max(0, Math.min(100, Math.round(remainingPercentage * 10) / 10));
    }
  }

  return null;
}

/**
 * 识别低配额提供商
 */
function identifyLowQuotaProviders(
  tracker: TrackerData,
  threshold: number
): LowQuotaProvider[] {
  const lowQuotaProviders: LowQuotaProvider[] = [];

  for (const [providerId, status] of Object.entries(tracker.providers)) {
    if (!status) continue;

    const remaining = calculateRemainingPercentage(providerId, status);

    if (remaining !== null && remaining < threshold) {
      const displayName = PROVIDER_NAMES[providerId] || providerId;

      lowQuotaProviders.push({
        provider: providerId,
        displayName,
        remainingPercentage: remaining,
        level: remaining < 10 ? "critical" : "warning",
      });
    }
  }

  // 按剩余配额升序排序（最少的在前）
  return lowQuotaProviders.sort(
    (a, b) => a.remainingPercentage - b.remainingPercentage
  );
}

/**
 * 格式化通知输出
 */
function formatNotification(
  lowQuotaProviders: LowQuotaProvider[],
  trackerPath: string
): string {
  if (lowQuotaProviders.length === 0) {
    return "";
  }

  const lines: string[] = [];

  // 标题
  lines.push("[omo-quota] 📊 会话完成\n");

  // 低配额提醒
  lines.push("低配额提醒:");

  for (const provider of lowQuotaProviders) {
    const percentage = provider.remainingPercentage;
    let statusText: string;

    if (percentage < 5) {
      statusText = "即将耗尽";
    } else if (percentage < 10) {
      statusText = "严重不足";
    } else {
      statusText = "建议关注";
    }

    lines.push(`  • ${provider.displayName}: ${percentage}% (${statusText})`);
  }

  // 建议操作
  lines.push("\n💡 建议操作:");
  lines.push("  - 运行 omo-quota sync 同步最新使用记录");
  lines.push("  - 使用 quota_status 查看详细配额状态");

  const hasCritical = lowQuotaProviders.some((p) => p.level === "critical");
  if (hasCritical) {
    lines.push("  - 考虑切换到经济模式以节省成本");
  }

  return lines.join("\n");
}

/**
 * Notification Hook
 *
 * 监听session.idle事件，在会话结束时提供配额状态摘要
 * 符合 Hooks.event 类型: (input: { event: Event }) => Promise<void>
 */
export const notificationHook = async (input: {
  event: Event;
}): Promise<void> => {
  const { event } = input;
  const { lowQuotaThreshold, notifyOnLowQuota, trackerPath } = DEFAULT_CONFIG;

  // 检查是否启用通知
  if (!notifyOnLowQuota) {
    return;
  }

  // 仅处理session.idle事件
  const eventType = event.type as string;
  if (eventType !== "session.idle") {
    return;
  }

  try {
    // 读取tracker文件
    const tracker = loadTracker(trackerPath);
    if (!tracker || Object.keys(tracker.providers).length === 0) {
      // tracker文件不存在或无数据，跳过
      return;
    }

    // 识别低配额提供商
    const lowQuotaProviders = identifyLowQuotaProviders(
      tracker,
      lowQuotaThreshold
    );

    // 仅在有低配额提供商时输出
    if (lowQuotaProviders.length > 0) {
      const notification = formatNotification(lowQuotaProviders, trackerPath);
      console.log(notification);
    }
  } catch {
    // 不抛出错误，静默失败
  }
};

/**
 * 创建带自定义配置的hook工厂函数
 *
 * @param config - 部分配置选项，未指定的使用默认值
 * @returns notification hook函数
 */
export function createNotificationHook(
  config: Partial<NotificationConfig>
): (input: { event: Event }) => Promise<void> {
  const fullConfig: NotificationConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return async (input: { event: Event }): Promise<void> => {
    const { event } = input;
    const { lowQuotaThreshold, notifyOnLowQuota, trackerPath } = fullConfig;

    // 检查是否启用通知
    if (!notifyOnLowQuota) {
      return;
    }

    // 仅处理session.idle事件
    const eventType = event.type as string;
    if (eventType !== "session.idle") {
      return;
    }

    try {
      // 读取tracker文件
      const tracker = loadTracker(trackerPath);
      if (!tracker || Object.keys(tracker.providers).length === 0) {
        return;
      }

      // 识别低配额提供商
      const lowQuotaProviders = identifyLowQuotaProviders(
        tracker,
        lowQuotaThreshold
      );

      // 仅在有低配额提供商时输出
      if (lowQuotaProviders.length > 0) {
        const notification = formatNotification(
          lowQuotaProviders,
          trackerPath
        );
        console.log(notification);
      }
    } catch {
      // 静默失败
    }
  };
}

// 导出默认配置供外部使用
export { DEFAULT_CONFIG };
