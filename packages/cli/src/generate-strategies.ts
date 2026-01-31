#!/usr/bin/env bun
/**
 * omo-quota策略文件生成器
 *
 * 生成符合oh-my-opencode配置格式的三种策略文件：
 * - strategy-1-performance.jsonc (极致性能)
 * - strategy-2-balanced.jsonc (均衡实用) ⭐推荐
 * - strategy-3-economical.jsonc (经济节约)
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Provider配置 - 支持回退链
 * oh-my-opencode使用providers字段来定义提供商的回退优先级
 */
export interface ProviderConfig {
  models: string[];
}

/**
 * 策略级别的提供商回退链配置
 * Key: 提供商名称
 * Value: 该提供商支持的模型列表（用于回退）
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
  // Anthropic模型回退: antigravity → github-copilot → anthropic
  'antigravity': ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  'github-copilot': ['claude-opus-4-5', 'claude-sonnet-4-5', 'gpt-4o'],
  'anthropic': ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],

  // OpenAI模型回退: openai → anthropic → google
  'openai': ['gpt-4.1', 'gpt-4o', 'o1-preview'],

  // Google模型回退（视觉任务）: google → openai → anthropic
  'google': ['gemini-2.0-flash-thinking-exp', 'gemini-2.0-flash-exp', 'gemini-2.5-pro'],
};

/**
 * Balanced策略的Provider回退链
 * 平衡性能和成本，使用多个提供商的混合配置
 */
const BALANCED_PROVIDERS: StrategyProviders = {
  // 智谱AI作为主力: zhipuai-coding-plan → openai → github-copilot
  'zhipuai-coding-plan': ['glm-4.7', 'glm-4-plus', 'glm-4-air'],
  'openai': ['gpt-4o', 'gpt-4o-mini'],
  'github-copilot': ['gpt-4o', 'gpt-4o-mini'],
  'anthropic': ['claude-sonnet-4-5', 'claude-haiku-4-5'],

  // Google用于视觉和思考任务: google → openai → anthropic
  'google': ['gemini-2.0-flash-thinking-exp', 'gemini-2.0-flash-exp', 'gemini-2.5-flash'],

  // Antigravity作为高质量回退
  'antigravity': ['gemini-2.0-flash-thinking-exp', 'claude-sonnet-4-5'],
};

/**
 * Economical策略的Provider回退链
 * 优先使用免费和低成本提供商
 */
const ECONOMICAL_PROVIDERS: StrategyProviders = {
  // GitHub Copilot Free作为主力: github-copilot-free
  'github-copilot-free': ['gpt-4o', 'gpt-5-mini', 'gpt-4o-mini'],

  // 智谱AI作为高质量回退
  'zhipuai-coding-plan': ['glm-4.7', 'glm-4-flash'],

  // OpenAI作为次要选择
  'openai': ['gpt-4o-mini', 'gpt-4o'],

  // Google用于视觉任务
  'google': ['gemini-2.0-flash-exp', 'gemini-2.5-flash'],

  // Antigravity最低优先级
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
 *
 * 预估成本: ¥200-300/天
 */
export const PERFORMANCE_STRATEGY: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案一: 极致性能 - 使用顶级模型，适合关键任务和紧急项目',
  providers: PERFORMANCE_PROVIDERS,
  agents: {
    // Sisyphus: 主协调器，使用最强推理模型
    'Sisyphus': {
      model: 'antigravity/claude-opus-4-5',
      temperature: 0.3,
      primary_provider: 'antigravity',
      fallback_providers: [
        'github-copilot/claude-opus-4-5',
        'anthropic/claude-opus-4-5',
      ],
    },
    // Oracle: 调试专家，使用OpenAI最强模型
    'oracle': {
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      primary_provider: 'openai',
      fallback_providers: [
        'anthropic/claude-opus-4-5',
        'google/gemini-2.0-flash-thinking-exp',
      ],
    },
    // Prometheus: 规划器，使用深度思考模型
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
    // Metis: 规划顾问，使用Sonnet平衡性能
    'metis': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-thinking-exp'],
    },
    // Momus: 规划审查者
    'momus': {
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      primary_provider: 'openai',
      fallback_providers: ['anthropic/claude-opus-4-5'],
    },
    // Librarian: 文档搜索，使用Sonnet
    'librarian': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.1,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    // Explore: 代码探索，使用Sonnet
    'explore': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.2,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    // Atlas: 通用任务
    'atlas': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
      primary_provider: 'anthropic',
    },
    // Multimodal-looker: 视觉任务，使用Gemini
    'multimodal-looker': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: ['openai/gpt-4o'],
    },
  },
  categories: {
    // 视觉工程: 使用Gemini Pro
    'visual-engineering': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
    },
    // 深度推理: 使用GPT-4.1
    'ultrabrain': {
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      variant: 'xhigh',
    },
    // 创意任务: 使用Gemini
    'artistry': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.8,
      variant: 'max',
    },
    // 快速任务: 使用Haiku
    'quick': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.2,
    },
    // 通用低优先级
    'unspecified-low': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
    },
    // 通用高优先级
    'unspecified-high': {
      model: 'antigravity/claude-opus-4-5',
      temperature: 0.3,
      variant: 'max',
    },
    // 写作任务
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
 *
 * 预估成本: ¥100-150/天
 */
