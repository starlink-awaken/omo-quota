/**
 * Core type definitions for omo-quota
 *
 * This module exports all shared types used across CLI and Plugin.
 */

// ============================================================================
// PROVIDER TYPES
// ============================================================================

/**
 * Provider that resets on a hourly basis
 */
export interface HourlyResetProvider {
  lastReset: string;
  nextReset: string;
  resetInterval: string;
  usage?: number;
}

/**
 * Provider that resets on a monthly basis
 */
export interface MonthlyResetProvider {
  month: string;
  used: number;
  limit: number;
}

/**
 * Provider with balance-based quota
 */
export interface BalanceProvider {
  balance: string;
  currency: string;
}

/**
 * Union type for all provider types
 */
export type ProviderData = HourlyResetProvider | MonthlyResetProvider | BalanceProvider;

/**
 * Provider status (legacy, for compatibility)
 */
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

// ============================================================================
// TRACKER TYPES
// ============================================================================

/**
 * Tracker data structure
 */
export interface TrackerData {
  providers: Record<string, ProviderStatus>;
  currentStrategy: string;
}

/**
 * Quota tracker with typed providers
 */
export interface QuotaTracker {
  providers: Record<string, HourlyResetProvider | MonthlyResetProvider | BalanceProvider>;
  currentStrategy: StrategyType;
}

// ============================================================================
// STRATEGY TYPES
// ============================================================================

/**
 * Strategy type
 */
export type StrategyType = 'performance' | 'balanced' | 'economical';

/**
 * Strategy names to file mapping
 */
export const STRATEGIES = {
  performance: 'strategy-1-performance.jsonc',
  balanced: 'strategy-2-balanced.jsonc',
  economical: 'strategy-3-economical.jsonc',
} as const;

/**
 * Strategy name type
 */
export type StrategyName = keyof typeof STRATEGIES;

/**
 * Provider configuration with model list
 */
export interface ProviderConfig {
  models: string[];
}

/**
 * Strategy-level provider fallback chain configuration
 */
export interface StrategyProviders {
  [provider: string]: string[];
}

/**
 * Agent configuration in strategy
 */
export interface AgentConfig {
  model: string;
  primary_provider?: string;
  fallback_providers?: string[];
}

/**
 * Strategy configuration with providers
 */
export interface StrategyWithProviders {
  $schema?: string;
  description: string;
  providers?: StrategyProviders;
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, { model: string }>;
}

/**
 * Strategy display names
 */
export const STRATEGY_NAMES: Record<string, string> = {
  performance: '极致性能型',
  balanced: '均衡实用型',
  economical: '极致省钱型',
} as const;

// ============================================================================
// PRICING TYPES
// ============================================================================

/**
 * Model pricing data
 */
export interface ModelPricing {
  prompt: number;
  completion: number;
  cacheRead?: number;
  cacheWrite?: number;
}

/**
 * Provider pricing data
 */
export interface ProviderPricing {
  [model: string]: ModelPricing;
}

// ============================================================================
// PROVIDER DISPLAY NAMES
// ============================================================================

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<string, string> = {
  anthropic: 'Claude Pro',
  'google-1': 'Gemini Pro #1',
  'google-2': 'Gemini Pro #2',
  zhipuai: 'ZhiPuAI Max',
  fangzhou: '方舟 CodingPlan Pro',
  'github-copilot-premium': 'GitHub Copilot Premium',
  deepseek: 'DeepSeek',
  siliconflow: '硅基流动',
  openrouter: 'OpenRouter',
  'github-copilot-free': 'GitHub Copilot Free',
} as const;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error codes for quota operations
 */
export enum ErrorCode {
  TRACKER_NOT_FOUND = 'TRACKER_NOT_FOUND',
  TRACKER_INVALID = 'TRACKER_INVALID',
  STRATEGY_NOT_FOUND = 'STRATEGY_NOT_FOUND',
  STRATEGY_INVALID = 'STRATEGY_INVALID',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_INVALID = 'PROVIDER_INVALID',
  PATH_ACCESS_DENIED = 'PATH_ACCESS_DENIED',
  INVALID_USAGE = 'INVALID_USAGE',
}

/**
 * Base error class for quota operations
 */
export class OmoQuotaError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'OmoQuotaError';
    this.code = code;
    this.context = context;
  }
}

/**
 * Tracker not found error
 */
export class TrackerNotFoundError extends OmoQuotaError {
  constructor(path?: string) {
    super(
      ErrorCode.TRACKER_NOT_FOUND,
      path
        ? `Tracker file not found: ${path}`
        : 'Tracker file not found. Run "omo-quota init" to initialize.',
      { path }
    );
    this.name = 'TrackerNotFoundError';
  }
}

/**
 * Strategy not found error
 */
export class StrategyNotFoundError extends OmoQuotaError {
  constructor(strategy: string) {
    super(
      ErrorCode.STRATEGY_NOT_FOUND,
      `Strategy not found: ${strategy}`,
      { strategy }
    );
    this.name = 'StrategyNotFoundError';
  }
}

/**
 * Config not found error
 */
export class ConfigNotFoundError extends OmoQuotaError {
  constructor(path?: string) {
    super(
      ErrorCode.CONFIG_NOT_FOUND,
      path
        ? `Config file not found: ${path}`
        : 'Config file not found.',
      { path }
    );
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * Provider not found error
 */
export class ProviderNotFoundError extends OmoQuotaError {
  constructor(provider: string) {
    super(
      ErrorCode.PROVIDER_NOT_FOUND,
      `Provider not found: ${provider}`,
      { provider }
    );
    this.name = 'ProviderNotFoundError';
  }
}

/**
 * Invalid usage error
 */
export class InvalidUsageError extends OmoQuotaError {
  constructor(message: string) {
    super(ErrorCode.INVALID_USAGE, message);
    this.name = 'InvalidUsageError';
  }
}

// ============================================================================
// QUOTA STATUS TYPES
// ============================================================================

/**
 * Quota status for a provider (used in plugin)
 */
export interface QuotaStatus {
  provider: string;
  used: number;
  limit: number;
  percentage: number;
  resetsIn?: string;
  status: 'ok' | 'warning' | 'critical';
}

/**
 * Quota sync result
 */
export interface QuotaSyncResult {
  success: boolean;
  quotas: QuotaStatus[];
  syncedAt: string;
  error?: string;
}

/**
 * Cost report entry
 */
export interface CostReportEntry {
  provider: string;
  model: string;
  cost: number;
  requests: number;
  tokens: number;
}

/**
 * Cost report
 */
export interface CostReport {
  totalCost: number;
  byProvider: CostReportEntry[];
  period: {
    start: string;
    end: string;
  };
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Token usage data
 */
export interface TokenUsage {
  input: number;
  output: number;
  reasoning?: number;
  cache?: {
    read: number;
    write: number;
  };
}

/**
 * Message data from OpenCode storage
 */
export interface MessageData {
  id: string;
  providerID: string;
  modelID: string;
  tokens: TokenUsage;
  time: {
    created: number;
    completed?: number;
  };
}

// ============================================================================
// COST CALCULATION TYPES
// ============================================================================

/**
 * Cost calculation result
 */
export interface CostCalculation {
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
}

/**
 * Aggregated cost data
 */
export interface AggregatedCost {
  totalCost: number;
  byProvider: Map<string, number>;
  byModel: Map<string, number>;
  totalTokens: number;
}

// Re-export strategy types
export * from './strategy';
