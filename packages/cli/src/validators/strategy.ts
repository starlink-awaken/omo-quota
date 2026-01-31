/**
 * 策略验证器
 *
 * 负责验证策略配置的有效性
 * 包括模型可用性检查、回退链验证、配置完整性检查等
 */

import type {
  StrategyConfig,
  StrategyValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationInfo,
  AgentConfig,
} from '../types/strategy.js';
import { existsSync, readFileSync } from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';

/**
 * 支持的提供商和模型列表
 */
const SUPPORTED_PROVIDERS: Record<string, string[]> = {
  'anthropic': [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'claude-3-5-sonnet',
    'claude-3-5-haiku',
  ],
  'openai': [
    'gpt-5.2',
    'gpt-5.2-codex',
    'gpt-4o',
    'o1',
    'o1-mini',
  ],
  'google': [
    'gemini-3-pro',
    'gemini-3-flash',
    'gemini-2-5-pro',
  ],
  'zai-coding-plan': [
    'glm-4.7',
    'glm-4',
    'glm-3-turbo',
  ],
  'github-copilot': [
    'gpt-4o',
    'gpt-4-turbo',
  ],
  'deepseek': [
    'deepseek-chat',
    'deepseek-coder',
  ],
};

/**
 * 必需的 agent 列表
 */
const REQUIRED_AGENTS = [
  'sisyphus',
  'oracle',
  'librarian',
  'explore',
];

/**
 * 可选的 agent 列表
 */
const OPTIONAL_AGENTS = [
  'multimodal-looker',
  'prometheus',
  'metis',
  'momus',
  'atlas',
];

/**
 * 必需的类别列表
 */
const REQUIRED_CATEGORIES = [
  'quick',
  'unspecified-low',
  'unspecified-high',
];

/**
 * 策略验证器类
 */
