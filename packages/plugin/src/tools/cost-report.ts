/**
 * cost-report tool
 *
 * Generates cost analysis reports based on tracker data and message history.
 * Supports daily and monthly reporting periods.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { existsSync } from 'fs';
import { join } from 'path';

// Default message storage path for oh-my-opencode
const DEFAULT_STORAGE_PATH = `${process.env.HOME}/.local/share/opencode/storage/message`;
// Tracker data path
const TRACKER_PATH = `${process.env.HOME}/.omo-quota-tracker.json`;

interface MessageData {
  id: string;
  providerID: string;
  modelID: string;
  tokens: {
    input: number;
    output: number;
    reasoning?: number;
    cache?: {
      read: number;
      write: number;
    };
  };
  time: {
    created: number;
    completed?: number;
  };
}

interface ModelPricing {
  prompt: number;
  completion: number;
  cacheRead?: number;
  cacheWrite?: number;
}

interface ProviderPricing {
  [model: string]: ModelPricing;
}

// Pricing table (in USD per million tokens)
const PRICING_TABLE: Record<string, ProviderPricing> = {
  'openai': {
    'gpt-4': {
      prompt: 0.03 / 1000,
      completion: 0.06 / 1000,
    },
    'gpt-4-turbo': {
      prompt: 0.01 / 1000,
      completion: 0.03 / 1000,
    },
    'gpt-4o': {
      prompt: 0.005 / 1000,
      completion: 0.015 / 1000,
    },
    'gpt-4o-mini': {
      prompt: 0.00015 / 1000,
      completion: 0.0006 / 1000,
    },
    'gpt-3.5-turbo': {
      prompt: 0.0005 / 1000,
      completion: 0.0015 / 1000,
    },
  },
  'anthropic': {
    'claude-opus-4': {
      prompt: 0.015 / 1000,
      completion: 0.075 / 1000,
      cacheRead: 0.0015 / 1000,
      cacheWrite: 0.01875 / 1000,
    },
    'claude-sonnet-4': {
      prompt: 0.003 / 1000,
      completion: 0.015 / 1000,
      cacheRead: 0.0003 / 1000,
      cacheWrite: 0.00375 / 1000,
    },
    'claude-sonnet-3-5': {
      prompt: 0.003 / 1000,
      completion: 0.015 / 1000,
      cacheRead: 0.0003 / 1000,
      cacheWrite: 0.00375 / 1000,
    },
    'claude-haiku-3-5': {
      prompt: 0.001 / 1000,
      completion: 0.005 / 1000,
      cacheRead: 0.0001 / 1000,
      cacheWrite: 0.00125 / 1000,
    },
  },
  'google': {
    'gemini-2.0-flash-exp': {
      prompt: 0,
      completion: 0,
    },
    'gemini-2.0-flash-thinking-exp': {
      prompt: 0,
      completion: 0,
    },
    'gemini-1.5-pro': {
      prompt: 0.00125 / 1000,
      completion: 0.005 / 1000,
      cacheRead: 0.0003125 / 1000,
    },
    'gemini-1.5-flash': {
      prompt: 0.000075 / 1000,
      completion: 0.0003 / 1000,
      cacheRead: 0.00001875 / 1000,
    },
  },
  'zhipuai': {
    'glm-4-plus': {
      prompt: 0.05 / 1000,
      completion: 0.05 / 1000,
    },
    'glm-4-air': {
      prompt: 0.001 / 1000,
      completion: 0.001 / 1000,
    },
    'glm-4-airx': {
      prompt: 0.01 / 1000,
      completion: 0.01 / 1000,
    },
    'glm-4-flash': {
      prompt: 0.0001 / 1000,
      completion: 0.0001 / 1000,
    },
  },
  'github-copilot': {
    'gpt-4o': {
      prompt: 0,
      completion: 0,
    },
    'gpt-4o-mini': {
      prompt: 0,
      completion: 0,
    },
    'o1-preview': {
      prompt: 0,
      completion: 0,
    },
    'o1-mini': {
      prompt: 0,
      completion: 0,
    },
  },
  'deepseek': {
    'deepseek-chat': {
      prompt: 0.0014 / 1000,
      completion: 0.0028 / 1000,
      cacheRead: 0.00014 / 1000,
    },
    'deepseek-reasoner': {
      prompt: 0.0055 / 1000,
      completion: 0.0055 / 1000,
      cacheRead: 0.00014 / 1000,
    },
  },
};

/**
 * Get pricing for a provider/model combination
 */
