/**
 * init 命令测试
 *
 * 测试初始化功能，包括 tracker 文件创建和策略目录生成
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// 创建临时目录用于测试
const createTempDir = (): string => {
  const tempDir = join(tmpdir(), `omo-quota-init-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

// 清理临时目录
const cleanupTempDir = (tempDir: string): void => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

describe('init 命令 - 单元测试', () => {
  describe('STRATEGIES 常量验证', () => {
    test('应该包含所有必需的策略', async () => {
      const { STRATEGIES } = await import('../../types');

      expect(STRATEGIES.performance).toBe('strategy-1-performance.jsonc');
      expect(STRATEGIES.balanced).toBe('strategy-2-balanced.jsonc');
      expect(STRATEGIES.economical).toBe('strategy-3-economical.jsonc');
    });
  });
});

describe('init 命令 - 文件操作测试', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('tracker 文件结构', () => {
    test('应该创建有效的 tracker 数据结构', () => {
      const trackerPath = join(tempDir, 'tracker.json');
      const now = new Date().toISOString();
      const nextReset = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

      const trackerData = {
        currentStrategy: 'balanced',
        providers: {
          anthropic: {
            lastReset: now,
            nextReset: nextReset,
            resetInterval: '5h',
          },
          'google-1': {
            lastReset: now,
            nextReset: nextReset,
            resetInterval: '5h',
          },
          'google-2': {
            lastReset: now,
            nextReset: nextReset,
            resetInterval: '5h',
          },
          zhipuai: {
            lastReset: now,
            nextReset: nextReset,
            resetInterval: '5h',
          },
          fangzhou: {
            lastReset: now,
            nextReset: nextReset,
            resetInterval: '5h',
          },
          'github-copilot-premium': {
            month: new Date().toISOString().slice(0, 7),
            usage: 0,
            limit: 300,
          },
        },
      };

      writeFileSync(trackerPath, JSON.stringify(trackerData, null, 2));

      // 验证文件存在
      expect(existsSync(trackerPath)).toBe(true);

      // 验证数据结构
      const content = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(content.currentStrategy).toBe('balanced');
      expect(content.providers.anthropic).toBeDefined();
      expect(content.providers.anthropic.resetInterval).toBe('5h');
      expect(content.providers['github-copilot-premium'].limit).toBe(300);
    });

    test('应该覆盖已存在的 tracker 文件', () => {
      const trackerPath = join(tempDir, 'tracker.json');

      // 创建旧文件
      const oldData = { currentStrategy: 'performance', providers: {} };
      writeFileSync(trackerPath, JSON.stringify(oldData, null, 2));

      // 覆盖新文件
      const newData = { currentStrategy: 'balanced', providers: {} };
      writeFileSync(trackerPath, JSON.stringify(newData, null, 2));

      // 验证内容被覆盖
      const content = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(content.currentStrategy).toBe('balanced');
    });

    test('应该正确计算重置时间', async () => {
      const { calculateNextReset } = await import('../../utils/tracker');

      const result5h = calculateNextReset('5h');
      const result24h = calculateNextReset('24h');

      // 验证返回有效的 ISO 字符串
      expect(result5h).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result24h).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证时间差异大约正确
      const reset5h = new Date(result5h);
      const reset24h = new Date(result24h);
      const now = new Date();

      const diff5h = reset5h.getTime() - now.getTime();
      const diff24h = reset24h.getTime() - now.getTime();

      // 5小时 ≈ 5 * 60 * 60 * 1000 = 18,000,000 ms
      // 24小时 ≈ 24 * 60 * 60 * 1000 = 86,400,000 ms
      expect(diff5h).toBeGreaterThan(4.9 * 60 * 60 * 1000);
      expect(diff5h).toBeLessThan(5.1 * 60 * 60 * 1000);
      expect(diff24h).toBeGreaterThan(23.9 * 60 * 60 * 1000);
      expect(diff24h).toBeLessThan(24.1 * 60 * 60 * 1000);
    });
  });

  describe('策略文件生成', () => {
    test('应该生成有效的策略文件结构', () => {
      const strategiesDir = join(tempDir, 'strategies');
      mkdirSync(strategiesDir, { recursive: true });

      const performanceStrategy = {
        $schema: 'https://example.com/schema.json',
        description: '极致性能 - 使用顶级模型',
        agents: {
          sisyphus: { model: 'anthropic/claude-opus-4-5' },
        },
      };

      writeFileSync(
        join(strategiesDir, 'strategy-1-performance.jsonc'),
        JSON.stringify(performanceStrategy, null, 2)
      );

      // 验证文件存在
      expect(existsSync(join(strategiesDir, 'strategy-1-performance.jsonc'))).toBe(true);

      // 验证内容
      const content = JSON.parse(readFileSync(join(strategiesDir, 'strategy-1-performance.jsonc'), 'utf-8'));
      expect(content.description).toContain('极致性能');
      expect(content.agents.sisyphus.model).toBe('anthropic/claude-opus-4-5');
    });

    test('应该生成所有三个策略文件', () => {
      const strategiesDir = join(tempDir, 'strategies');
      mkdirSync(strategiesDir, { recursive: true });

      const strategies = [
        { name: 'performance', description: '极致性能型' },
        { name: 'balanced', description: '均衡实用型' },
        { name: 'economical', description: '经济节约型' },
      ];

      for (const strategy of strategies) {
        const content = {
          $schema: 'https://example.com/schema.json',
          description: strategy.description,
          agents: { sisyphus: { model: 'test/model' } },
        };
        writeFileSync(
          join(strategiesDir, `strategy-${strategies.indexOf(strategy) + 1}-${strategy.name}.jsonc`),
          JSON.stringify(content, null, 2)
        );
      }

      // 验证所有文件存在
      expect(existsSync(join(strategiesDir, 'strategy-1-performance.jsonc'))).toBe(true);
      expect(existsSync(join(strategiesDir, 'strategy-2-balanced.jsonc'))).toBe(true);
      expect(existsSync(join(strategiesDir, 'strategy-3-economical.jsonc'))).toBe(true);
    });
  });

  describe('generateStrategies 函数', () => {
    test('应该在指定目录生成策略文件', async () => {
      const { generateStrategies } = await import('../../utils/strategy-generator');

      const outputDir = join(tempDir, 'custom-strategies');
      const generatedFiles = generateStrategies(outputDir);

      // 验证返回文件列表
      expect(generatedFiles).toHaveLength(3);
      expect(generatedFiles.every(f => f.includes(outputDir))).toBe(true);

      // 验证文件存在
      expect(existsSync(join(outputDir, 'strategy-1-performance.jsonc'))).toBe(true);
      expect(existsSync(join(outputDir, 'strategy-2-balanced.jsonc'))).toBe(true);
      expect(existsSync(join(outputDir, 'strategy-3-economical.jsonc'))).toBe(true);
    });

    test('生成的策略文件应该包含必需的字段', async () => {
      const { generateStrategies } = await import('../../utils/strategy-generator');

      const outputDir = join(tempDir, 'validate-strategies');
      generateStrategies(outputDir);

      // 验证每个策略文件的结构
      const files = [
        'strategy-1-performance.jsonc',
        'strategy-2-balanced.jsonc',
        'strategy-3-economical.jsonc',
      ];

      for (const file of files) {
        const filePath = join(outputDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // 验证 JSON 格式（移除注释 - 更健壮的正则）
        const jsonContent = content
          .split('\n')
          .filter(line => !line.trim().startsWith('//'))
          .join('\n')
          .trim();
        const parsed = JSON.parse(jsonContent);

        expect(parsed.$schema).toBeDefined();
        expect(parsed.description).toBeDefined();
        expect(parsed.agents).toBeDefined();
        expect(Object.keys(parsed.agents).length).toBeGreaterThan(0);
      }
    });
  });
});

describe('init 命令 - 集成测试', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('完整的初始化流程模拟', async () => {
    const { generateStrategies } = await import('../../utils/strategy-generator');
    const { calculateNextReset } = await import('../../utils/tracker');

    // 1. 生成策略文件
    const outputDir = join(tempDir, 'strategies');
    const generatedFiles = generateStrategies(outputDir);
    expect(generatedFiles).toHaveLength(3);

    // 2. 创建 tracker 数据
    const now = new Date().toISOString();
    const trackerData = {
      currentStrategy: 'balanced',
      providers: {
        anthropic: {
          lastReset: now,
          nextReset: calculateNextReset('5h'),
          resetInterval: '5h',
        },
        'google-1': {
          lastReset: now,
          nextReset: calculateNextReset('5h'),
          resetInterval: '5h',
        },
        'google-2': {
          lastReset: now,
          nextReset: calculateNextReset('5h'),
          resetInterval: '5h',
        },
        zhipuai: {
          lastReset: now,
          nextReset: calculateNextReset('5h'),
          resetInterval: '5h',
        },
        fangzhou: {
          lastReset: now,
          nextReset: calculateNextReset('5h'),
          resetInterval: '5h',
        },
        'github-copilot-premium': {
          month: new Date().toISOString().slice(0, 7),
          usage: 0,
          limit: 300,
        },
      },
    };

    const trackerPath = join(tempDir, 'tracker.json');
    writeFileSync(trackerPath, JSON.stringify(trackerData, null, 2));

    // 验证结果
    expect(existsSync(trackerPath)).toBe(true);
    expect(existsSync(join(outputDir, 'strategy-1-performance.jsonc'))).toBe(true);

    const trackerContent = JSON.parse(readFileSync(trackerPath, 'utf-8'));
    expect(trackerContent.currentStrategy).toBe('balanced');
    expect(Object.keys(trackerContent.providers)).toHaveLength(6);
  });
});
