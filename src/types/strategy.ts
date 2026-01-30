/**
 * 策略文件数据结构定义
 *
 * 用于定义 oh-my-opencode 的策略配置文件结构
 * 支持完整的 agent 配置、类别配置和提供商回退链
 */

/**
 * 策略版本信息
 */
export interface StrategyVersion {
  major: number;
  minor: number;
  patch: number;
  schema: string;
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  /**
   * 主模型标识符，格式: provider/model
   * 例如: "anthropic/claude-opus-4-5"
   */
  model: string;

  /**
   * 模型变体/等级
   * 例如: "max", "high", "medium", "low"
   */
  variant?: 'max' | 'high' | 'medium' | 'low' | 'xhigh';

  /**
   * 主要提供商
   * 当有多个提供商支持同一模型时，指定优先使用的提供商
   */
  primary_provider?: string;

  /**
   * 回退提供商链
   * 当主提供商不可用时，按顺序尝试的备用提供商
   * 格式: ["provider/model1", "provider/model2", ...]
   */
  fallback_providers?: string[];

  /**
   * Agent 描述
   */
  description?: string;

  /**
   * 适用场景标签
   */
  tags?: string[];
}

/**
 * 类别配置
 */
export interface CategoryConfig {
  /**
   * 类别使用的模型
   */
  model: string;

  /**
   * 模型变体
   */
  variant?: 'max' | 'high' | 'medium' | 'low' | 'xhigh';

  /**
   * 类别描述
   */
  description?: string;
}

/**
 * 提供商支持的模型列表
 */
export interface ProviderModels {
  /**
   * 该提供商支持的模型列表
   */
  models: string[];

  /**
   * 提供商优先级（数字越小优先级越高）
   */
  priority?: number;

  /**
   * 提供商状态
   */
  status?: 'available' | 'degraded' | 'unavailable';

  /**
   * 提供商描述
   */
  description?: string;
}

/**
 * 策略级别的提供商配置
 * 定义每个提供商支持的模型，用于构建回退链
 */
export interface StrategyProviders {
  [providerName: string]: string[];
}

/**
 * 策略元数据
 */
export interface StrategyMetadata {
  /**
   * 策略唯一标识符
   */
  id: string;

  /**
   * 策略名称
   */
  name: string;

  /**
   * 策略描述
   */
  description: string;

  /**
   * 策略版本
   */
  version: StrategyVersion;

  /**
   * 策略类型
   */
  type: 'performance' | 'balanced' | 'economical' | 'custom';

  /**
   * 成本等级 (1-10, 10最高)
   */
  costLevel: number;

  /**
   * 性能等级 (1-10, 10最高)
   */
  performanceLevel: number;

  /**
   * 适用场景
   */
  useCases: string[];

  /**
   * 创建时间
   */
  createdAt?: string;

  /**
   * 更新时间
   */
  updatedAt?: string;

  /**
   * 作者
   */
  author?: string;
}

/**
 * 完整的策略配置文件结构
 */
export interface StrategyConfig {
  /**
   * JSON Schema 引用
   */
  $schema?: string;

  /**
   * 策略元数据
   */
  _metadata?: StrategyMetadata;

  /**
   * 策略描述（用户可见）
   */
  description: string;

  /**
   * 提供商回退链配置
   * 定义每个提供商支持的模型列表
   */
  providers?: StrategyProviders;

  /**
   * Agent 配置映射
   * 键为 agent 名称，值为对应的配置
   */
  agents: Record<string, AgentConfig>;

  /**
   * 类别配置映射
   * 键为类别名称，值为对应的配置
   */
  categories?: Record<string, CategoryConfig>;

  /**
   * 自定义扩展字段
   */
  extensions?: Record<string, any>;
}

/**
 * 策略模板接口
 */
export interface StrategyTemplate {
  /**
   * 模板名称
   */
  name: string;

  /**
   * 模板描述
   */
  description: string;

  /**
   * 基础配置
   */
  baseConfig: Partial<StrategyConfig>;

  /**
   * 可自定义的配置项
   */
  customizations?: {
    path: string;
    type: string;
    description: string;
    defaultValue?: any;
    options?: any[];
  }[];
}

/**
 * 策略生成选项
 */
export interface StrategyGeneratorOptions {
  /**
   * 策略类型
   */
  type: 'performance' | 'balanced' | 'economical' | 'custom';

  /**
   * 自定义名称
   */
  name?: string;

  /**
   * 自定义描述
   */
  description?: string;

  /**
   * 主提供商
   */
  primaryProvider?: string;

  /**
   * 是否启用提供商回退链
   */
  enableProviders?: boolean;

  /**
   * 输出格式
   */
  format?: 'json' | 'jsonc';

  /**
   * 是否包含注释
   */
  includeComments?: boolean;

  /**
   * 自定义 agent 配置
   */
  customAgents?: Record<string, Partial<AgentConfig>>;

  /**
   * 自定义类别配置
   */
  customCategories?: Record<string, Partial<CategoryConfig>>;

  /**
   * 基于模板
   */
  baseTemplate?: string;
}

/**
 * 策略验证结果
 */
export interface StrategyValidationResult {
  /**
   * 验证是否通过
   */
  valid: boolean;

  /**
   * 错误列表
   */
  errors: ValidationError[];

  /**
   * 警告列表
   */
  warnings: ValidationWarning[];

  /**
   * 信息列表
   */
  info: ValidationInfo[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error';
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  severity: 'warning';
}

/**
 * 验证信息
 */
export interface ValidationInfo {
  code: string;
  message: string;
  path?: string;
  severity: 'info';
}

/**
 * 策略迁移规则
 */
export interface MigrationRule {
  /**
   * 源版本
   */
  fromVersion: string;

  /**
   * 目标版本
   */
  toVersion: string;

  /**
   * 迁移函数
   */
  migrate: (config: any) => StrategyConfig;
}

/**
 * 策略初始化配置
 */
export interface InitConfig {
  /**
   * 策略输出目录
   */
  strategiesDir: string;

  /**
   * 是否生成默认策略
   */
  generateDefaultStrategies: boolean;

  /**
   * 默认策略类型
   */
  defaultStrategy: 'performance' | 'balanced' | 'economical';

  /**
   * 是否创建备份
   */
  createBackup: boolean;

  /**
   * 是否验证生成结果
   */
  validate: boolean;

  /**
   * 自定义策略
   */
  customStrategies?: {
    name: string;
    config: Partial<StrategyConfig>;
  }[];
}
