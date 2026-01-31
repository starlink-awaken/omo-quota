/**
 * omo-quota Plugin Type Definitions
 *
 * Re-exports core types from @omo-quota/core and @opencode-ai/plugin,
 * adding plugin-specific configuration types.
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

// Re-export all core types from @omo-quota/core
export * from "@omo-quota/core";

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
 * Strategy configuration for display
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
