/**
 * 策略文件生成器
 *
 * 负责生成 oh-my-opencode 策略配置文件
 * 支持预设策略模板和自定义策略生成
 */

import type {
  StrategyConfig,
  StrategyGeneratorOptions,
  AgentConfig,
  CategoryConfig,
  StrategyProviders,
  InitConfig,
} from '../types/strategy.js';
import { presetStrategies, strategyMetadata } from '../data/presets.js';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname } from 'path';

/**
 * 策略生成器类
 */
export class StrategyGenerator {
  private strategiesDir: string;
  private enableComments: boolean;

  constructor(strategiesDir: string, enableComments = true) {
    this.strategiesDir = strategiesDir;
    this.enableComments = enableComments;
  }

  /**
   * 生成单个策略文件
   */
  generate(options: StrategyGeneratorOptions): string {
    const {
      type,
      name,
      description,
      enableProviders = true,
      format = 'jsonc',
      includeComments = this.enableComments,
      customAgents,
      customCategories,
      baseTemplate,
    } = options;

    // 获取基础配置
    let baseConfig: StrategyConfig;

    if (baseTemplate && presetStrategies[baseTemplate]) {
      baseConfig = this.deepClone(presetStrategies[baseTemplate]);
    } else if (presetStrategies[type]) {
      baseConfig = this.deepClone(presetStrategies[type]);
    } else {
      baseConfig = this.createEmptyStrategy();
    }

    // 应用自定义配置
    if (description) {
      baseConfig.description = description;
    }

    if (customAgents) {
      baseConfig.agents = {
        ...baseConfig.agents,
        ...this.applyCustomAgents(customAgents),
      };
    }

    if (customCategories) {
      baseConfig.categories = {
        ...baseConfig.categories,
        ...this.applyCustomCategories(customCategories),
      };
    }

    // 如果不启用 providers，移除该字段
    if (!enableProviders) {
      delete baseConfig.providers;
    }

    // 添加元数据
    baseConfig._metadata = {
      id: name || type,
      name: name || strategyMetadata[type]?.name || type,
      description: description || baseConfig.description,
      version: { major: 1, minor: 0, patch: 0, schema: '1.0.0' },
      type,
      costLevel: strategyMetadata[type]?.costLevel || 5,
      performanceLevel: strategyMetadata[type]?.performanceLevel || 5,
      useCases: strategyMetadata[type]?.useCases || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 生成文件内容
    return this.formatOutput(baseConfig, format, includeComments);
  }

  /**
   * 生成所有预设策略文件
   */
  generateAll(options?: Partial<StrategyGeneratorOptions>): string[] {
    const results: string[] = [];

    for (const [type, metadata] of Object.entries(strategyMetadata)) {
      const content = this.generate({
        type: type as any,
        ...options,
      });
      results.push({
        type,
        filename: metadata.filename,
        content,
      } as any);
    }

    return results as any;
  }

  /**
   * 保存策略到文件
   */
  saveToFile(filename: string, content: string): void {
    const filepath = `${this.strategiesDir}/${filename}`;

    // 确保目录存在
    if (!existsSync(this.strategiesDir)) {
      mkdirSync(this.strategiesDir, { recursive: true });
    }

    writeFileSync(filepath, content, 'utf-8');
  }

  /**
   * 保存所有预设策略
   */
  saveAllStrategies(): void {
    const generated = this.generateAll();

    for (const item of generated as any) {
      this.saveToFile(item.filename, item.content);
    }
  }

  /**
   * 创建空策略模板
   */
  private createEmptyStrategy(): StrategyConfig {
    return {
      $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json',
      description: '自定义策略',
      agents: {},
      categories: {},
    };
  }

  /**
   * 应用自定义 agent 配置
   */
  private applyCustomAgents(custom: Record<string, Partial<AgentConfig>>): Record<string, AgentConfig> {
    const result: Record<string, AgentConfig> = {};

    for (const [name, config] of Object.entries(custom)) {
      result[name] = {
        model: config.model || 'anthropic/claude-sonnet-4-5',
        variant: config.variant,
        primary_provider: config.primary_provider,
        fallback_providers: config.fallback_providers,
        description: config.description,
        tags: config.tags,
      };
    }

    return result;
  }

  /**
   * 应用自定义类别配置
   */
  private applyCustomCategories(custom: Record<string, Partial<CategoryConfig>>): Record<string, CategoryConfig> {
    const result: Record<string, CategoryConfig> = {};

    for (const [name, config] of Object.entries(custom)) {
      result[name] = {
        model: config.model || 'anthropic/claude-sonnet-4-5',
        variant: config.variant,
        description: config.description,
      };
    }

    return result;
  }

  /**
   * 格式化输出
   */
  private formatOutput(config: StrategyConfig, format: 'json' | 'jsonc', includeComments: boolean): string {
    if (format === 'json') {
      return JSON.stringify(config, null, 2);
    }

    // JSONC 格式带注释
    return this.toJSONC(config);
  }

  /**
   * 转换为 JSONC 格式（带注释）
   */
  private toJSONC(config: StrategyConfig): string {
    const lines: string[] = [];

    // 文件头注释
    lines.push('// Oh-My-OpenCode 策略配置文件');
    lines.push('// 生成时间: ' + new Date().toLocaleString('zh-CN'));
    lines.push('//');
    if (config._metadata) {
      lines.push(`// 策略: ${config._metadata.name}`);
      lines.push(`// ${config._metadata.description}`);
      lines.push('//');
    }
    lines.push('');
    lines.push(`{`);
    lines.push(`  $schema: "${config.$schema}",`);
    lines.push('');
    lines.push(`  // 策略描述`);
    lines.push(`  description: "${config.description}",`);
    lines.push('');

    // Providers 配置
    if (config.providers) {
      lines.push(`  // 提供商回退链配置`);
      lines.push(`  // oh-my-opencode 会按顺序尝试提供商，直到找到可用的模型`);
      lines.push(`  providers: {`);
      for (const [provider, models] of Object.entries(config.providers)) {
        lines.push(`    ${provider}: [`);
        for (const model of models) {
          lines.push(`      "${model}",`);
        }
        lines.push(`    ],`);
      }
      lines.push(`  },`);
      lines.push('');
    }

    // Agents 配置
    lines.push(`  // Agent 配置`);
    lines.push(`  // 每个agent可以配置独立的主模型和回退链`);
    lines.push(`  agents: {`);

    for (const [agentName, agentConfig] of Object.entries(config.agents)) {
      lines.push(`    ${agentName}: {`);
      lines.push(`      model: "${agentConfig.model}",`);

      if (agentConfig.variant) {
        lines.push(`      variant: "${agentConfig.variant}",`);
      }

      if (agentConfig.primary_provider) {
        lines.push(`      primary_provider: "${agentConfig.primary_provider}",`);
      }

      if (agentConfig.fallback_providers && agentConfig.fallback_providers.length > 0) {
        lines.push(`      // 回退提供商链（按优先级排序）`);
        lines.push(`      fallback_providers: [`);
        for (const fp of agentConfig.fallback_providers) {
          lines.push(`        "${fp}",`);
        }
        lines.push(`      ],`);
      }

      if (agentConfig.description) {
        lines.push(`      // ${agentConfig.description}`);
      }

      // 移除末尾逗号
      const lastLine = lines.pop();
      if (lastLine) {
        lines.push(lastLine.replace(/,$/, ''));
      }

      lines.push(`    },`);
    }

    // 移除 agents 末尾逗号
    const agentsLastLine = lines.pop();
    if (agentsLastLine) {
      lines.push(agentsLastLine.replace(/,$/, ''));
    }

    lines.push(`  },`);
    lines.push('');

    // Categories 配置
    if (config.categories && Object.keys(config.categories).length > 0) {
      lines.push(`  // 类别配置`);
      lines.push(`  categories: {`);

      for (const [catName, catConfig] of Object.entries(config.categories)) {
        lines.push(`    ${catName}: {`);
        lines.push(`      model: "${catConfig.model}",`);

        if (catConfig.variant) {
          lines.push(`      variant: "${catConfig.variant}",`);
        }

        if (catConfig.description) {
          lines.push(`      // ${catConfig.description}`);
        }

        // 移除末尾逗号
        const lastLine = lines.pop();
        if (lastLine) {
          lines.push(lastLine.replace(/,$/, ''));
        }

        lines.push(`    },`);
      }

      // 移除 categories 末尾逗号
      const catLastLine = lines.pop();
      if (catLastLine) {
        lines.push(catLastLine.replace(/,$/, ''));
      }

      lines.push(`  },`);
    }

    // 移除最后的逗号并闭合
    const veryLastLine = lines.pop();
    if (veryLastLine) {
      lines.push(veryLastLine.replace(/,$/, ''));
    }

    lines.push(`}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 深度克隆对象
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * 从文件加载策略
   */
  loadFromFile(filename: string): StrategyConfig | null {
    const filepath = `${this.strategiesDir}/${filename}`;

    if (!existsSync(filepath)) {
      return null;
    }

    try {
      // 简单的 JSONC 解析（移除注释）
      let content = readFileSync(filepath, 'utf-8');
      content = content.replace(/\/\/.*$/gm, ''); // 移除单行注释
      content = content.replace(/\/\*[\s\S]*?\*\//g, ''); // 移除多行注释
      return JSON.parse(content) as StrategyConfig;
    } catch {
      return null;
    }
  }

  /**
   * 获取所有策略文件列表
   */
  listStrategies(): string[] {
    const { readdirSync } = require('fs');

    if (!existsSync(this.strategiesDir)) {
      return [];
    }

    try {
      return readdirSync(this.strategiesDir)
        .filter((f: string) => f.endsWith('.jsonc') || f.endsWith('.json'))
        .sort();
    } catch {
      return [];
    }
  }
}

/**
 * 创建策略生成器实例
 */
export function createGenerator(strategiesDir: string, enableComments = true): StrategyGenerator {
  return new StrategyGenerator(strategiesDir, enableComments);
}

/**
 * 快捷函数：生成预设策略
 */
export function generatePresetStrategy(type: 'performance' | 'balanced' | 'economical'): string {
  const generator = new StrategyGenerator('/tmp', true);
  return generator.generate({ type });
}

/**
 * 快捷函数：保存所有预设策略到指定目录
 */
export function savePresetStrategies(strategiesDir: string): void {
  const generator = new StrategyGenerator(strategiesDir, true);
  generator.saveAllStrategies();
}
