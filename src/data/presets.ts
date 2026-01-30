/**
 * 预设策略配置数据
 *
 * 包含三种预设策略的完整配置：
 * - performance: 极致性能型（使用最高性能模型）
 * - balanced: 均衡实用型（性能与成本平衡）
 * - economical: 经济节约型（优先使用低成本模型）
 */

import type { StrategyConfig, StrategyTemplate } from '../types/strategy.js';

/**
 * 方案一：极致性能型策略
 *
 * 成本：最高
 * 性能：最高
 * 适用场景：关键项目、紧急任务、高质量要求
 */
export const performanceStrategy: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案一：极致性能型 - 使用最高性能模型，不计成本，适合关键项目和紧急任务',
  providers: {
    'anthropic': ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    'openai': ['gpt-5.2', 'gpt-5.2-codex', 'o1'],
    'google': ['gemini-3-pro', 'gemini-3-flash'],
    'zai-coding-plan': ['glm-4.7', 'glm-4'],
    'github-copilot': ['gpt-4o'],
  },
  agents: {
    // 主力编程助手 - 使用最强模型
    sisyphus: {
      model: 'anthropic/claude-opus-4-5',
      variant: 'max',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
        'google/gemini-3-pro',
      ],
      description: '主力编程助手，负责代码开发、重构和调试',
      tags: ['coding', 'development', 'debugging'],
    },
    // 预言家 - 深度分析和决策
    oracle: {
      model: 'openai/gpt-5.2',
      variant: 'high',
      primary_provider: 'openai',
      fallback_providers: [
        'anthropic/claude-opus-4-5',
        'google/gemini-3-pro',
      ],
      description: '负责深度分析、架构决策和技术方案评估',
      tags: ['analysis', 'architecture', 'decision'],
    },
    // 图书管理员 - 代码搜索和理解
    librarian: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
        'zai-coding-plan/glm-4.7',
      ],
      description: '负责代码库搜索、文档检索和代码理解',
      tags: ['search', 'documentation', 'understanding'],
    },
    // 探索者 - 快速浏览和轻量任务
    explore: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'google/gemini-3-flash',
        'github-copilot/gpt-4o',
      ],
      description: '负责快速浏览、文件探索和轻量查询',
      tags: ['exploration', 'quick-tasks'],
    },
    // 多模态观察者 - 视觉理解
    'multimodal-looker': {
      model: 'google/gemini-3-pro',
      variant: 'max',
      primary_provider: 'google',
      fallback_providers: [
        'anthropic/claude-opus-4-5',
        'openai/gpt-5.2',
      ],
      description: '负责图像理解、UI分析和视觉任务',
      tags: ['vision', 'ui', 'multimodal'],
    },
    // 普罗米修斯 - 复杂系统设计
    prometheus: {
      model: 'anthropic/claude-opus-4-5',
      variant: 'max',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
        'google/gemini-3-pro',
      ],
      description: '负责复杂系统设计、架构规划和长期规划',
      tags: ['architecture', 'planning', 'system-design'],
    },
    // 墨提斯 - 智慧和建议
    metis: {
      model: 'anthropic/claude-opus-4-5',
      variant: 'max',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
        'openai/o1',
      ],
      description: '提供技术建议、最佳实践和代码审查',
      tags: ['advice', 'review', 'best-practices'],
    },
    // 摩穆斯 - 批判性思维
    momus: {
      model: 'openai/gpt-5.2',
      variant: 'medium',
      primary_provider: 'openai',
      fallback_providers: [
        'anthropic/claude-opus-4-5',
      ],
      description: '负责批判性思维、问题发现和风险评估',
      tags: ['critique', 'risk-analysis', 'debugging'],
    },
    // 阿特拉斯 - 全面统筹
    atlas: {
      model: 'anthropic/claude-opus-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
      ],
      description: '负责项目统筹、任务协调和全面管理',
      tags: ['coordination', 'management', 'planning'],
    },
  },
  categories: {
    // 视觉工程
    'visual-engineering': {
      model: 'google/gemini-3-pro',
      variant: 'max',
      description: '视觉任务、UI设计和前端工程',
    },
    // 超级大脑
    ultrabrain: {
      model: 'openai/gpt-5.2-codex',
      variant: 'xhigh',
      description: '复杂推理、深度分析和高级编程',
    },
    // 艺术创作
    artistry: {
      model: 'google/gemini-3-pro',
      variant: 'max',
      description: '创意设计、UI/UX和美学任务',
    },
    // 快速响应
    quick: {
      model: 'anthropic/claude-sonnet-4-5',
      description: '快速任务、轻量查询和即时响应',
    },
    // 未指定低优先级
    'unspecified-low': {
      model: 'anthropic/claude-sonnet-4-5',
      description: '默认低优先级任务',
    },
    // 未指定高优先级
    'unspecified-high': {
      model: 'anthropic/claude-opus-4-5',
      description: '默认高优先级任务',
    },
    // 写作任务
    writing: {
      model: 'anthropic/claude-sonnet-4-5',
      description: '文档编写、内容创作和文字处理',
    },
  },
};

