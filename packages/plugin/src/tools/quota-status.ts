/**
 * quota-status tool
 *
 * Uses @omo-quota/core for tracker loading and type definitions.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin";
import type { ToolContext } from "@opencode-ai/plugin";
import {
  loadTrackerOrDefault,
  getTimeUntilReset,
  isHourlyResetProvider,
  isMonthlyResetProvider,
  isBalanceProvider,
  PROVIDER_NAMES,
  STRATEGY_NAMES,
  type HourlyResetProvider,
  type MonthlyResetProvider,
  type BalanceProvider,
  type ProviderData,
} from "@omo-quota/core";

/**
 * Format provider status line
 */
function formatProviderStatus(
  name: string,
  provider: ProviderData
): string {
  const displayName = PROVIDER_NAMES[name] || name;

  if (isHourlyResetProvider(provider)) {
    const usage = provider.usage ?? 0;
    const percentage = usage > 0 ? `${usage}%` : "活跃";
    const timeLeft = getTimeUntilReset(provider.nextReset);
    const isExpired = timeLeft === '已过期';
    const isWarning = usage > 80;

    let status = `  • ${displayName}: ${percentage} - ${timeLeft}`;

    if (isWarning) {
      status += " ⚠️";
    } else if (isExpired) {
      status += " ❌";
    } else {
      status += " ✅";
    }

    return status;
  }

  if (isMonthlyResetProvider(provider)) {
    const percentage = Math.round((provider.used / provider.limit) * 100);
    const isWarning = percentage > 80;

    let status = `  • ${displayName}: ${provider.used}/${provider.limit} (${percentage}%)`;

    if (isWarning) {
      status += " ⚠️";
    } else {
      status += " ✅";
    }

    return status;
  }

  if (isBalanceProvider(provider)) {
    return `  • ${displayName}: ${provider.balance}`;
  }

  return `  • ${displayName}: 未知类型`;
}

/**
 * Get warnings for providers
 */
function getWarnings(providers: Record<string, ProviderData>): string[] {
  const warnings: string[] = [];

  for (const [name, provider] of Object.entries(providers)) {
    if (isHourlyResetProvider(provider)) {
      const timeLeft = getTimeUntilReset(provider.nextReset);
      if (timeLeft === '已过期') {
        warnings.push(`${PROVIDER_NAMES[name] || name} 配额已过期，请重置`);
      }
    }

    if (isMonthlyResetProvider(provider)) {
      const percentage = Math.round((provider.used / provider.limit) * 100);
      if (percentage > 90) {
        warnings.push(
          `${PROVIDER_NAMES[name] || name} 配额即将耗尽 (${percentage}%)`
        );
      }
    }
  }

  return warnings;
}

/**
 * quota-status tool
 */
export const quotaStatusTool: ToolDefinition = tool({
  description: "Get current AI quota status for all providers",
  args: {},
  async execute(_args: Record<string, never>, _context: ToolContext): Promise<string> {
    const tracker = loadTrackerOrDefault();

    // 当前策略
    const strategyName = STRATEGY_NAMES[tracker.currentStrategy] || tracker.currentStrategy;
    let output = `📊 当前策略: ${tracker.currentStrategy} (${strategyName})\n\n`;

    // 提供商状态
    output += "🔌 提供商状态:\n";

    // 按类型分组提供商
    const hourlyProviders: Array<[string, HourlyResetProvider]> = [];
    const monthlyProviders: Array<[string, MonthlyResetProvider]> = [];
    const balanceProviders: Array<[string, BalanceProvider]> = [];

    for (const [name, provider] of Object.entries(tracker.providers)) {
      if (isHourlyResetProvider(provider)) {
        hourlyProviders.push([name, provider]);
      } else if (isMonthlyResetProvider(provider)) {
        monthlyProviders.push([name, provider]);
      }
    }

    // 输出小时重置类型的提供商
    if (hourlyProviders.length > 0) {
      output += "\n  🕐 小时重置资源:\n";
      for (const [name, provider] of hourlyProviders) {
        output += formatProviderStatus(name, provider) + "\n";
      }
    }

    // 输出月度重置类型的提供商
    if (monthlyProviders.length > 0) {
      output += "\n  📅 月度资源:\n";
      for (const [name, provider] of monthlyProviders) {
        output += formatProviderStatus(name, provider) + "\n";
      }
    }

    // 输出余额类型的提供商
    for (const [name, provider] of Object.entries(tracker.providers)) {
      if (isBalanceProvider(provider)) {
        output += `\n  💰 ${PROVIDER_NAMES[name] || name}: ${provider.balance}\n`;
      }
    }

    // 输出特殊提供商（如 unlimited）
    if (tracker.providers["github-copilot-free"]) {
      output += "\n  ♾️ GitHub Copilot Free: unlimited\n";
    }

    // 警告信息
    const warnings = getWarnings(tracker.providers);
    if (warnings.length > 0) {
      output += "\n⚠️ 警告:\n";
      for (const warning of warnings) {
        output += `  ${warning}\n`;
      }
    }

    return output.trim();
  },
});

export default quotaStatusTool;
