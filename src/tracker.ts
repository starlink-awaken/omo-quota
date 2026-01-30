import { readFileSync, writeFileSync, existsSync } from 'fs';
import { PATHS } from './config.js';
import type { QuotaTracker, HourlyResetProvider, StrategyType } from './types.js';

export function loadTracker(): QuotaTracker | null {
  try {
    if (!existsSync(PATHS.tracker)) {
      return null;
    }
    const content = readFileSync(PATHS.tracker, 'utf-8');
    return JSON.parse(content) as QuotaTracker;
  } catch (error) {
    console.error('读取追踪文件失败:', error);
    return null;
  }
}

export function saveTracker(tracker: QuotaTracker): void {
  try {
    writeFileSync(PATHS.tracker, JSON.stringify(tracker, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存追踪文件失败:', error);
    throw error;
  }
}

export function createDefaultTracker(): QuotaTracker {
  const now = new Date();
  const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  const hourlyProvider: HourlyResetProvider = {
    lastReset: now.toISOString(),
    nextReset: fiveHoursLater.toISOString(),
    resetInterval: '5h',
  };

  return {
    providers: {
      anthropic: { ...hourlyProvider },
      'google-1': { ...hourlyProvider },
      'google-2': { ...hourlyProvider },
      zhipuai: { ...hourlyProvider },
      'github-copilot-premium': {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        used: 0,
        limit: 300,
      },
      deepseek: {
        balance: '¥300',
        currency: 'CNY',
      },
      siliconflow: {
        balance: '¥200',
        currency: 'CNY',
      },
      openrouter: {
        balance: '$100',
        currency: 'USD',
      },
    },
    currentStrategy: 'balanced',
  };
}

export function updateStrategy(strategy: StrategyType): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }
  tracker.currentStrategy = strategy;
  saveTracker(tracker);
}

export function resetProvider(providerName: string): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }

  const provider = tracker.providers[providerName];
  if (!provider) {
    throw new Error(`未知的提供者: ${providerName}`);
  }

  if ('resetInterval' in provider) {
    const now = new Date();
    const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    provider.lastReset = now.toISOString();
    provider.nextReset = fiveHoursLater.toISOString();
    saveTracker(tracker);
  } else {
    throw new Error(`提供者 ${providerName} 不是 5 小时重置资源`);
  }
}

export function resetAllHourlyProviders(): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在,请先运行 omo-quota init');
  }

  const now = new Date();
  const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  for (const [name, provider] of Object.entries(tracker.providers)) {
    if (provider && 'resetInterval' in provider) {
      provider.lastReset = now.toISOString();
      provider.nextReset = fiveHoursLater.toISOString();
    }
  }

  saveTracker(tracker);
}

export function updateUsage(providerName: string, usage: number): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }

  const provider = tracker.providers[providerName];
  if (!provider) {
    throw new Error(`未知的提供者: ${providerName}`);
  }

  if ('used' in provider) {
    provider.used = usage;
    saveTracker(tracker);
  } else if ('resetInterval' in provider) {
    provider.usage = usage;
    saveTracker(tracker);
  } else {
    throw new Error(`提供者 ${providerName} 不支持用量更新`);
  }
}
