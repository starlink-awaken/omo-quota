/**
 * 策略文件生成器工具模块
 *
 * 为init命令提供策略文件自动生成功能
 * 生成符合oh-my-opencode配置格式的JSONC策略文件
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Provider配置 - 支持回退链
 */
export interface ProviderConfig {
  models: string[];
}

/**
 * 策略级别的提供商回退链配置
 */
export interface StrategyProviders {
  [provider: string]: string[];
}

/**
 * Agent配置
 */
export interface AgentConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  variant?: 'low' | 'medium' | 'high' | 'max' | 'xhigh' | 'minimal';
  primary_provider?: string;
  fallback_providers?: string[];
}

/**
 * Category配置
 */
export interface CategoryConfig {
  model: string;
  temperature?: number;
  variant?: string;
}

/**
 * 完整的策略配置
 */
export interface StrategyConfig {
  $schema: string;
  description: string;
  providers?: StrategyProviders;
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  metadata?: {
    version: string;
    created: string;
    cost_level: 'high' | 'medium' | 'low';
    use_case: string;
  };
}

// ============================================================================
// Provider回退链配置
// ============================================================================

/**
 * Performance策略的Provider回退链
 * 优先使用高质量提供商，确保最佳性能
 */
const PERFORMANCE_PROVIDERS: StrategyProviders = {
  'antigravity': ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  'github-copilot': ['claude-opus-4-5', 'claude-sonnet-4-5', 'gpt-4o'],
  'anthropic': ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  'openai': ['gpt-4.1', 'gpt-4o', 'o1-preview'],
  'google': ['gemini-2.0-flash-thinking-exp', 'gemini-2.0-flash-exp', 'gemini-2.5-pro'],
};

/**
 * Balanced策略的Provider回退链
 * 平衡性能和成本，使用多个提供商的混合配置
 */
const BALANCED_PROVIDERS: StrategyProviders = {
  'zhipuai-coding-plan': ['glm-4.7', 'glm-4-plus', 'glm-4-air'],
  'openai': ['gpt-4o', 'gpt-4o-mini'],
  'github-copilot': ['gpt-4o', 'gpt-4o-mini'],
  'anthropic': ['claude-sonnet-4-5', 'claude-haiku-4-5'],
  'google': ['gemini-2.0-flash-thinking-exp', 'gemini-2.0-flash-exp', 'gemini-2.5-flash'],
  'antigravity': ['gemini-2.0-flash-thinking-exp', 'claude-sonnet-4-5'],
};

/**
 * Economical策略的Provider回退链
 * 优先使用免费和低成本提供商
 */
const ECONOMICAL_PROVIDERS: StrategyProviders = {
  'github-copilot-free': ['gpt-4o', 'gpt-5-mini', 'gpt-4o-mini'],
  'zhipuai-coding-plan': ['glm-4.7', 'glm-4-flash'],
  'openai': ['gpt-4o-mini', 'gpt-4o'],
  'google': ['gemini-2.0-flash-exp', 'gemini-2.5-flash'],
  'antigravity': ['gemini-2.0-flash-exp', 'claude-haiku-4-5'],
};

// ============================================================================
// 策略配置定义
// ============================================================================

/**
 * Strategy 1: Performance (极致性能)
 *
 * 适用场景:
 * - 生产环境紧急修复
 * - 关键功能开发
 * - 客户演示准备
 */