/**
 * 方案二：均衡实用型策略（推荐）
 *
 * 成本：中等
 * 性能：优秀
 * 适用场景：日常开发、通用任务
 */
export const balancedStrategy: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案二：均衡实用型 - 平衡性能与成本，适合日常开发和通用任务',
  providers: {
    'anthropic': ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    'openai': ['gpt-5.2', 'gpt-5.2-codex', 'o1'],
    'google': ['gemini-3-pro', 'gemini-3-flash'],
    'zai-coding-plan': ['glm-4.7', 'glm-4'],
    'github-copilot': ['gpt-4o'],
  },
  agents: {
    // 主力编程助手 - 使用高性价比模型
    sisyphus: {
      model: 'zai-coding-plan/glm-4.7',
      primary_provider: 'zai-coding-plan',
      fallback_providers: [
        'anthropic/claude-sonnet-4-5',
        'github-copilot/gpt-4o',
      ],
      description: '主力编程助手，使用高性价比的 GLM-4.7',
      tags: ['coding', 'development', 'debugging'],
    },
    // 预言家 - 关键决策时使用高质量模型
    oracle: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
        'google/gemini-3-pro',
      ],
      description: '负责技术分析和决策，使用 Claude Sonnet 平衡性能和成本',
      tags: ['analysis', 'architecture', 'decision'],
    },
    // 图书管理员 - 快速搜索
    librarian: {
      model: 'github-copilot/gpt-4o',
      primary_provider: 'github-copilot',
      fallback_providers: [
        'zai-coding-plan/glm-4.7',
        'anthropic/claude-haiku-4-5',
      ],
      description: '负责代码搜索，使用免费的 GitHub Copilot',
      tags: ['search', 'documentation', 'understanding'],
    },
    // 探索者 - 快速浏览
    explore: {
      model: 'anthropic/claude-haiku-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'google/gemini-3-flash',
        'github-copilot/gpt-4o',
      ],
      description: '负责快速浏览，使用最快的 Haiku 模型',
      tags: ['exploration', 'quick-tasks'],
    },
    // 多模态观察者 - 视觉理解
    'multimodal-looker': {
      model: 'google/gemini-3-flash',
      primary_provider: 'google',
      fallback_providers: [
        'google/gemini-3-pro',
        'anthropic/claude-sonnet-4-5',
      ],
      description: '负责视觉任务，使用快速的 Gemini Flash',
      tags: ['vision', 'ui', 'multimodal'],
    },
    // 普罗米修斯 - 复杂设计使用高质量模型
    prometheus: {
      model: 'anthropic/claude-opus-4-5',
      variant: 'max',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
      ],
      description: '复杂架构设计使用 Opus 确保质量',
      tags: ['architecture', 'planning', 'system-design'],
    },
    // 墨提斯 - 代码审查
    metis: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'openai/gpt-5.2',
      ],
      description: '代码审查使用 Sonnet',
      tags: ['advice', 'review', 'best-practices'],
    },
    // 摩穆斯 - 调试分析
    momus: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'zai-coding-plan/glm-4.7',
      ],
      description: '调试和问题分析',
      tags: ['critique', 'risk-analysis', 'debugging'],
    },
    // 阿特拉斯 - 任务协调
    atlas: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'zai-coding-plan/glm-4.7',
      ],
      description: '项目统筹和任务协调',
      tags: ['coordination', 'management', 'planning'],
    },
  },
  categories: {
    'visual-engineering': {
      model: 'google/gemini-3-flash',
      description: '视觉任务使用 Flash',
    },
    ultrabrain: {
      model: 'anthropic/claude-sonnet-4-5',
      variant: 'high',
      description: '复杂推理使用 Sonnet',
    },
    artistry: {
      model: 'google/gemini-3-pro',
      description: '创意设计',
    },
    quick: {
      model: 'anthropic/claude-haiku-4-5',
      description: '快速任务',
    },
    'unspecified-low': {
      model: 'github-copilot/gpt-4o',
      description: '低优先级使用免费模型',
    },
    'unspecified-high': {
      model: 'zai-coding-plan/glm-4.7',
      description: '高优先级使用 GLM',
    },
    writing: {
      model: 'google/gemini-3-flash',
      description: '文档编写',
    },
  },
};

