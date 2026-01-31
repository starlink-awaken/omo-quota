/**
 * Tracker module
 *
 * Provides functions for loading, saving, and manipulating quota tracker data.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type {
  TrackerData,
  QuotaTracker,
  HourlyResetProvider,
  MonthlyResetProvider,
  BalanceProvider,
  StrategyType,
} from '../types';

// ============================================================================
// PATHS
// ============================================================================

const DEFAULT_TRACKER_PATH = join(homedir(), '.omo-quota-tracker.json');

/**
 * Get tracker file path (supports test override via env var)
 */
export function getTrackerPath(): string {
  return process.env.OMO_QUOTA_TRACKER_PATH || DEFAULT_TRACKER_PATH;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if provider is hourly reset type
 */
export function isHourlyResetProvider(
  provider: unknown
): provider is HourlyResetProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'resetInterval' in provider
  );
}

/**
 * Check if provider is monthly reset type
 */
export function isMonthlyResetProvider(
  provider: unknown
): provider is MonthlyResetProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'month' in provider &&
    'limit' in provider
  );
}

/**
 * Check if provider is balance type
 */
export function isBalanceProvider(
  provider: unknown
): provider is BalanceProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'balance' in provider &&
    'currency' in provider
  );
}

// ============================================================================
// LOAD / SAVE
// ============================================================================

/**
 * Load tracker data from file
 */
export function loadTracker(trackerPath?: string): TrackerData | null {
  const path = trackerPath || getTrackerPath();

  if (!existsSync(path)) {
    return null;
  }

  try {
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data) as TrackerData;
  } catch (error) {
    console.error('读取追踪文件失败:', error);
    return null;
  }
}

/**
 * Load tracker data, return default if not exists
 */
export function loadTrackerOrDefault(defaultStrategy: StrategyType = 'balanced'): TrackerData {
  const tracker = loadTracker();
  if (tracker) {
    return tracker;
  }

  return {
    providers: {},
    currentStrategy: defaultStrategy,
  };
}

/**
 * Save tracker data to file
 */
export function saveTracker(data: TrackerData, trackerPath?: string): void {
  const path = trackerPath || getTrackerPath();

  try {
    // Ensure directory exists
    const dir = path.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存追踪文件失败:', error);
    throw error;
  }
}

/**
 * Create default tracker with all providers
 */
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

// ============================================================================
// STRATEGY OPERATIONS
// ============================================================================

/**
 * Update current strategy
 */
export function updateStrategy(strategy: StrategyType): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }
  tracker.currentStrategy = strategy;
  saveTracker(tracker);
}

/**
 * Get current strategy
 */
export function getCurrentStrategy(): StrategyType {
  const tracker = loadTracker();
  if (!tracker) {
    return 'balanced';
  }
  return tracker.currentStrategy as StrategyType;
}

// ============================================================================
// PROVIDER OPERATIONS
// ============================================================================

/**
 * Reset a single hourly provider
 */
export function resetProvider(providerName: string): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }

  const provider = tracker.providers[providerName];
  if (!provider) {
    throw new Error(`未知的提供者: ${providerName}`);
  }

  if (isHourlyResetProvider(provider)) {
    const now = new Date();
    const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    provider.lastReset = now.toISOString();
    provider.nextReset = fiveHoursLater.toISOString();
    saveTracker(tracker);
  } else {
    throw new Error(`提供者 ${providerName} 不是 5 小时重置资源`);
  }
}

/**
 * Reset all hourly providers
 */
export function resetAllHourlyProviders(): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }

  const now = new Date();
  const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  for (const [name, provider] of Object.entries(tracker.providers)) {
    if (provider && isHourlyResetProvider(provider)) {
      provider.lastReset = now.toISOString();
      provider.nextReset = fiveHoursLater.toISOString();
    }
  }

  saveTracker(tracker);
}

/**
 * Update provider usage
 */
export function updateUsage(providerName: string, usage: number): void {
  const tracker = loadTracker();
  if (!tracker) {
    throw new Error('追踪文件不存在，请先运行 omo-quota init');
  }

  const provider = tracker.providers[providerName];
  if (!provider) {
    throw new Error(`未知的提供者: ${providerName}`);
  }

  if (isMonthlyResetProvider(provider)) {
    provider.used = usage;
    saveTracker(tracker);
  } else if (isHourlyResetProvider(provider)) {
    provider.usage = usage;
    saveTracker(tracker);
  } else {
    throw new Error(`提供者 ${providerName} 不支持用量更新`);
  }
}

// ============================================================================
// CALCULATION
// ============================================================================

/**
 * Calculate next reset time
 */
export function calculateNextReset(interval: string): string {
  const now = new Date();
  const hours = interval === '5h' ? 5 : 24;
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Get time until reset (human readable)
 */
export function getTimeUntilReset(nextReset: string): string {
  const now = new Date();
  const reset = new Date(nextReset);
  const diff = reset.getTime() - now.getTime();

  if (diff < 0) return '已过期';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m 后`;
}

/**
 * Calculate provider usage percentage
 */
export function calculateUsage(
  provider: string,
  status: Record<string, unknown>
): number | null {
  // Monthly reset type
  if (
    'limit' in status &&
    typeof status.limit === 'number' &&
    'used' in status &&
    typeof status.used === 'number'
  ) {
    const percentage = (status.used / status.limit) * 100;
    return Math.round(percentage * 10) / 10;
  }

  // Balance type
  if ('balance' in status && typeof status.balance === 'string') {
    const balanceStr = status.balance;
    const match = balanceStr.match(/[\d.]+/);
    if (match) {
      const balance = parseFloat(match[0]);
      const currency = status.currency || 'CNY';
      const initialBalance = currency === 'CNY' ? 500 : 100;
      const usage = ((initialBalance - balance) / initialBalance) * 100;
      return Math.max(0, Math.min(100, Math.round(usage * 10) / 10));
    }
  }

  // Hourly reset type - based on time progress
  if ('nextReset' in status && typeof status.nextReset === 'string') {
    try {
      const now = Date.now();
      const nextReset = new Date(status.nextReset).getTime();
      const lastReset =
        'lastReset' in status && typeof status.lastReset === 'string'
          ? new Date(status.lastReset).getTime()
          : nextReset - 5 * 60 * 60 * 1000;

      const totalInterval = nextReset - lastReset;
      const elapsed = now - lastReset;

      if (totalInterval > 0) {
        const timeProgress = (elapsed / totalInterval) * 100;
        return Math.round(timeProgress * 10) / 10;
      }
    } catch {
      // Date parse failed
    }
  }

  return null;
}