const PERFORMANCE_STRATEGY: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案一: 极致性能 - 使用顶级模型，适合关键任务和紧急项目',
  providers: PERFORMANCE_PROVIDERS,
  agents: {
    'Sisyphus': {
      model: 'antigravity/claude-opus-4-5',
      temperature: 0.3,
      primary_provider: 'antigravity',
      fallback_providers: [
        'github-copilot/claude-opus-4-5',
        'anthropic/claude-opus-4-5',
      ],
    },
    'oracle': {
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      primary_provider: 'openai',
      fallback_providers: [
        'anthropic/claude-opus-4-5',
        'google/gemini-2.0-flash-thinking-exp',
      ],
    },
    'prometheus': {
      model: 'antigravity/claude-opus-4-5',
      temperature: 0.3,
      variant: 'max',
      primary_provider: 'antigravity',
      fallback_providers: [
        'anthropic/claude-opus-4-5',
        'google/gemini-2.0-flash-thinking-exp',
      ],
    },
    'metis': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-thinking-exp'],
    },
    'momus': {
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      primary_provider: 'openai',
      fallback_providers: ['anthropic/claude-opus-4-5'],
    },
    'librarian': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.1,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    'explore': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.2,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    'atlas': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
      primary_provider: 'anthropic',
    },
    'multimodal-looker': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: ['openai/gpt-4o'],
    },
  },
  categories: {
    'visual-engineering': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
    },
    'ultrabrain': {
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      variant: 'xhigh',
    },
    'artistry': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.8,
      variant: 'max',
    },
    'quick': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.2,
    },
    'unspecified-low': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
    },
    'unspecified-high': {
      model: 'antigravity/claude-opus-4-5',
      temperature: 0.3,
      variant: 'max',
    },
    'writing': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.5,
    },
  },
  metadata: {
    version: '1.0.0',
    created: new Date().toISOString(),
    cost_level: 'high',
    use_case: '生产环境紧急修复、关键功能开发、客户演示准备',
  },
};

/**
 * Strategy 2: Balanced (均衡实用) ⭐推荐
 *
 * 适用场景:
 * - 日常开发工作 (80%+ 场景)
 * - 中等复杂度项目
 * - 持续迭代开发
 */
const BALANCED_STRATEGY: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案二: 均衡实用 - 平衡性能和成本，适合日常开发工作',
  providers: BALANCED_PROVIDERS,
  agents: {
    'Sisyphus': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      primary_provider: 'zhipuai-coding-plan',
      fallback_providers: [
        'openai/gpt-4o',
        'github-copilot/gpt-4o',
        'antigravity/claude-sonnet-4-5',
      ],
    },
    'oracle': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: [
        'openai/gpt-4o',
        'zhipuai-coding-plan/glm-4.7',
      ],
    },
    'prometheus': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      variant: 'max',
      primary_provider: 'zhipuai-coding-plan',
      fallback_providers: [
        'google/gemini-2.0-flash-thinking-exp',
        'openai/gpt-4o',
      ],
    },
    'metis': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
      primary_provider: 'google',
      fallback_providers: ['zhipuai-coding-plan/glm-4.7'],
    },
    'momus': {
      model: 'openai/gpt-4o',
      temperature: 0.2,
      primary_provider: 'openai',
      fallback_providers: ['google/gemini-2.0-flash-thinking-exp'],
    },
    'librarian': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.1,
      primary_provider: 'google',
      fallback_providers: ['anthropic/claude-sonnet-4-5'],
    },
    'explore': {
      model: 'github-copilot/gpt-4o',
      temperature: 0.2,
      primary_provider: 'github-copilot',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    'atlas': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      primary_provider: 'zhipuai-coding-plan',
    },
    'multimodal-looker': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: ['openai/gpt-4o'],
    },
  },
  categories: {
    'visual-engineering': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
    },
    'ultrabrain': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.2,
      variant: 'xhigh',
    },
    'artistry': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.8,
      variant: 'max',
    },
    'quick': {
      model: 'github-copilot/gpt-4o-mini',
      temperature: 0.2,
    },
    'unspecified-low': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
    },
    'unspecified-high': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
      variant: 'max',
    },
    'writing': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.5,
    },
  },
  metadata: {
    version: '1.0.0',
    created: new Date().toISOString(),
    cost_level: 'medium',
    use_case: '日常开发工作、中等复杂度项目、持续迭代开发',
  },
};

/**
 * Strategy 3: Economical (经济节约)
 *
 * 适用场景:
 * - 实验项目
 * - 学习探索
 * - 预算受限场景
 */
