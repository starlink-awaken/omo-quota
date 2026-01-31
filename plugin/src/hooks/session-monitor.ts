/**
 * Session Monitor Hook
 *
 * 监听session事件，定期检查配额使用率，超过阈值时记录警告
 */

import type { Event } from "@opencode-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// 配置选项
export interface SessionMonitorConfig {
  /** 警告阈值（百分比），默认80 */
  warningThreshold: number;
  /** 同步间隔（毫秒），默认3600000（1小时） */
  syncInterval: number;
  /** 是否自动同步 */
  autoSync: boolean;
  /** tracker文件路径 */
  trackerPath: string;
}

// 默认配置
const DEFAULT_CONFIG: SessionMonitorConfig = {
  warningThreshold: 80,
  syncInterval: 3600000, // 1小时
  autoSync: false,
  trackerPath: join(homedir(), ".omo-quota-tracker.json"),
};

// Provider状态
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

interface TrackerData {
  providers: Record<string, ProviderStatus>;
  currentStrategy: string;
}

// 使用率警告信息
interface UsageWarning {
  provider: string;
  usage: number;
  threshold: number;
}

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
 * 计算提供商使用率
 *
 * 对于不同类型的提供商：
 * - HourlyResetProvider: 使用 usage 字段，假设基于时间计算使用率
 * - MonthlyResetProvider: 使用 used/limit 计算百分比
 * - BalanceProvider: 解析余额并计算（简化处理）
 */
function calculateUsage(
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
    const percentage = (status.used / status.limit) * 100;
    return Math.round(percentage * 10) / 10;
  }

  // 余额类型 (如 deepseek, siliconflow)
  if ("balance" in status && status.balance) {
    // 简化处理：假设余额低表示使用率高
    // 实际实现可能需要初始余额信息
    const balanceStr = status.balance;
    const match = balanceStr.match(/[\d.]+/);
    if (match) {
      const balance = parseFloat(match[0]);
      // 假设初始余额为 ¥500 或 $100
      const currency = status.currency || "CNY";
      const initialBalance = currency === "CNY" ? 500 : 100;
      const usage = ((initialBalance - balance) / initialBalance) * 100;
      return Math.max(0, Math.min(100, Math.round(usage * 10) / 10));
    }
  }

  // Hourly reset类型 - 基于时间计算
  if ("nextReset" in status && status.nextReset) {
    try {
      const now = Date.now();
      const nextReset = new Date(status.nextReset).getTime();
      const lastReset = status.lastReset
        ? new Date(status.lastReset).getTime()
        : nextReset - 5 * 60 * 60 * 1000; // 默认5小时间隔

      const totalInterval = nextReset - lastReset;
      const elapsed = now - lastReset;

      if (totalInterval > 0) {
        // 时间进度百分比（粗略估计使用率）
        const timeProgress = (elapsed / totalInterval) * 100;
        return Math.round(timeProgress * 10) / 10;
      }
    } catch {
      // 日期解析失败，返回null
    }
  }

  return null;
}

/**
 * 检查所有提供商的使用率
 */
function checkUsage(
  tracker: TrackerData,
  threshold: number
): UsageWarning[] {
  const warnings: UsageWarning[] = [];

  for (const [provider, status] of Object.entries(tracker.providers)) {
    if (!status) continue;

    const usage = calculateUsage(provider, status);
    if (usage !== null && usage >= threshold) {
      warnings.push({
        provider,
        usage,
        threshold,
      });
    }
  }

  return warnings;
}

/**
 * 格式化警告输出
 */
function formatWarnings(warnings: UsageWarning[]): string {
  if (warnings.length === 0) {
    return "";
  }

  const lines = ["[omo-quota] 配额警告:"];
  for (const warning of warnings) {
    lines.push(
      `  • ${warning.provider}: ${warning.usage}% (超过${warning.threshold}%阈值)`
    );
  }
  return lines.join("\n");
}

/**
 * Session Monitor Hook
 *
 * 监听session.update和session.idle事件，检查配额使用率
 * 符合 Hooks.event 类型: (input: { event: Event }) => Promise<void>
 */
export const sessionMonitorHook = async (
  input: { event: Event }
): Promise<void> => {
  const { event } = input;
  const { warningThreshold, trackerPath } = DEFAULT_CONFIG;

  // 仅处理特定事件类型
  const eventType = event.type as string;
  const handledTypes = ["session.update", "session.idle", "session.start"];

  if (!handledTypes.includes(eventType)) {
    return;
  }

  try {
    // 读取tracker文件
    const tracker = loadTracker(trackerPath);
    if (!tracker) {
      // tracker文件不存在，跳过检查
      return;
    }

    // 检查使用率
    const warnings = checkUsage(tracker, warningThreshold);

    // 输出警告
    if (warnings.length > 0) {
      console.log(formatWarnings(warnings));
    }
  } catch {
    // 不抛出错误，静默失败
  }
};

/**
 * 创建带自定义配置的hook工厂函数
 */
export function createSessionMonitorHook(
  config: Partial<SessionMonitorConfig>
): (input: { event: Event }) => Promise<void> {
  const fullConfig: SessionMonitorConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return async (input: { event: Event }): Promise<void> => {
    const { event } = input;
    const { warningThreshold, trackerPath } = fullConfig;

    // 仅处理特定事件类型
    const eventType = event.type as string;
    const handledTypes = ["session.update", "session.idle", "session.start"];

    if (!handledTypes.includes(eventType)) {
      return;
    }

    try {
      // 读取tracker文件
      const tracker = loadTracker(trackerPath);
      if (!tracker) {
        return;
      }

      // 检查使用率
      const warnings = checkUsage(tracker, warningThreshold);

      // 输出警告
      if (warnings.length > 0) {
        console.log(formatWarnings(warnings));
      }
    } catch {
      // 静默失败
    }
  };
}

// 导出默认配置供外部使用
export { DEFAULT_CONFIG };