export const BALANCED_STRATEGY: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案二: 均衡实用 - 平衡性能和成本，适合日常开发工作',
  providers: BALANCED_PROVIDERS,
  agents: {
    // Sisyphus: 使用智谱GLM-4.7作为主力
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
    // Oracle: 仅关键决策使用高质量模型
    'oracle': {
      model: 'google/gemini-2.0-flash-thinking-exp:antigravity',
      temperature: 0.2,
      primary_provider: 'antigravity',
      fallback_providers: [
        'openai/gpt-4o',
        'zhipuai-coding-plan/glm-4.7',
      ],
    },
    // Prometheus: 使用GLM-4.7
    'prometheus': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      primary_provider: 'zhipuai-coding-plan',
      fallback_providers: [
        'openai/gpt-4o',
        'antigravity/claude-sonnet-4-5',
      ],
    },
    // Metis: 使用Sonnet
    'metis': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
      primary_provider: 'anthropic',
      fallback_providers: ['google/gemini-2.0-flash-thinking-exp'],
    },
    // Momus: 使用GPT-4o
    'momus': {
      model: 'openai/gpt-4o',
      temperature: 0.2,
      variant: 'medium',
      primary_provider: 'openai',
      fallback_providers: ['zhipuai-coding-plan/glm-4.7'],
    },
    // Librarian: 使用Gemini Flash（长信息检索）
    'librarian': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.1,
      primary_provider: 'google',
      fallback_providers: ['zhipuai-coding-plan/glm-4.7'],
    },
    // Explore: 使用GitHub Copilot（免费）
    'explore': {
      model: 'github-copilot/gpt-4o',
      temperature: 0.2,
      primary_provider: 'github-copilot',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    // Atlas: 使用GLM-4.7
    'atlas': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      primary_provider: 'zhipuai-coding-plan',
    },
    // Multimodal-looker: 使用Gemini Flash
    'multimodal-looker': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: ['openai/gpt-4o'],
    },
  },
  categories: {
    // 视觉工程: 使用Gemini
    'visual-engineering': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
    },
    // 深度推理: 使用GLM-4.7
    'ultrabrain': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.2,
    },
    // 创意任务: 使用Gemini
    'artistry': {
      model: 'google/gemini-2.0-flash-thinking-exp',
      temperature: 0.8,
    },
    // 快速任务: 使用GitHub Copilot
    'quick': {
      model: 'github-copilot/gpt-4o',
      temperature: 0.2,
    },
    // 通用低优先级
    'unspecified-low': {
      model: 'anthropic/claude-sonnet-4-5',
      temperature: 0.3,
    },
    // 通用高优先级
    'unspecified-high': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
    },
    // 写作任务
    'writing': {
      model: 'google/gemini-2.0-flash-exp',
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
 * - 个人学习项目
 * - 实验性开发
 * - 预算受限
 *
 * 预估成本: ¥5-20/天
 */
export const ECONOMICAL_STRATEGY: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案三: 经济节约 - 优先使用免费模型，控制成本',
  providers: ECONOMICAL_PROVIDERS,
  agents: {
    // Sisyphus: 使用GitHub Copilot Free
    'Sisyphus': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.3,
      primary_provider: 'github-copilot-free',
      fallback_providers: [
        'zhipuai-coding-plan/glm-4.7',
        'openai/gpt-4o-mini',
      ],
    },
    // Oracle: 不使用顶级模型
    'oracle': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.2,
      primary_provider: 'zhipuai-coding-plan',
      fallback_providers: ['github-copilot-free/gpt-4o'],
    },
    // Prometheus: 使用免费模型
    'prometheus': {
      model: 'github-copilot-free/gpt-5-mini',
      temperature: 0.3,
      primary_provider: 'github-copilot-free',
      fallback_providers: [
        'zhipuai-coding-plan/glm-4-flash',
        'openai/gpt-4o-mini',
      ],
    },
    // Metis: 使用GLM-4.7
    'metis': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      primary_provider: 'zhipuai-coding-plan',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    // Momus: 使用GPT-4o-mini
    'momus': {
      model: 'openai/gpt-4o-mini',
      temperature: 0.2,
      primary_provider: 'openai',
      fallback_providers: ['github-copilot-free/gpt-5-mini'],
    },
    // Librarian: 使用免费模型
    'librarian': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.1,
      primary_provider: 'github-copilot-free',
      fallback_providers: ['zhipuai-coding-plan/glm-4-flash'],
    },
    // Explore: 使用免费模型
    'explore': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.2,
      primary_provider: 'github-copilot-free',
      fallback_providers: ['google/gemini-2.0-flash-exp'],
    },
    // Atlas: 使用GLM-4.7
    'atlas': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
      primary_provider: 'zhipuai-coding-plan',
    },
    // Multimodal-looker: 使用Gemini Flash Exp
    'multimodal-looker': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.2,
      primary_provider: 'google',
      fallback_providers: ['openai/gpt-4o-mini'],
    },
  },
  categories: {
    // 视觉工程: 使用Gemini Flash
    'visual-engineering': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.3,
    },
    // 深度推理: 使用GLM-4.7
    'ultrabrain': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.2,
    },
    // 创意任务: 使用Gemini Flash
    'artistry': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.8,
    },
    // 快速任务: 使用GPT-4o-mini
    'quick': {
      model: 'openai/gpt-4o-mini',
      temperature: 0.2,
    },
    // 通用低优先级
    'unspecified-low': {
      model: 'github-copilot-free/gpt-4o',
      temperature: 0.3,
    },
    // 通用高优先级
    'unspecified-high': {
      model: 'zhipuai-coding-plan/glm-4.7',
      temperature: 0.3,
    },
    // 写作任务
    'writing': {
      model: 'google/gemini-2.0-flash-exp',
      temperature: 0.5,
    },
  },
  metadata: {
    version: '1.0.0',
    created: new Date().toISOString(),
    cost_level: 'low',
    use_case: '个人学习项目、实验性开发、预算受限场景',
  },
};