const ECONOMICAL_STRATEGY: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案三: 经济节约 - 优先使用免费模型，适合实验和学习',
  providers: ECONOMICAL_PROVIDERS,
  agents: {
    'Sisyphus': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.3,
      primary_provider: 'github-copilot-free',
      fallback_providers: [
        'zhipuai-coding-plan/glm-4.7',
        'openai/gpt-4o-mini',
      ],
    },
    'oracle': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.2,
      primary_provider: 'zhipuai-coding-plan',
      fallback_providers: [
        'github-copilot-free/gpt-4o',
        'openai/gpt-4o-mini',
      ],
    },
    'prometheus': {
      model: 'github-copilot-free/gpt-5-mini',
      temperature: 0.3,
      variant: 'max',
      primary_provider: 'github-copilot-free',
      fallback_providers: [
        'zhipuai-coding-plan/glm-4-flash',
        'openai/gpt-4o-mini',
      ],
    },
    'metis': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.3,
      primary_provider: 'github-copilot-free',
      fallback_providers: ['zhipuai-coding-plan/glm-4.7'],
    },
    'momus': {
      model: 'github-copilot-free/gpt-4o-mini',
      temperature: 0.2,
      primary_provider: 'github-copilot-free',
      fallback_providers: ['zhipuai-coding-plan/glm-4-flash'],
    },
    'librarian': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.1,
      primary_provider: 'github-copilot-free',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    'explore': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.2,
      primary_provider: 'github-copilot-free',
      fallback_providers: ['zhipuai-coding-plan/glm-4-flash'],
    },
    'atlas': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.3,
      primary_provider: 'github-copilot-free',
    },
    'multimodal-looker': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: ['github-copilot-free/gpt-4o'],
    },
  },
  categories: {
    'visual-engineering': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.3,
    },
    'ultrabrain': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.2,
      variant: 'xhigh',
    },
    'artistry': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.8,
      variant: 'max',
    },
    'quick': {
      model: 'github-copilot-free/gpt-4o-mini',
      temperature: 0.2,
    },
    'unspecified-low': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.3,
    },
    'unspecified-high': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      variant: 'max',
    },
    'writing': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.5,
    },
  },
  metadata: {
    version: '1.0.0',
    created: new Date().toISOString(),
    cost_level: 'low',
    use_case: '实验项目、学习探索、预算受限场景',
  },
};

// ============================================================================
// 生成器函数
// ============================================================================

/**
 * 将策略配置转换为JSONC格式字符串（带注释）
 */
function strategyToJSONC(config: StrategyConfig, strategyName: string): string {
  const descriptions: Record<string, string> = {
    performance: '极致性能 - 使用顶级模型',
    balanced: '均衡实用 - 平衡性能和成本',
    economical: '经济节约 - 优先免费模型',
  };

  const json = JSON.stringify(config, null, 2);
  const lines = json.split('\n');

  // 添加文件头注释
  const header = [
    `// ${strategyName.toUpperCase()} 策略配置`,
    `//`,
    `// ${descriptions[strategyName]}`,
    `//`,
    `// 生成时间: ${new Date().toISOString()}`,
    `// 版本: ${config.metadata?.version}`,
    `// 成本级别: ${config.metadata?.cost_level}`,
    `//`,
    `// 注意: 此文件由 omo-quota init 自动生成`,
    `// 修改后请运行: omo-quota validate-models 验证配置`,
    '',
  ].join('\n');

  return header + lines.join('\n');
}

/**
 * 生成所有策略文件到指定目录
 *
 * @param outputDir 输出目录路径
 * @returns 生成的文件列表
 */
export function generateStrategies(outputDir?: string): string[] {
  const strategiesDir = outputDir || join(homedir(), '.config', 'opencode', 'strategies');

  // 创建目录（如果不存在）
  mkdirSync(strategiesDir, { recursive: true });

  const strategies = [
    { name: 'performance', config: PERFORMANCE_STRATEGY, file: 'strategy-1-performance.jsonc' },
    { name: 'balanced', config: BALANCED_STRATEGY, file: 'strategy-2-balanced.jsonc' },
    { name: 'economical', config: ECONOMICAL_STRATEGY, file: 'strategy-3-economical.jsonc' },
  ];

  const generatedFiles: string[] = [];

  for (const strategy of strategies) {
    const filePath = join(strategiesDir, strategy.file);
    const jsonc = strategyToJSONC(strategy.config, strategy.name);

    writeFileSync(filePath, jsonc, 'utf-8');
    generatedFiles.push(filePath);
  }

  return generatedFiles;
}