export class StrategyValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private info: ValidationInfo[] = [];

  /**
   * 验证策略文件
   */
  validate(filePath: string): StrategyValidationResult {
    this.reset();

    // 1. 检查文件是否存在
    if (!existsSync(filePath)) {
      this.addError('FILE_NOT_FOUND', `策略文件不存在: ${filePath}`, filePath);
      return this.buildResult();
    }

    // 2. 解析文件
    let config: StrategyConfig;
    try {
      const content = readFileSync(filePath, 'utf-8');
      config = parseJSONC(content) as StrategyConfig;
    } catch (error) {
      this.addError(
        'PARSE_ERROR',
        `无法解析策略文件: ${error instanceof Error ? error.message : String(error)}`,
        filePath
      );
      return this.buildResult();
    }

    // 3. 验证基本结构
    this.validateBasicStructure(config, filePath);

    // 4. 验证 providers 配置
    if (config.providers) {
      this.validateProviders(config.providers, filePath);
    }

    // 5. 验证 agents 配置
    this.validateAgents(config.agents, config.providers, filePath);

    // 6. 验证 categories 配置
    if (config.categories) {
      this.validateCategories(config.categories, config.providers, filePath);
    }

    // 7. 验证回退链
    this.validateFallbackChains(config, filePath);

    // 8. 验证模型可用性
    this.validateModelAvailability(config, filePath);

    return this.buildResult();
  }

  /**
   * 验证策略配置对象
   */
  validateConfig(config: StrategyConfig): StrategyValidationResult {
    this.reset();

    this.validateBasicStructure(config);
    this.validateAgents(config.agents, config.providers);
    this.validateCategories(config.categories || {}, config.providers);

    return this.buildResult();
  }

  /**
   * 验证多个策略文件
   */
  validateAll(filePaths: string[]): StrategyValidationResult {
    this.reset();

    for (const filePath of filePaths) {
      const result = this.validate(filePath);
      this.errors.push(...result.errors);
      this.warnings.push(...result.warnings);
      this.info.push(...result.info);
    }

    return this.buildResult();
  }

  /**
   * 验证基本结构
   */
  private validateBasicStructure(config: StrategyConfig, path = ''): void {
    if (!config.description) {
      this.addError('MISSING_DESCRIPTION', '缺少策略描述', path);
    }

    if (!config.agents || Object.keys(config.agents).length === 0) {
      this.addError('MISSING_AGENTS', '缺少 agents 配置', path);
    }

    // 检查必需的 agent
    for (const agentName of REQUIRED_AGENTS) {
      if (!config.agents || !config.agents[agentName]) {
        this.addWarning('MISSING_REQUIRED_AGENT', `缺少必需的 agent: ${agentName}`, `${path}.agents.${agentName}`);
      }
    }
  }

  /**
   * 验证 providers 配置
   */
  private validateProviders(providers: Record<string, string[]>, path = ''): void {
    for (const [providerName, models] of Object.entries(providers)) {
      // 检查提供商是否支持
      if (!SUPPORTED_PROVIDERS[providerName]) {
        this.addWarning('UNKNOWN_PROVIDER', `未知的提供商: ${providerName}`, `${path}.providers.${providerName}`);
        continue;
      }

      // 检查模型是否支持
      for (const model of models) {
        if (!SUPPORTED_PROVIDERS[providerName].includes(model)) {
          this.addWarning(
            'UNKNOWN_MODEL',
            `提供商 ${providerName} 可能不支持模型: ${model}`,
            `${path}.providers.${providerName}`
          );
        }
      }

      if (models.length === 0) {
        this.addError('EMPTY_MODELS', `提供商 ${providerName} 的模型列表为空`, `${path}.providers.${providerName}`);
      }
    }
  }

  /**
   * 验证 agents 配置
   */
  private validateAgents(
    agents: Record<string, AgentConfig>,
    providers: Record<string, string[]> | undefined,
    path = ''
  ): void {
    for (const [agentName, agentConfig] of Object.entries(agents)) {
      const agentPath = `${path}.agents.${agentName}`;

      // 检查 model 字段
      if (!agentConfig.model) {
        this.addError('MISSING_MODEL', `agent ${agentName} 缺少 model 配置`, agentPath);
        continue;
      }

      // 解析 model 字符串
      const [provider, model] = agentConfig.model.split('/');

      if (!provider || !model) {
        this.addError(
          'INVALID_MODEL_FORMAT',
          `model 格式错误，应为 provider/model: ${agentConfig.model}`,
          agentPath
        );
        continue;
      }

      // 检查提供商是否支持
      if (!SUPPORTED_PROVIDERS[provider]) {
        this.addWarning('UNKNOWN_PROVIDER', `未知的提供商: ${provider}`, agentPath);
      } else {
        // 检查模型是否支持
        if (!SUPPORTED_PROVIDERS[provider].includes(model)) {
          this.addWarning(
            'UNKNOWN_MODEL',
            `提供商 ${provider} 可能不支持模型: ${model}`,
            agentPath
          );
        }
      }

      // 验证 primary_provider
      if (agentConfig.primary_provider) {
        if (agentConfig.primary_provider !== provider) {
          this.addWarning(
            'PRIMARY_PROVIDER_MISMATCH',
            `primary_provider (${agentConfig.primary_provider}) 与 model 中的提供商 (${provider}) 不匹配`,
            agentPath
          );
        }
      }

      // 验证 fallback_providers
      if (agentConfig.fallback_providers) {
        this.validateFallbackModels(agentConfig.fallback_providers, agentPath);
      }

      // 添加 agent 信息
      this.addInfo(
        'AGENT_CONFIGURED',
        `${agentName}: ${agentConfig.model}${agentConfig.variant ? ` (${agentConfig.variant})` : ''}`,
        agentPath
      );
    }
  }

  /**
   * 验证 categories 配置
   */
  private validateCategories(
    categories: Record<string, { model?: string; variant?: string }>,
    providers: Record<string, string[]> | undefined,
    path = ''
  ): void {
    for (const [catName, catConfig] of Object.entries(categories)) {
      const catPath = `${path}.categories.${catName}`;

      if (!catConfig.model) {
        this.addError('MISSING_MODEL', `category ${catName} 缺少 model 配置`, catPath);
        continue;
      }

      const [provider, model] = catConfig.model.split('/');

      if (!provider || !model) {
        this.addError(
          'INVALID_MODEL_FORMAT',
          `model 格式错误，应为 provider/model: ${catConfig.model}`,
          catPath
        );
        continue;
      }

      if (!SUPPORTED_PROVIDERS[provider]) {
        this.addWarning('UNKNOWN_PROVIDER', `未知的提供商: ${provider}`, catPath);
      }
    }

    // 检查必需的类别
    for (const catName of REQUIRED_CATEGORIES) {
      if (!categories[catName]) {
        this.addWarning('MISSING_REQUIRED_CATEGORY', `缺少必需的类别: ${catName}`, `${path}.categories.${catName}`);
      }
    }
  }

  /**
   * 验证回退链
   */
  private validateFallbackChains(config: StrategyConfig, path = ''): void {
    if (!config.providers) {
      this.addInfo('NO_PROVIDERS', '未配置 providers 回退链，oh-my-opencode 将不使用回退功能', path);
      return;
    }

    this.addInfo('PROVIDERS_CONFIGURED', `已配置 ${Object.keys(config.providers).length} 个提供商回退链`, path);

    // 检查每个 agent 的回退链是否在 providers 中定义
    for (const [agentName, agentConfig] of Object.entries(config.agents)) {
      if (agentConfig.fallback_providers) {
        for (const fallbackModel of agentConfig.fallback_providers) {
          const [provider, model] = fallbackModel.split('/');

          if (config.providers[provider]) {
            if (!config.providers[provider].includes(model)) {
              this.addWarning(
                'FALLBACK_MODEL_NOT_IN_PROVIDERS',
                `agent ${agentName} 的回退模型 ${fallbackModel} 未在 providers.${provider} 中定义`,
                `${path}.agents.${agentName}.fallback_providers`
              );
            }
          }
        }
      }
    }
  }

  /**
   * 验证回退模型
   */
  private validateFallbackModels(fallbackModels: string[], path: string): void {
    for (const model of fallbackModels) {
      const [provider, modelName] = model.split('/');

      if (!provider || !modelName) {
        this.addError('INVALID_FALLBACK_MODEL', `回退模型格式错误: ${model}`, path);
        continue;
      }

      if (!SUPPORTED_PROVIDERS[provider]) {
        this.addWarning('UNKNOWN_PROVIDER', `回退链中使用未知的提供商: ${provider}`, path);
      } else if (!SUPPORTED_PROVIDERS[provider].includes(modelName)) {
        this.addWarning('UNKNOWN_MODEL', `回退链中使用未知的模型: ${model}`, path);
      }
    }
  }

  /**
   * 验证模型可用性
   */
  private validateModelAvailability(config: StrategyConfig, path = ''): void {
    // 这个方法可以进行 API 调用来验证模型是否真的可用
    // 目前只做静态检查
    if (config.providers) {
      this.addInfo(
        'MODEL_AVAILABILITY',
        '模型可用性检查仅基于静态配置，实际可用性可能因 API 限制而异',
        path
      );
    }
  }

  /**
   * 添加错误
   */
  private addError(code: string, message: string, path?: string): void {
    this.errors.push({ code, message, path, severity: 'error' });
  }

  /**
   * 添加警告
   */
  private addWarning(code: string, message: string, path?: string): void {
    this.warnings.push({ code, message, path, severity: 'warning' });
  }

  /**
   * 添加信息
   */
  private addInfo(code: string, message: string, path?: string): void {
    this.info.push({ code, message, path, severity: 'info' });
  }

  /**
   * 重置验证状态
   */
  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * 构建验证结果
   */
  private buildResult(): StrategyValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
    };
  }
}

/**
 * 创建策略验证器实例
 */
export function createValidator(): StrategyValidator {
  return new StrategyValidator();
}

/**
 * 快捷函数：验证策略文件
 */
export function validateStrategy(filePath: string): StrategyValidationResult {
  const validator = new StrategyValidator();
  return validator.validate(filePath);
}

/**
 * 快捷函数：验证多个策略文件
 */
export function validateAllStrategies(filePaths: string[]): StrategyValidationResult {
  const validator = new StrategyValidator();
  return validator.validateAll(filePaths);
}
