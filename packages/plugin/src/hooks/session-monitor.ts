/**
 * Session Monitor Hook
 *
 * 监听session事件，定期检查配额使用率，超过阈值时记录警告
 */

import type { Event } from "@opencode-ai/sdk";
import { join } from "path";
import { homedir } from "os";
import {
  loadTracker,
  calculateUsage as coreCalculateUsage,
  PROVIDER_NAMES,
} from "@omo-quota/core";

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

// 使用率警告信息
interface UsageWarning {
  provider: string;
  usage: number;
  threshold: number;
}

/**
 * 检查所有提供商的使用率
 */
function checkUsage(
  tracker: Record<string, unknown>,
  threshold: number
): UsageWarning[] {
  const warnings: UsageWarning[] = [];

  if (!tracker.providers) return warnings;

  for (const [provider, status] of Object.entries(tracker.providers)) {
    if (!status) continue;

    const usage = coreCalculateUsage(provider, status as Record<string, unknown>);
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
    const displayName = PROVIDER_NAMES[warning.provider] || warning.provider;
    lines.push(
      `  • ${displayName}: ${warning.usage}% (超过${warning.threshold}%阈值)`
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
