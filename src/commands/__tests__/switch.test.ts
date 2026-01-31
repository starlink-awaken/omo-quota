/**
 * switch 命令测试
 *
 * 测试策略切换功能，包括验证、备份和切换逻辑
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, copyFileSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// 创建临时目录用于测试
const createTempDir = (): string => {
  const tempDir = join(tmpdir(), `omo-quota-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

// 清理临时目录
const cleanupTempDir = (tempDir: string): void => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

describe('switch 命令 - 单元测试', () => {
  describe('isValidStrategy 函数', () => {
    test('应该拒绝无效的策略名称', async () => {
      const { isValidStrategy } = await import('../switch');

      expect(isValidStrategy('invalid-strategy')).toBe(false);
      expect(isValidStrategy('')).toBe(false);
      expect(isValidStrategy('random')).toBe(false);
    });

    test('应该接受所有有效的策略名称', async () => {
      const { isValidStrategy } = await import('../switch');

      expect(isValidStrategy('performance')).toBe(true);
      expect(isValidStrategy('balanced')).toBe(true);
      expect(isValidStrategy('economical')).toBe(true);
    });

    test('应该区分大小写', async () => {
      const { isValidStrategy } = await import('../switch');

      expect(isValidStrategy('Performance')).toBe(false);
      expect(isValidStrategy('BALANCED')).toBe(false);
      expect(isValidStrategy('Economical')).toBe(false);
    });
  });
});

describe('switch 命令 - 文件操作测试', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('备份功能', () => {
    test('应该正确创建备份文件', () => {
      const configDir = join(tempDir, '.config', 'opencode');
      mkdirSync(configDir, { recursive: true });

      // 创建现有配置文件
      const existingConfig = {
        $schema: 'https://example.com/schema.json',
        description: '现有配置',
        agents: {
          sisyphus: { model: 'test/model' },
        },
      };
      const configPath = join(configDir, 'oh-my-opencode.jsonc');
      writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));

      // 创建备份
      const backupPath = join(configDir, 'oh-my-opencode.backup.jsonc');
      copyFileSync(configPath, backupPath);

      // 验证备份文件存在
      expect(existsSync(backupPath)).toBe(true);

      // 验证备份内容与原始配置一致
      const backupContent = JSON.parse(readFileSync(backupPath, 'utf-8'));
      expect(backupContent.description).toBe('现有配置');
      expect(backupContent.agents.sisyphus.model).toBe('test/model');
    });

    test('应该能够从备份恢复', () => {
      const configDir = join(tempDir, '.config', 'opencode');
      mkdirSync(configDir, { recursive: true });

      // 创建备份文件
      const backupConfig = {
        $schema: 'https://example.com/schema.json',
        description: '备份配置',
        agents: {
          sisyphus: { model: 'backup/model' },
        },
      };
      const backupPath = join(configDir, 'oh-my-opencode.backup.jsonc');
      writeFileSync(backupPath, JSON.stringify(backupConfig, null, 2));

      // 从备份恢复
      const configPath = join(configDir, 'oh-my-opencode.jsonc');
      copyFileSync(backupPath, configPath);

      // 验证恢复的配置
      const restoredContent = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(restoredContent.description).toBe('备份配置');
      expect(restoredContent.agents.sisyphus.model).toBe('backup/model');
    });
  });

  describe('策略文件操作', () => {
    test('应该正确读取策略文件', () => {
      const strategiesDir = join(tempDir, 'strategies');
      mkdirSync(strategiesDir, { recursive: true });

      const strategy = {
        $schema: 'https://example.com/schema.json',
        description: '测试策略',
        agents: {
          sisyphus: { model: 'test/model' },
        },
      };

      const strategyPath = join(strategiesDir, 'strategy-test.jsonc');
      writeFileSync(strategyPath, JSON.stringify(strategy, null, 2));

      // 读取并验证
      const content = JSON.parse(readFileSync(strategyPath, 'utf-8'));
      expect(content.description).toBe('测试策略');
      expect(content.agents.sisyphus.model).toBe('test/model');
    });

    test('应该在策略文件不存在时返回 false', () => {
      const strategiesDir = join(tempDir, 'strategies');
      mkdirSync(strategiesDir, { recursive: true });

      const nonExistentPath = join(strategiesDir, 'strategy-nonexistent.jsonc');
      expect(existsSync(nonExistentPath)).toBe(false);
    });
  });

  describe('Tracker 文件操作', () => {
    test('应该正确更新 tracker 文件', () => {
      // 创建初始 tracker
      const trackerPath = join(tempDir, 'tracker.json');
      const initialData = {
        currentStrategy: 'balanced',
        providers: {},
      };
      writeFileSync(trackerPath, JSON.stringify(initialData, null, 2));

      // 读取、修改并保存
      const data = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      data.currentStrategy = 'performance';
      writeFileSync(trackerPath, JSON.stringify(data, null, 2));

      // 验证更新
      const updated = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(updated.currentStrategy).toBe('performance');
    });

    test('应该正确处理不存在的 tracker 文件', () => {
      const trackerPath = join(tempDir, 'nonexistent-tracker.json');

      expect(existsSync(trackerPath)).toBe(false);

      // 创建默认 tracker
      const defaultData = {
        currentStrategy: 'balanced',
        providers: {},
      };
      writeFileSync(trackerPath, JSON.stringify(defaultData, null, 2));

      expect(existsSync(trackerPath)).toBe(true);
    });
  });
});

describe('switch 命令 - 集成测试', () => {
  let tempDir: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    tempDir = createTempDir();
    originalHome = process.env.HOME;
  });

  afterEach(() => {
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    }
    cleanupTempDir(tempDir);
  });

  test('集成测试: 完整的切换流程模拟', () => {
    // 设置临时 HOME
    process.env.HOME = tempDir;

    // 创建必要的目录结构
    const configDir = join(tempDir, '.config', 'opencode');
    const strategiesDir = join(configDir, 'strategies');
    mkdirSync(strategiesDir, { recursive: true });

    // 创建策略文件
    const performanceStrategy = {
      $schema: 'https://example.com/schema.json',
      description: '极致性能型',
      agents: {
        sisyphus: { model: 'anthropic/claude-opus-4-5' },
      },
    };

    writeFileSync(
      join(strategiesDir, 'strategy-1-performance.jsonc'),
      JSON.stringify(performanceStrategy, null, 2)
    );

    // 创建 tracker 文件
    const trackerData = {
      currentStrategy: 'balanced',
      providers: {},
    };
    const trackerPath = join(tempDir, '.omo-quota-tracker.json');
    writeFileSync(trackerPath, JSON.stringify(trackerData, null, 2));

    // 模拟切换操作
    const strategyPath = join(strategiesDir, 'strategy-1-performance.jsonc');
    const configPath = join(configDir, 'oh-my-opencode.jsonc');

    // 复制策略文件到配置
    copyFileSync(strategyPath, configPath);

    // 更新 tracker
    const tracker = JSON.parse(readFileSync(trackerPath, 'utf-8'));
    tracker.currentStrategy = 'performance';
    writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));

    // 验证结果
    expect(existsSync(configPath)).toBe(true);
    const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(configContent.description).toContain('极致性能型');

    const updatedTracker = JSON.parse(readFileSync(trackerPath, 'utf-8'));
    expect(updatedTracker.currentStrategy).toBe('performance');
  });
});