// ============================================================================
// JSONC格式化工具
// ============================================================================

/**
 * 将配置对象转换为带注释的JSONC格式
 */
function toJSONC(config: StrategyConfig, strategyName: string): string {
  const lines: string[] = [];

  // 添加文件头注释
  lines.push(`/**`);
  lines.push(` * ${strategyName} Strategy Configuration`);
  lines.push(` * `);
  lines.push(` * Description: ${config.description}`);
  lines.push(` * Cost Level: ${config.metadata?.cost_level?.toUpperCase()}`);
  lines.push(` * Use Case: ${config.metadata?.use_case}`);
  lines.push(` * Version: ${config.metadata?.version}`);
  lines.push(` * `);
  lines.push(` * Generated by: omo-quota strategy-generator`);
  lines.push(` * Generated at: ${config.metadata?.created}`);
  lines.push(` */`);
  lines.push('');
  lines.push('{');
  lines.push('');

  // 添加$schema
  lines.push('  // JSON Schema for autocomplete support');
  lines.push(`  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",`);
  lines.push('');

  // 添加description
  lines.push(`  // 策略描述: ${config.description}`);
  lines.push(`  "description": "${config.description}",`);
  lines.push('');

  // 添加providers配置（如果存在）
  if (config.providers) {
    lines.push('  // ============================================================================ //');
    lines.push('  // Provider回退链配置');
    lines.push('  // 当主提供商不可用时，oh-my-opencode会按顺序尝试备选提供商');
    lines.push('  // ============================================================================ //');
    lines.push('');
    lines.push('  "providers": {');

    let providerIndex = 0;
    for (const [provider, models] of Object.entries(config.providers)) {
      providerIndex++;
      const isLast = providerIndex === Object.keys(config.providers).length;
      const comment = getProviderComment(provider, strategyName);
      lines.push(`    // ${comment}`);
      lines.push(`    "${provider}": [`);
      lines.push(`      ${models.map(m => `"${m}"`).join(', ')}`);
      lines.push(`    ]${isLast ? '' : ','}`);
    }
    lines.push('  },');
    lines.push('');
  }

  // 添加agents配置
  if (config.agents) {
    lines.push('  // ============================================================================ //');
    lines.push('  // Agent模型配置');
    lines.push('  // 每个agent可以指定主模型和回退提供商');
    lines.push('  // ============================================================================ //');
    lines.push('');
    lines.push('  "agents": {');

    let agentIndex = 0;
    for (const [agentName, agentConfig] of Object.entries(config.agents)) {
      agentIndex++;
      const isLast = agentIndex === Object.keys(config.agents).length;
      const comment = getAgentComment(agentName);
      const costComment = getAgentCostComment(agentName, strategyName);

      lines.push(`    // ${comment} (${costComment})`);
      lines.push(`    "${agentName}": {`);
      lines.push(`      "model": "${agentConfig.model}",`);

      if (agentConfig.temperature !== undefined) {
        lines.push(`      "temperature": ${agentConfig.temperature},`);
      }
      if (agentConfig.variant) {
        lines.push(`      "variant": "${agentConfig.variant}",`);
      }
      if (agentConfig.primary_provider) {
        lines.push(`      "primary_provider": "${agentConfig.primary_provider}",`);
      }
      if (agentConfig.fallback_providers && agentConfig.fallback_providers.length > 0) {
        lines.push(`      "fallback_providers": [`);
        lines.push(`        ${agentConfig.fallback_providers.map(fp => `"${fp}"`).join(', ')}`);
        lines.push(`      ],`);
      }

      // 移除末尾逗号
      const lastLine = lines.pop()!;
      lines.push(lastLine.replace(/,$/, ''));
      lines.push(`    }${isLast ? '' : ','}`);
    }
    lines.push('  },');
    lines.push('');
  }

  // 添加categories配置
  if (config.categories) {
    lines.push('  // ============================================================================ //');
    lines.push('  // Category模型配置');
    lines.push('  // 用于delegate_task工具的领域特定任务委托');
    lines.push('  // ============================================================================ //');
    lines.push('');
    lines.push('  "categories": {');

    let categoryIndex = 0;
    for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
      categoryIndex++;
      const isLast = categoryIndex === Object.keys(config.categories).length;
      const comment = getCategoryComment(categoryName);

      lines.push(`    // ${comment}`);
      lines.push(`    "${categoryName}": {`);
      lines.push(`      "model": "${categoryConfig.model}",`);

      if (categoryConfig.temperature !== undefined) {
        lines.push(`      "temperature": ${categoryConfig.temperature},`);
      }
      if (categoryConfig.variant) {
        lines.push(`      "variant": "${categoryConfig.variant}",`);
      }

      // 移除末尾逗号
      const lastLine = lines.pop()!;
      lines.push(lastLine.replace(/,$/, ''));
      lines.push(`    }${isLast ? '' : ','}`);
    }
    lines.push('  },');
    lines.push('');
  }

  // 添加metadata
  if (config.metadata) {
    lines.push('  // ============================================================================ //');
    lines.push('  // 元数据');
    lines.push('  // ============================================================================ //');
    lines.push('');
    lines.push('  "metadata": {');
    lines.push(`    "version": "${config.metadata.version}",`);
    lines.push(`    "created": "${config.metadata.created}",`);
    lines.push(`    "cost_level": "${config.metadata.cost_level}",`);
    lines.push(`    "use_case": "${config.metadata.use_case}"`);
    lines.push('  }');
  }

  lines.push('');
  lines.push('}');

  return lines.join('\n') + '\n';
}

