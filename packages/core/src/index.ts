/**
 * @omo-quota/core
 *
 * Core library for Oh-My-OpenCode quota management.
 * Provides shared types, utilities, and business logic for CLI and Plugin.
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// Re-export commonly used types directly
export type {
  TrackerData,
  QuotaTracker,
  ProviderData,
  ProviderStatus,
  HourlyResetProvider,
  MonthlyResetProvider,
  BalanceProvider,
  StrategyType,
  StrategyName,
  ModelPricing,
  ProviderPricing,
  QuotaStatus,
  QuotaSyncResult,
  MessageData,
  CostCalculation,
  CostReport,
  CostReportEntry,
} from './types';

// Export constants
export { STRATEGIES, STRATEGY_NAMES, PROVIDER_NAMES } from './types';

// ============================================================================
// TRACKER
// ============================================================================

export * from './tracker';

// ============================================================================
// CONFIG
// ============================================================================

export * from './config';

// ============================================================================
// PRICING
// ============================================================================

export * from './pricing';

// ============================================================================
// ERRORS
// ============================================================================

export * from './errors';

// ============================================================================
// UTILS
// ============================================================================

export * from './utils';
