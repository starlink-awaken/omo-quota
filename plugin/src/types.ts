/**
 * omo-quota Plugin Type Definitions
 *
 * This module defines all types used throughout the omo-quota plugin,
 * re-exporting core types from @opencode-ai/plugin and adding
 * omo-quota-specific types.
 */

// Re-export core types from @opencode-ai/plugin
export type {
  Plugin,
  PluginInput,
  Hooks,
  ToolContext,
  ToolDefinition,
} from "@opencode-ai/plugin";

// Re-export types from @opencode-ai/sdk
export type {
  Event,
  Project,
  Model,
  Provider,
  Permission,
  UserMessage,
  Message,
  Part,
  Auth,
  Config,
} from "@opencode-ai/sdk";

/**
 * omo-quota plugin configuration
 */
export interface OmoQuotaConfig {
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Whether to automatically sync quota usage */
  autoSync: boolean;
  /** Warning threshold percentage (0-100) */
  warningThreshold: number;
  /** Whether to notify when quota is low */
  notifyOnLowQuota: boolean;
  /** Sync interval in milliseconds */
  syncInterval: number;
}

/**
 * Strategy type for quota management
 */
export type StrategyType = "performance" | "balanced" | "economical";

/**
 * Strategy configuration
 */
export interface Strategy {
  /** Strategy type */
  type: StrategyType;
  /** Strategy display name */
  name: string;
  /** Strategy description */
  description: string;
  /** Whether this is the active strategy */
  active: boolean;
}

/**
 * Quota status for a provider
 */
export interface QuotaStatus {
  /** Provider ID (e.g., "openai", "anthropic") */
  provider: string;
  /** Amount of quota used */
  used: number;
  /** Total quota limit */
  limit: number;
  /** Percentage used (0-100) */
  percentage: number;
  /** Time until quota resets (ISO 8601 duration string) */
  resetsIn?: string;
  /** Status indicator */
  status: "ok" | "warning" | "critical";
}

/**
 * Quota sync result
 */
export interface QuotaSyncResult {
  /** Whether the sync was successful */
  success: boolean;
  /** Synced quota statuses */
  quotas: QuotaStatus[];
  /** Timestamp of sync */
  syncedAt: string;
  /** Error message if sync failed */
  error?: string;
}

/**
 * Cost report entry
 */
export interface CostReportEntry {
  /** Provider ID */
  provider: string;
  /** Model ID */
  model: string;
  /** Total cost in USD */
  cost: number;
  /** Number of requests */
  requests: number;
  /** Number of tokens processed */
  tokens: number;
}

/**
 * Cost report summary
 */
export interface CostReport {
  /** Total cost across all providers */
  totalCost: number;
  /** Cost breakdown by provider */
  byProvider: CostReportEntry[];
  /** Report time range */
  period: {
    start: string;
    end: string;
  };
}

/**
 * Session monitor state
 */
export interface SessionMonitorState {
  /** Last sync timestamp */
  lastSync?: string;
  /** Current quota statuses */
  quotaStatuses: QuotaStatus[];
  /** Number of sessions monitored */
  sessionsMonitored: number;
}
