/**
 * Strategy configuration types
 *
 * Defines the structure of strategy files used by oh-my-opencode.
 */

/**
 * Strategy version information
 */
export interface StrategyVersion {
  major: number;
  minor: number;
  patch: number;
  schema: string;
}

/**
 * Agent configuration in strategy
 */
export interface AgentConfig {
  model: string;
  variant?: 'max' | 'high' | 'medium' | 'low' | 'xhigh';
  primary_provider?: string;
  fallback_providers?: string[];
  description?: string;
  tags?: string[];
}

/**
 * Category configuration in strategy
 */
export interface CategoryConfig {
  model: string;
  variant?: 'max' | 'high' | 'medium' | 'low' | 'xhigh';
  description?: string;
}

/**
 * Provider models configuration
 */
export interface ProviderModels {
  models: string[];
  priority?: number;
  status?: 'available' | 'degraded' | 'unavailable';
  description?: string;
}

/**
 * Strategy-level providers configuration
 */
export interface StrategyProviders {
  [providerName: string]: string[];
}

/**
 * Strategy metadata
 */
export interface StrategyMetadata {
  id: string;
  name: string;
  description: string;
  version: StrategyVersion;
  type: 'performance' | 'balanced' | 'economical' | 'custom';
  costLevel: number;
  performanceLevel: number;
  useCases: string[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
}

/**
 * Complete strategy configuration
 */
export interface StrategyConfig {
  $schema?: string;
  _metadata?: StrategyMetadata;
  description: string;
  providers?: StrategyProviders;
  agents: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  extensions?: Record<string, unknown>;
}

/**
 * Strategy template
 */
export interface StrategyTemplate {
  name: string;
  description: string;
  baseConfig: Partial<StrategyConfig>;
  customizations?: {
    path: string;
    type: string;
    description: string;
    defaultValue?: unknown;
    options?: unknown[];
  }[];
}

/**
 * Strategy generation options
 */
export interface StrategyGeneratorOptions {
  type: 'performance' | 'balanced' | 'economical' | 'custom';
  name?: string;
  description?: string;
  primaryProvider?: string;
  enableProviders?: boolean;
  format?: 'json' | 'jsonc';
  includeComments?: boolean;
  customAgents?: Record<string, Partial<AgentConfig>>;
  customCategories?: Record<string, Partial<CategoryConfig>>;
  baseTemplate?: string;
}

/**
 * Strategy validation result
 */
export interface StrategyValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  severity: 'warning';
}

/**
 * Validation info
 */
export interface ValidationInfo {
  code: string;
  message: string;
  path?: string;
  severity: 'info';
}

/**
 * Migration rule
 */
export interface MigrationRule {
  fromVersion: string;
  toVersion: string;
  migrate: (config: unknown) => StrategyConfig;
}

/**
 * Init configuration
 */
export interface InitConfig {
  strategiesDir: string;
  generateDefaultStrategies: boolean;
  defaultStrategy: 'performance' | 'balanced' | 'economical';
  createBackup: boolean;
  validate: boolean;
  customStrategies?: {
    name: string;
    config: Partial<StrategyConfig>;
  }[];
}