function getPricing(provider: string, model: string): ModelPricing | null {
  const providerKey = provider.toLowerCase().split('-')[0];
  const modelKey = model.toLowerCase();

  const providerPricing = PRICING_TABLE[providerKey];
  if (!providerPricing) {
    return null;
  }

  for (const [key, pricing] of Object.entries(providerPricing)) {
    if (modelKey.includes(key) || key.includes(modelKey)) {
      return pricing;
    }
  }

  return null;
}

/**
 * Parse a single message file
 */
async function parseMessage(filePath: string): Promise<MessageData | null> {
  try {
    const file = Bun.file(filePath);
    const content = await file.json();

    if (content.role !== 'assistant' || !content.tokens) {
      return null;
    }

    return {
      id: content.id,
      providerID: content.providerID || 'unknown',
      modelID: content.modelID || 'unknown',
      tokens: {
        input: content.tokens.input || 0,
        output: content.tokens.output || 0,
        reasoning: content.tokens.reasoning,
        cache: content.tokens.cache
      },
      time: {
        created: content.time?.created || Date.now(),
        completed: content.time?.completed
      }
    };
  } catch {
    return null;
  }
}

/**
 * Scan a single session directory for messages
 */
async function scanSessionDirectory(sessionDir: string): Promise<MessageData[]> {
  const messages: MessageData[] = [];

  try {
    const glob = new Bun.Glob('msg_*.json');
    const files = Array.from(glob.scanSync(sessionDir));

    for (const file of files) {
      const fullPath = `${sessionDir}/${file}`;
      const data = await parseMessage(fullPath);
      if (data) {
        messages.push(data);
      }
    }
  } catch {
    // Session directory might not exist or be inaccessible
  }

  return messages;
}

/**
 * Scan all session directories
 */
async function scanAllSessions(storageDir: string): Promise<MessageData[]> {
  const allMessages: MessageData[] = [];

  if (!existsSync(storageDir)) {
    return allMessages;
  }

  try {
    const glob = new Bun.Glob('ses_*');
    const sessions = Array.from(glob.scanSync(storageDir));

    for (const session of sessions) {
      const sessionPath = `${storageDir}/${session}`;
      const messages = await scanSessionDirectory(sessionPath);
      allMessages.push(...messages);
    }
  } catch {
    // Storage directory might not exist or be inaccessible
  }

  return allMessages;
}

/**
 * Calculate cost for a single message
 */
function calculateCost(message: MessageData): {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  promptCost: number;
  completionCost: number;
  cacheCost: number;
  totalCost: number;
} {
  const pricing = getPricing(message.providerID, message.modelID);

  const promptTokens = message.tokens.input || 0;
  const completionTokens = message.tokens.output || 0;
  const cacheReadTokens = message.tokens.cache?.read || 0;
  const cacheWriteTokens = message.tokens.cache?.write || 0;

  let promptCost = 0;
  let completionCost = 0;
  let cacheCost = 0;

  if (pricing) {
    promptCost = promptTokens * pricing.prompt;
    completionCost = completionTokens * pricing.completion;

    if (pricing.cacheRead && pricing.cacheWrite) {
      cacheCost = (cacheReadTokens * pricing.cacheRead) + (cacheWriteTokens * pricing.cacheWrite);
    }
  }

  return {
    provider: message.providerID,
    model: message.modelID,
    promptTokens,
    completionTokens,
    cacheReadTokens,
    cacheWriteTokens,
    promptCost,
    completionCost,
    cacheCost,
    totalCost: promptCost + completionCost + cacheCost,
  };
}

/**
 * Format currency value
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'CNY' || currency === '¥') {
    return `¥${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(4)}`;
}

/**
 * Format a number with thousand separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Get provider display name
 */
function formatProviderName(providerID: string): string {
  const nameMap: Record<string, string> = {
    'anthropic': 'anthropic',
    'openai': 'openai',
    'google': 'google',
    'zhipuai': 'zhipuai',
    'github-copilot': 'github',
    'deepseek': 'deepseek'
  };

  const key = providerID.toLowerCase().split('-')[0];
  return nameMap[key] || providerID;
}

/**
 * Filter messages by date range
 */
function filterMessagesByPeriod(
  messages: MessageData[],
  period: 'daily' | 'monthly'
): MessageData[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const threshold = period === 'daily' ? startOfDay : startOfMonth;

  return messages.filter(msg => msg.time.created >= threshold);
}