function getProviderComment(provider: string, strategy: string): string {
  const comments: Record<string, string> = {
    'antigravity': 'Antigravity代理 - 高质量Claude/Gemini模型访问',
    'github-copilot': 'GitHub Copilot - 有订阅可用',
    'github-copilot-free': 'GitHub Copilot Free - 免费额度',
    'anthropic': 'Anthropic官方API - Claude模型',
    'openai': 'OpenAI官方API - GPT模型',
    'google': 'Google官方API - Gemini模型',
    'zhipuai-coding-plan': '智谱AI Coding Plan - GLM模型',
  };
  return comments[provider] || provider;
}

function getAgentComment(agentName: string): string {
  const comments: Record<string, string> = {
    'Sisyphus': '主协调器 - 负责整体任务编排和决策',
    'oracle': '调试专家 - 诊断和解决代码问题',
    'prometheus': '规划器 - 创建详细的执行计划',
    'metis': '规划顾问 - 预先分析识别隐藏需求',
    'momus': '规划审查者 - 审查和优化执行计划',
    'librarian': '文档搜索 - 代码库文档查询',
    'explore': '代码探索 - 快速浏览和理解代码结构',
    'atlas': '通用助手 - 处理各类通用任务',
    'multimodal-looker': '视觉专家 - 处理图像和视觉内容',
  };
  return comments[agentName] || agentName;
}

