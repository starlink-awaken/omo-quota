export interface ProviderStatus {
  lastReset?: string;
  nextReset?: string;
  resetInterval?: string;
  usage?: number;
  limit?: number;
  month?: string;
}

export interface TrackerData {
  providers: Record<string, ProviderStatus>;
  currentStrategy: string;
}

export const TRACKER_PATH = `${process.env.HOME}/.omo-quota-tracker.json`;
export const CONFIG_PATH = `${process.env.HOME}/.config/opencode/oh-my-opencode.jsonc`;
export const STRATEGIES_DIR = `${process.env.HOME}/.config/opencode/strategies`;
export const BACKUP_PATH = `${process.env.HOME}/.config/opencode/oh-my-opencode.backup.jsonc`;

export const STRATEGIES = {
  performance: 'strategy-1-performance.jsonc',
  balanced: 'strategy-2-balanced.jsonc',
  economical: 'strategy-3-economical.jsonc',
} as const;

export type StrategyName = keyof typeof STRATEGIES;