/**
 * Generate daily cost report
 */
async function generateDailyReport(): Promise<string> {
  const messages = await scanAllSessions(DEFAULT_STORAGE_PATH);

  if (messages.length === 0) {
    return '📊 成本报告（今日）\n\n未找到使用数据。请确保已运行同步命令。';
  }

  // Filter for today's messages
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayMessages = messages.filter(msg => msg.time.created >= startOfDay);

  if (todayMessages.length === 0) {
    return '📊 成本报告（今日）\n\n今日暂无使用记录。';
  }

  // Calculate costs
  const calculations = todayMessages.map(calculateCost);

  // Aggregate by provider
  const providerCosts = new Map<string, number>();
  let totalCost = 0;
  let totalTokens = 0;

  for (const calc of calculations) {
    const provider = formatProviderName(calc.provider);
    providerCosts.set(provider, (providerCosts.get(provider) || 0) + calc.totalCost);
    totalCost += calc.totalCost;
    totalTokens += calc.promptTokens + calc.completionTokens;
  }

  // Format report
  const lines: string[] = [];
  lines.push(`📊 成本报告（${today.toISOString().split('T')[0]}）\n`);
  lines.push(`总计: ${formatCurrency(totalCost)}\n`);
  lines.push('提供商:');

  // Sort by cost (descending)
  const sortedProviders = Array.from(providerCosts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [provider, cost] of sortedProviders) {
    const percentage = totalCost > 0 ? (cost / totalCost * 100).toFixed(1) : '0.0';
    lines.push(`  • ${provider}: ${formatCurrency(cost)} (${percentage}%)`);
  }

  lines.push(`\n总 tokens: ${formatNumber(totalTokens)}`);
  lines.push(`消息数: ${todayMessages.length}`);

  return lines.join('\n');
}

/**
 * Generate monthly cost report
 */
async function generateMonthlyReport(): Promise<string> {
  const messages = await scanAllSessions(DEFAULT_STORAGE_PATH);

  if (messages.length === 0) {
    return '📊 成本报告（本月）\n\n未找到使用数据。请确保已运行同步命令。';
  }

  // Filter for this month's messages
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthMessages = messages.filter(msg => msg.time.created >= startOfMonth);

  if (monthMessages.length === 0) {
    return '📊 成本报告（本月）\n\n本月暂无使用记录。';
  }

  // Calculate costs
  const calculations = monthMessages.map(calculateCost);

  // Aggregate by provider
  const providerCosts = new Map<string, number>();
  let totalCost = 0;
  let totalTokens = 0;

  for (const calc of calculations) {
    const provider = formatProviderName(calc.provider);
    providerCosts.set(provider, (providerCosts.get(provider) || 0) + calc.totalCost);
    totalCost += calc.totalCost;
    totalTokens += calc.promptTokens + calc.completionTokens;
  }

  // Calculate daily average
  const daysInMonth = now.getDate();
  const dailyAverage = totalCost / daysInMonth;

  // Format report
  const lines: string[] = [];
  lines.push(`📊 成本报告（${now.toISOString().substring(0, 7)}）\n`);
  lines.push(`总计: ${formatCurrency(totalCost)}`);
  lines.push(`日均: ${formatCurrency(dailyAverage)}`);
  lines.push(`已过天数: ${daysInMonth}\n`);
  lines.push('提供商:');

  // Sort by cost (descending)
  const sortedProviders = Array.from(providerCosts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [provider, cost] of sortedProviders) {
    const percentage = totalCost > 0 ? (cost / totalCost * 100).toFixed(1) : '0.0';
    lines.push(`  • ${provider}: ${formatCurrency(cost)} (${percentage}%)`);
  }

  lines.push(`\n总 tokens: ${formatNumber(totalTokens)}`);
  lines.push(`消息数: ${monthMessages.length}`);

  return lines.join('\n');
}

/**
 * Export the tool
 */
export const costReportTool: ToolDefinition = tool({
  description: 'Generate cost analysis report for AI usage. Reports costs by provider for daily or monthly periods.',
  args: {
    period: tool.schema.enum(['daily', 'monthly']).describe('Report period: daily for today, monthly for this month')
  },
  async execute(args, context): Promise<string> {
    try {
      if (args.period === 'daily') {
        return await generateDailyReport();
      } else {
        return await generateMonthlyReport();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return `❌ 生成报告失败: ${errorMsg}`;
    }
  }
});