function getAgentCostComment(agentName: string, strategy: string): string {
  const costs: Record<string, Record<string, string>> = {
    'performance': {
      'Sisyphus': '高成本 - Opus 4.5',
      'oracle': '高成本 - GPT-4.1',
      'prometheus': '高成本 - Opus 4.5 max',
      'metis': '中成本 - Sonnet 4.5',
      'momus': '高成本 - GPT-4.1',
      'librarian': '中成本 - Sonnet 4.5',
      'explore': '中成本 - Sonnet 4.5',
    },
    'balanced': {
      'Sisyphus': '低成本 - GLM-4.7',
      'oracle': '中成本 - Gemini Thinking Exp',
      'prometheus': '低成本 - GLM-4.7',
      'metis': '中成本 - Sonnet 4.5',
      'momus': '低成本 - GPT-4o',
      'librarian': '免费 - Gemini Flash Exp',
      'explore': '免费 - GitHub Copilot',
    },
    'economical': {
      'Sisyphus': '免费 - GitHub Copilot Free',
      'oracle': '低成本 - GLM-4.7',
      'prometheus': '免费 - GPT-5-mini',
      'metis': '低成本 - GLM-4.7',
      'momus': '低成本 - GPT-4o-mini',
      'librarian': '免费 - GitHub Copilot Free',
      'explore': '免费 - GitHub Copilot Free',
    },
  };
  return costs[strategy]?.[agentName] || '成本: 未知';
}

