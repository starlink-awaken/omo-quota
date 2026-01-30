/**
 * 策略系统测试
 *
 * 测试策略生成器、验证器和迁移管理器的功能
 */

import { describe, test, expect } from 'bun:test';
import { StrategyGenerator } from '../generators/strategy';
import { StrategyValidator } from '../validators/strategy';
import { presetStrategies, strategyMetadata } from '../data/presets';
import type { StrategyConfig } from '../types/strategy';

describe('策略生成器', () => {
  test('应该生成性能型策略', () => {
    const generator = new StrategyGenerator('/tmp', true);
    const result = generator.generate({ type: 'performance' });

    expect(result).toContain('极致性能型');
    expect(result).toContain('claude-opus-4-5');
    expect(result).toContain('gpt-5.2');
  });

  test('应该生成均衡型策略', () => {
    const generator = new StrategyGenerator('/tmp', true);
    const result = generator.generate({ type: 'balanced' });

    expect(result).toContain('均衡实用型');
    expect(result).toContain('glm-4.7');
    expect(result).toContain('claude-sonnet-4-5');
  });

  test('应该生成经济型策略', () => {
    const generator = new StrategyGenerator('/tmp', true);
    const result = generator.generate({ type: 'economical' });

    expect(result).toContain('经济节约型');
    expect(result).toContain('github-copilot');
    expect(result).toContain('gemini-3-flash');
  });

  test('应该包含必需的 agents', () => {
    const generator = new StrategyGenerator('/tmp', true);
    const result = generator.generate({ type: 'balanced' });

    expect(result).toContain('sisyphus');
    expect(result).toContain('oracle');
    expect(result).toContain('librarian');
    expect(result).toContain('explore');
  });

  test('应该包含 providers 配置', () => {
    const generator = new StrategyGenerator('/tmp', true);
    const result = generator.generate({ type: 'balanced', enableProviders: true });

    expect(result).toContain('providers:');
    expect(result).toContain('anthropic:');
    expect(result).toContain('zai-coding-plan:');
  });

  test('应该支持自定义 agent 配置', () => {
    const generator = new StrategyGenerator('/tmp', true);
    const result = generator.generate({
      type: 'balanced',
      customAgents: {
        sisyphus: {
          model: 'openai/gpt-4o',
          description: '自定义 sisyphus',
        },
      },
    });

    expect(result).toContain('openai/gpt-4o');
    expect(result).toContain('自定义 sisyphus');
  });
});

describe('策略验证器', () => {
  test('应该验证有效的策略', () => {
    const validator = new StrategyValidator();
    const result = validator.validateConfig(presetStrategies.balanced);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('应该检测缺少的 model 字段', () => {
    const validator = new StrategyValidator();
    const invalidConfig: StrategyConfig = {
      description: '测试策略',
      agents: {
        sisyphus: {} as any, // 缺少 model
      },
    };

    const result = validator.validateConfig(invalidConfig);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MISSING_MODEL')).toBe(true);
  });

  test('应该检测无效的模型格式', () => {
    const validator = new StrategyValidator();
    const invalidConfig: StrategyConfig = {
      description: '测试策略',
      agents: {
        sisyphus: {
          model: 'invalid-model-format', // 缺少 provider/
        },
      },
    };

    const result = validator.validateConfig(invalidConfig);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_MODEL_FORMAT')).toBe(true);
  });

  test('应该检测未知的提供商', () => {
    const validator = new StrategyValidator();
    const invalidConfig: StrategyConfig = {
      description: '测试策略',
      agents: {
        sisyphus: {
          model: 'unknown-provider/model',
        },
      },
    };

    const result = validator.validateConfig(invalidConfig);

    // 应该有警告但不阻止验证
    expect(result.warnings.some(w => w.code === 'UNKNOWN_PROVIDER')).toBe(true);
  });

  test('应该检测缺少必需的 agent', () => {
    const validator = new StrategyValidator();
    const incompleteConfig: StrategyConfig = {
      description: '测试策略',
      agents: {
        // 缺少 sisyphus, oracle, librarian, explore
        explore: {
          model: 'anthropic/claude-haiku-4-5',
        },
      },
    };

    const result = validator.validateConfig(incompleteConfig);

    expect(result.warnings.some(w => w.code === 'MISSING_REQUIRED_AGENT')).toBe(true);
  });

  test('应该验证回退链', () => {
    const validator = new StrategyValidator();
    const configWithFallback: StrategyConfig = {
      description: '测试策略',
      providers: {
        anthropic: ['claude-sonnet-4-5', 'claude-haiku-4-5'],
      },
      agents: {
        sisyphus: {
          model: 'anthropic/claude-sonnet-4-5',
          fallback_providers: ['anthropic/claude-haiku-4-5'],
        },
      },
    };

    const result = validator.validateConfig(configWithFallback);

    expect(result.valid).toBe(true);
    // 检查是否有关于 providers 的信息
    expect(result.info.some(i => i.code === 'PROVIDERS_CONFIGURED' || i.code === 'AGENT_CONFIGURED')).toBe(true);
  });
});

describe('预设策略元数据', () => {
  test('应该包含所有预设策略', () => {
    expect(strategyMetadata.performance).toBeDefined();
    expect(strategyMetadata.balanced).toBeDefined();
    expect(strategyMetadata.economical).toBeDefined();
  });

  test('性能策略成本最高', () => {
    expect(strategyMetadata.performance.costLevel).toBe(10);
    expect(strategyMetadata.performance.performanceLevel).toBe(10);
  });

  test('经济策略成本最低', () => {
    expect(strategyMetadata.economical.costLevel).toBe(1);
    expect(strategyMetadata.economical.performanceLevel).toBeLessThan(10);
  });

  test('均衡策略介于两者之间', () => {
    expect(strategyMetadata.balanced.costLevel).toBe(5);
    expect(strategyMetadata.balanced.performanceLevel).toBe(8);
  });
});

describe('策略类型安全', () => {
  test('预设策略应该符合 StrategyConfig 类型', () => {
    for (const [name, strategy] of Object.entries(presetStrategies)) {
      expect(strategy.description).toBeDefined();
      expect(strategy.agents).toBeDefined();
      expect(Object.keys(strategy.agents).length).toBeGreaterThan(0);
    }
  });

  test('每个 agent 应该有有效的 model 字段', () => {
    for (const [name, strategy] of Object.entries(presetStrategies)) {
      for (const [agentName, agentConfig] of Object.entries(strategy.agents)) {
        expect(agentConfig.model).toBeDefined();
        expect(agentConfig.model).toContain('/'); // 应该是 provider/model 格式
      }
    }
  });

  test('fallback_providers 应该是非空数组', () => {
    for (const [name, strategy] of Object.entries(presetStrategies)) {
      for (const [agentName, agentConfig] of Object.entries(strategy.agents)) {
        if (agentConfig.fallback_providers) {
          expect(Array.isArray(agentConfig.fallback_providers)).toBe(true);
          expect(agentConfig.fallback_providers.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