/**
 * 方案三：经济节约型策略
 *
 * 成本：最低
 * 性能：良好
 * 适用场景：实验项目、预算受限、非关键任务
 */
export const economicalStrategy: StrategyConfig = {
  $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
  description: '方案三：经济节约型 - 优先使用低成本和免费模型，适合实验项目和预算受限场景',
  providers: {
    'anthropic': ['claude-haiku-4-5', 'claude-sonnet-4-5'],
    'google': ['gemini-3-flash', 'gemini-3-pro'],
    'github-copilot': ['gpt-4o'],
    'zai-coding-plan': ['glm-4', 'glm-4.7'],
  },
  agents: {
    // 主力编程助手 - 使用免费模型
    sisyphus: {
      model: 'github-copilot/gpt-4o',
      primary_provider: 'github-copilot',
      fallback_providers: [
        'zai-coding-plan/glm-4',
        'google/gemini-3-flash',
      ],
      description: '使用免费的 GitHub Copilot',
      tags: ['coding', 'development', 'debugging'],
    },
    // 预言家 - 必要时使用付费模型
    oracle: {
      model: 'google/gemini-3-flash',
      primary_provider: 'google',
      fallback_providers: [
        'anthropic/claude-haiku-4-5',
        'zai-coding-plan/glm-4',
      ],
      description: '优先使用低成本模型',
      tags: ['analysis', 'architecture', 'decision'],
    },
    // 图书管理员 - 快速搜索
    librarian: {
      model: 'github-copilot/gpt-4o',
      primary_provider: 'github-copilot',
      fallback_providers: [
        'anthropic/claude-haiku-4-5',
      ],
      description: '使用免费模型进行搜索',
      tags: ['search', 'documentation', 'understanding'],
    },
    // 探索者 - 最快选择
    explore: {
      model: 'anthropic/claude-haiku-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'google/gemini-3-flash',
      ],
      description: '使用最快的低成本模型',
      tags: ['exploration', 'quick-tasks'],
    },
    // 多模态观察者
    'multimodal-looker': {
      model: 'google/gemini-3-flash',
      primary_provider: 'google',
      fallback_providers: [
        'anthropic/claude-haiku-4-5',
      ],
      description: '视觉任务使用 Flash',
      tags: ['vision', 'ui', 'multimodal'],
    },
    // 普罗米修斯 - 必要时使用 Sonnet
    prometheus: {
      model: 'anthropic/claude-sonnet-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'google/gemini-3-pro',
      ],
      description: '复杂设计时使用 Sonnet',
      tags: ['architecture', 'planning', 'system-design'],
    },
    // 墨提斯
    metis: {
      model: 'anthropic/claude-haiku-4-5',
      primary_provider: 'anthropic',
      fallback_providers: [
        'google/gemini-3-flash',
      ],
      description: '代码审查使用 Haiku',
      tags: ['advice', 'review', 'best-practices'],
    },
    // 摩穆斯
    momus: {
      model: 'google/gemini-3-flash',
      primary_provider: 'google',
      fallback_providers: [
        'zai-coding-plan/glm-4',
      ],
      description: '调试分析使用 Flash',
      tags: ['critique', 'risk-analysis', 'debugging'],
    },
    // 阿特拉斯
    atlas: {
      model: 'google/gemini-3-flash',
      primary_provider: 'google',
      fallback_providers: [
        'anthropic/claude-haiku-4-5',
      ],
      description: '任务协调使用 Flash',
      tags: ['coordination', 'management', 'planning'],
    },
  },
  categories: {
    'visual-engineering': {
      model: 'google/gemini-3-flash',
      description: '视觉任务',
    },
    ultrabrain: {
      model: 'google/gemini-3-pro',
      description: '复杂推理',
    },
    artistry: {
      model: 'google/gemini-3-flash',
      description: '创意设计',
    },
    quick: {
      model: 'anthropic/claude-haiku-4-5',
      description: '快速任务',
    },
    'unspecified-low': {
      model: 'github-copilot/gpt-4o',
      description: '低优先级',
    },
    'unspecified-high': {
      model: 'zai-coding-plan/glm-4',
      description: '高优先级',
    },
    writing: {
      model: 'anthropic/claude-haiku-4-5',
      description: '文档编写',
    },
  },
};

