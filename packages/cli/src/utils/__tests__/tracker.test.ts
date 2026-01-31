/**
 * tracker 工具函数测试
 *
 * 测试 tracker.ts 中的工具函数
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// 创建临时目录用于测试
const createTempDir = (): string => {
  const tempDir = join(tmpdir(), `omo-quota-tracker-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

// 清理临时目录
const cleanupTempDir = (tempDir: string): void => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

describe('tracker 工具函数', () => {
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

  describe('loadTracker', () => {
    test('应该返回默认数据当 tracker 文件不存在时', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerModule = await import('../tracker');

      const result = trackerModule.loadTracker();

      expect(result).toEqual({
        providers: {},
        currentStrategy: 'balanced',
      });
    });

    test('应该读取并解析存在的 tracker 文件', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      // 创建 tracker 文件
      const trackerPath = join(tempDir, '.omo-quota-tracker.json');
      const testData = {
        currentStrategy: 'performance',
        providers: {
          anthropic: {
            lastReset: '2024-01-01T00:00:00.000Z',
            nextReset: '2024-01-01T05:00:00.000Z',
            resetInterval: '5h',
          },
        },
      };
      writeFileSync(trackerPath, JSON.stringify(testData, null, 2));

      // 设置环境变量指向测试文件
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const trackerModule = await import('../tracker');

      const result = trackerModule.loadTracker();

      expect(result.currentStrategy).toBe('performance');
      expect(result.providers.anthropic).toBeDefined();
      expect(result.providers.anthropic.lastReset).toBe('2024-01-01T00:00:00.000Z');

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });

    test('应该在文件损坏时返回默认数据', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      // 创建损坏的 tracker 文件
      const trackerPath = join(tempDir, '.omo-quota-tracker.json');
      writeFileSync(trackerPath, 'invalid json content {{{');

      // 设置环境变量指向测试文件
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const trackerModule = await import('../tracker');

      const result = trackerModule.loadTracker();

      expect(result).toEqual({
        providers: {},
        currentStrategy: 'balanced',
      });

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });

    test('应该正确解析完整的 tracker 数据', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerPath = join(tempDir, '.omo-quota-tracker.json');
      const testData = {
        currentStrategy: 'economical',
        providers: {
          anthropic: {
            lastReset: '2024-01-01T00:00:00.000Z',
            nextReset: '2024-01-01T05:00:00.000Z',
            resetInterval: '5h',
            usage: 100,
          },
          'github-copilot-premium': {
            month: '2024-01',
            usage: 150,
            limit: 300,
          },
          deepseek: {
            balance: '50.00',
            currency: 'CNY',
          },
        },
      };
      writeFileSync(trackerPath, JSON.stringify(testData, null, 2));

      // 设置环境变量指向测试文件
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const trackerModule = await import('../tracker');

      const result = trackerModule.loadTracker();

      expect(result.currentStrategy).toBe('economical');
      expect(result.providers.anthropic.usage).toBe(100);
      expect(result.providers['github-copilot-premium'].limit).toBe(300);
      expect(result.providers.deepseek.balance).toBe('50.00');

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });
  });

  describe('saveTracker', () => {
    test('应该创建 tracker 文件', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerModule = await import('../tracker');

      const trackerPath = join(tempDir, '.omo-quota-tracker.json');

      // 设置环境变量指向测试文件
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const testData = {
        currentStrategy: 'balanced',
        providers: {
          anthropic: {
            lastReset: new Date().toISOString(),
            nextReset: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
            resetInterval: '5h',
          },
        },
      };

      trackerModule.saveTracker(testData);

      expect(existsSync(trackerPath)).toBe(true);

      const savedData = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(savedData.currentStrategy).toBe('balanced');
      expect(savedData.providers.anthropic).toBeDefined();

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });

    test('应该覆盖已存在的 tracker 文件', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerPath = join(tempDir, '.omo-quota-tracker.json');

      // 创建初始文件
      writeFileSync(trackerPath, JSON.stringify({ old: 'data' }, null, 2));

      // 设置环境变量指向测试文件
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const trackerModule = await import('../tracker');

      const newData = {
        currentStrategy: 'performance',
        providers: {},
      };

      trackerModule.saveTracker(newData);

      const savedData = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(savedData.currentStrategy).toBe('performance');
      expect(savedData.old).toBeUndefined();

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });

    test('应该格式化 JSON 输出', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerModule = await import('../tracker');

      const trackerPath = join(tempDir, '.omo-quota-tracker.json');

      // 设置环境变量指向测试文件
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const testData = {
        currentStrategy: 'balanced',
        providers: {},
      };

      trackerModule.saveTracker(testData);

      const content = readFileSync(trackerPath, 'utf-8');

      // 验证 JSON 格式化（包含缩进和换行）
      expect(content).toContain('{\n');
      expect(content).toContain('  ');

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });
  });

  describe('calculateNextReset', () => {
    test('应该计算 5h 后的重置时间', async () => {
      const trackerModule = await import('../tracker');

      const before = new Date();
      const result = trackerModule.calculateNextReset('5h');
      const after = new Date();

      const resultDate = new Date(result);
      const expectedMin = new Date(before.getTime() + 5 * 60 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 5 * 60 * 60 * 1000);

      expect(resultDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
      expect(resultDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
    });

    test('应该计算 24h 后的重置时间', async () => {
      const trackerModule = await import('../tracker');

      const before = new Date();
      const result = trackerModule.calculateNextReset('24h');
      const after = new Date();

      const resultDate = new Date(result);
      const expectedMin = new Date(before.getTime() + 24 * 60 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 24 * 60 * 60 * 1000);

      expect(resultDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
      expect(resultDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
    });

    test('应该返回有效的 ISO 字符串', async () => {
      const trackerModule = await import('../tracker');

      const result = trackerModule.calculateNextReset('5h');

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('应该对未知间隔默认使用 24 小时', async () => {
      const trackerModule = await import('../tracker');

      const before = new Date();
      const result = trackerModule.calculateNextReset('unknown');
      const after = new Date();

      const resultDate = new Date(result);

      // calculateNextReset 对非 '5h' 的输入返回 24h 后的时间
      // 验证结果是 24 小时左右
      const diff = resultDate.getTime() - before.getTime();
      const expectedMs = 24 * 60 * 60 * 1000; // 24 小时

      expect(diff).toBeGreaterThanOrEqual(expectedMs - 1000);
      expect(diff).toBeLessThanOrEqual(expectedMs + (after.getTime() - before.getTime()) + 1000);
    });
  });

  describe('getTimeUntilReset', () => {
    test('应该返回剩余时间字符串', async () => {
      const trackerModule = await import('../tracker');

      const future = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000);
      const result = trackerModule.getTimeUntilReset(future.toISOString());

      expect(result).toContain('2h');
      expect(result).toContain('30m');
      expect(result).toContain('后');
    });

    test('应该返回已过期当时间已过', async () => {
      const trackerModule = await import('../tracker');

      const past = new Date(Date.now() - 60 * 60 * 1000);
      const result = trackerModule.getTimeUntilReset(past.toISOString());

      expect(result).toBe('已过期');
    });

    test('应该正确处理只有小时的情况', async () => {
      const trackerModule = await import('../tracker');

      const future = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const result = trackerModule.getTimeUntilReset(future.toISOString());

      expect(result).toMatch(/^3h\s+(0m|00m)\s+后$/);
    });

    test('应该正确处理只有分钟的情况', async () => {
      const trackerModule = await import('../tracker');

      const future = new Date(Date.now() + 45 * 60 * 1000);
      const result = trackerModule.getTimeUntilReset(future.toISOString());

      expect(result).toMatch(/^0h\s+45m\s+后$/);
    });

    test('应该处理即将过期的情况', async () => {
      const trackerModule = await import('../tracker');

      // 1秒后过期
      const future = new Date(Date.now() + 1000);
      const result = trackerModule.getTimeUntilReset(future.toISOString());

      expect(result).toBe('0h 0m 后');
    });

    test('应该处理零时间差', async () => {
      const trackerModule = await import('../tracker');

      const now = new Date();
      const result = trackerModule.getTimeUntilReset(now.toISOString());

      // 由于时间差异，可能是 0h 0m 后 或 已过期
      expect(result === '0h 0m 后' || result === '已过期').toBe(true);
    });
  });

  describe('集成测试', () => {
    test('应该支持完整的 load -> modify -> save 流程', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerModule = await import('../tracker');

      const trackerPath = join(tempDir, '.omo-quota-tracker.json');
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      // 创建初始数据
      const initialData = {
        currentStrategy: 'balanced',
        providers: {
          anthropic: {
            lastReset: '2024-01-01T00:00:00.000Z',
            nextReset: '2024-01-01T05:00:00.000Z',
            resetInterval: '5h',
          },
        },
      };
      trackerModule.saveTracker(initialData);

      // 加载数据
      const loaded = trackerModule.loadTracker();
      expect(loaded.currentStrategy).toBe('balanced');

      // 修改数据
      loaded.currentStrategy = 'performance';
      loaded.providers.anthropic.lastReset = new Date().toISOString();
      loaded.providers.anthropic.nextReset = trackerModule.calculateNextReset('5h');

      // 保存修改
      trackerModule.saveTracker(loaded);

      // 重新加载验证
      const reloaded = trackerModule.loadTracker();
      expect(reloaded.currentStrategy).toBe('performance');
      expect(reloaded.providers.anthropic.lastReset).not.toBe('2024-01-01T00:00:00.000Z');

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });

    test('应该处理包含所有提供商类型的完整 tracker', async () => {
      // 设置临时 HOME
      process.env.HOME = tempDir;

      const trackerModule = await import('../tracker');

      const trackerPath = join(tempDir, '.omo-quota-tracker.json');
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const completeData = {
        currentStrategy: 'balanced',
        providers: {
          // 5小时重置类型
          anthropic: {
            lastReset: new Date().toISOString(),
            nextReset: trackerModule.calculateNextReset('5h'),
            resetInterval: '5h',
          },
          // 月度类型
          'github-copilot-premium': {
            month: new Date().toISOString().slice(0, 7),
            usage: 120,
            limit: 300,
          },
          // 余额类型
          deepseek: {
            balance: '100.00',
            currency: 'CNY',
          },
        },
      };

      trackerModule.saveTracker(completeData);
      const loaded = trackerModule.loadTracker();

      expect(loaded.providers.anthropic.resetInterval).toBe('5h');
      expect(loaded.providers['github-copilot-premium'].usage).toBe(120);
      expect(loaded.providers.deepseek.balance).toBe('100.00');

      // 清理环境变量
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });
  });
});