function getCategoryComment(categoryName: string): string {
  const comments: Record<string, string> = {
    'visual-engineering': '视觉工程 - 前端开发、UI/UX设计',
    'ultrabrain': '深度推理 - 复杂架构决策',
    'artistry': '创意任务 - 高度创造性工作',
    'quick': '快速任务 - 简单修改、typo修复',
    'unspecified-low': '通用低优先级 - 不需要深度的任务',
    'unspecified-high': '通用高优先级 - 需要深度的任务',
    'writing': '写作任务 - 文档和技术写作',
  };
  return comments[categoryName] || categoryName;
}

// ============================================================================
// 主生成函数
// ============================================================================

export interface GenerateOptions {
  outputDir?: string;
  strategies?: Array<'performance' | 'balanced' | 'economical'>;
  verbose?: boolean;
}

/**
 * 生成策略文件
 */
export function generateStrategies(options: GenerateOptions = {}): void {
  const {
    outputDir = join(homedir(), '.config', 'opencode', 'strategies'),
    strategies = ['performance', 'balanced', 'economical'],
    verbose = false,
  } = options;

  // 确保目录存在
  mkdirSync(outputDir, { recursive: true });

  const strategiesToGenerate = [
    { name: 'performance', config: PERFORMANCE_STRATEGY, file: 'strategy-1-performance.jsonc' },
    { name: 'balanced', config: BALANCED_STRATEGY, file: 'strategy-2-balanced.jsonc' },
    { name: 'economical', config: ECONOMICAL_STRATEGY, file: 'strategy-3-economical.jsonc' },
  ];

  for (const strategy of strategiesToGenerate) {
    if (!strategies.includes(strategy.name as any)) {
      continue;
    }

    const filePath = join(outputDir, strategy.file);
    const jsonc = toJSONC(strategy.config, strategy.name);

    writeFileSync(filePath, jsonc, 'utf-8');

    if (verbose) {
      console.log(`✓ Generated: ${filePath}`);
    }
  }

  console.log(`\n✅ Successfully generated ${strategies.length} strategy file(s) in ${outputDir}`);
  console.log('');
  console.log('Generated files:');
  for (const strategy of strategiesToGenerate) {
    if (strategies.includes(strategy.name as any)) {
      const star = strategy.name === 'balanced' ? ' ⭐推荐' : '';
      console.log(`  - strategy-${strategy.config.metadata?.cost_level === 'high' ? '1' : strategy.config.metadata?.cost_level === 'medium' ? '2' : '3'}-${strategy.name}.jsonc${star}`);
    }
  }
  console.log('');
  console.log('Usage:');
  console.log('  omo-quota list                          # 查看所有策略');
  console.log('  omo-quota switch <strategy>              # 切换策略');
  console.log('  omo-quota validate-models -s <strategy>  # 验证策略配置');
}

// ============================================================================
// CLI入口
// ============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const options: GenerateOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--strategy' || arg === '-s') {
      options.strategies = args[++i].split(',') as Array<'performance' | 'balanced' | 'economical'>;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
omo-quota策略文件生成器

用法:
  bun run src/generate-strategies.ts [options]

选项:
  -o, --output <dir>     输出目录 (默认: ~/.config/opencode/strategies)
  -s, --strategy <list>  要生成的策略，逗号分隔 (默认: performance,balanced,economical)
  -v, --verbose          详细输出
  -h, --help             显示帮助信息

示例:
  # 生成所有策略
  bun run src/generate-strategies.ts

  # 只生成balanced策略
  bun run src/generate-strategies.ts -s balanced

  # 生成到自定义目录
  bun run src/generate-strategies.ts -o /tmp/strategies

  # 生成performance和economical策略
  bun run src/generate-strategies.ts -s performance,economical
      `);
      process.exit(0);
    }
  }

  generateStrategies(options);
}