/**
 * 预设策略映射
 */
export const presetStrategies: Record<string, StrategyConfig> = {
  performance: performanceStrategy,
  balanced: balancedStrategy,
  economical: economicalStrategy,
};

/**
 * 预设策略模板
 */
export const strategyTemplates: Record<string, StrategyTemplate> = {
  performance: {
    name: '极致性能型',
    description: '使用最高性能模型，不计成本',
    baseConfig: performanceStrategy,
  },
  balanced: {
    name: '均衡实用型',
    description: '平衡性能与成本',
    baseConfig: balancedStrategy,
  },
  economical: {
    name: '经济节约型',
    description: '优先使用低成本模型',
    baseConfig: economicalStrategy,
  },
};

/**
 * 策略元数据
 */
export const strategyMetadata: Record<string, {
  name: string;
  description: string;
  costLevel: number;
  performanceLevel: number;
  useCases: string[];
  filename: string;
}> = {
  performance: {
    name: '极致性能型',
    description: '使用最高性能模型（Claude Opus, GPT-5.2），不计成本，适合关键项目和紧急任务',
    costLevel: 10,
    performanceLevel: 10,
    useCases: ['关键项目', '紧急任务', '高质量要求', '复杂系统设计'],
    filename: 'strategy-1-performance.jsonc',
  },
  balanced: {
    name: '均衡实用型',
    description: '平衡性能与成本，主力使用 GLM-4.7 和 Claude Sonnet，适合日常开发和通用任务',
    costLevel: 5,
    performanceLevel: 8,
    useCases: ['日常开发', '通用任务', '代码重构', '文档编写'],
    filename: 'strategy-2-balanced.jsonc',
  },
  economical: {
    name: '经济节约型',
    description: '优先使用免费和低成本模型（GitHub Copilot Free, Haiku, Flash），适合实验项目和预算受限场景',
    costLevel: 1,
    performanceLevel: 6,
    useCases: ['实验项目', '预算受限', '非关键任务', '学习探索'],
    filename: 'strategy-3-economical.jsonc',
  },
};
