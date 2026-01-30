export interface ProviderStatus {
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

export interface TrackerData {
  providers: Record<string, ProviderStatus>;
  currentStrategy: string;
}

// QuotaTracker 类型 - 用于 tracker.ts
export interface QuotaTracker {
  providers: Record<string, HourlyResetProvider | MonthlyResetProvider | BalanceProvider>;
  currentStrategy: StrategyType;
}

// 按小时重置的提供商
export interface HourlyResetProvider {
  lastReset: string;
  nextReset: string;
  resetInterval: string;
  usage?: number;
}

// 按月重置的提供商
export interface MonthlyResetProvider {
  month: string;
  used: number;
  limit: number;
}

// 余额类型的提供商
export interface BalanceProvider {
  balance: string;
  currency: string;
}

// 策略类型
export type StrategyType = 'performance' | 'balanced' | 'economical';

const getBasePath = () => {
  return process.env.OMO_QUOTA_HOME || `${process.env.HOME}/omo-quota`;
};

export const TRACKER_PATH = `${process.env.HOME}/.omo-quota-tracker.json`;
export const CONFIG_PATH = `${process.env.HOME}/.config/opencode/oh-my-opencode.jsonc`;
export const STRATEGIES_DIR = `${process.env.HOME}/.config/opencode/strategies`;
export const BACKUP_PATH = `${process.env.HOME}/.config/opencode/oh-my-opencode.backup.jsonc`;
export const BASE_PATH = getBasePath();

// 提供商配置 - 支持回退链
export interface ProviderConfig {
  models: string[]; // 该提供商支持的模型列表
}

// 策略级别的提供商回退链配置
export interface StrategyProviders {
  [provider: string]: string[]; // 提供商名称到模型列表的映射
}

// 策略配置接口（如果策略文件包含 providers 字段）
export interface StrategyWithProviders {
  $schema?: string;
  description: string;
  providers?: StrategyProviders; // 可选：提供商回退链配置
  agents?: Record<string, { model: string; primary_provider?: string; fallback_providers?: string[] }>;
  categories?: Record<string, { model: string }>;
}

export const STRATEGIES = {
  performance: 'strategy-1-performance.jsonc',
  balanced: 'strategy-2-balanced.jsonc',
  economical: 'strategy-3-economical.jsonc',
} as const;

export type StrategyName = keyof typeof STRATEGIES;

// 导出策略相关类型
export * from './types/strategy.js';
