import { tool, type ToolDefinition } from "@opencode-ai/plugin";
import type { ToolContext } from "@opencode-ai/plugin";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Tracker 文件路径
const TRACKER_PATH = join(homedir(), ".omo-quota-tracker.json");

// 提供商类型
interface HourlyResetProvider {
  lastReset: string;
  nextReset: string;
  resetInterval: string;
  usage?: number;
}

interface MonthlyResetProvider {
  month: string;
  used: number;
  limit: number;
}

interface BalanceProvider {
  balance: string;
  currency: string;
}

type ProviderData = HourlyResetProvider | MonthlyResetProvider | BalanceProvider;

interface TrackerData {
  providers: Record<string, ProviderData>;
  currentStrategy: string;
}

// 提供商显示名称映射
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
};

// 策略名称映射
const STRATEGY_NAMES: Record<string, string> = {
  performance: "极致性能型",
  balanced: "均衡实用型",
  economical: "极致省钱型",
};

/**
 * 加载 tracker 数据
 */
function loadTracker(): TrackerData | null {
  try {
    if (!existsSync(TRACKER_PATH)) {
      return null;
    }
    const content = readFileSync(TRACKER_PATH, "utf-8");
    return JSON.parse(content) as TrackerData;
  } catch {
    return null;
  }
}

/**
 * 计算距离重置的剩余时间
 */
function getTimeUntilReset(nextReset: string): string {
  const now = new Date();
  const reset = new Date(nextReset);
  const diff = reset.getTime() - now.getTime();

  if (diff < 0) {
    return "已过期";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}小时${minutes}分后`;
  }
  return `${minutes}分钟后`;
}

/**
 * 判断是否为小时重置类型的提供商
 */
function isHourlyResetProvider(
  provider: ProviderData
): provider is HourlyResetProvider {
  return "resetInterval" in provider;
}

/**
 * 判断是否为月度重置类型的提供商
 */
function isMonthlyResetProvider(
  provider: ProviderData
): provider is MonthlyResetProvider {
  return "month" in provider && "limit" in provider;
}

/**
 * 判断是否为余额类型的提供商
 */
function isBalanceProvider(
  provider: ProviderData
): provider is BalanceProvider {
  return "balance" in provider && "currency" in provider;
}

/**
 * 格式化提供商状态行
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
    const isExpired = timeLeft === "已过期";
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
 * 获取警告信息
 */
function getWarnings(providers: Record<string, ProviderData>): string[] {
  const warnings: string[] = [];

  for (const [name, provider] of Object.entries(providers)) {
    if (isHourlyResetProvider(provider)) {
      const timeLeft = getTimeUntilReset(provider.nextReset);
      if (timeLeft === "已过期") {
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
 * quota-status 工具
 */
export const quotaStatusTool: ToolDefinition = tool({
  description: "Get current AI quota status for all providers",
  args: {},
  async execute(_args: Record<string, never>, _context: ToolContext): Promise<string> {
    const tracker = loadTracker();

    // 默认状态（tracker 不存在时）
    if (!tracker || Object.keys(tracker.providers).length === 0) {
      return `📊 OMO-Quota 状态

⚠️ 未找到配额追踪数据

请先初始化配额追踪:
  omo-quota init

或检查 tracker 文件是否存在:
  ${TRACKER_PATH}`;
    }

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

// 默认导出
export default quotaStatusTool;
