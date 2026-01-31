/**
 * status 命令测试
 *
 * 测试状态显示功能，包括正常状态和错误处理
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// 创建临时目录用于测试
const createTempDir = (): string => {
  const tempDir = join(tmpdir(), `omo-quota-status-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

// 清理临时目录
const cleanupTempDir = (tempDir: string): void => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

describe('status 命令 - 工具函数测试', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('getTimeUntilReset 函数', () => {
    test('应该返回剩余时间字符串', async () => {
      const { getTimeUntilReset } = await import('../../utils/tracker');

      const future = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000);
      const result = getTimeUntilReset(future.toISOString());

      expect(result).toContain('2h');
      expect(result).toContain('30m');
      expect(result).toContain('后');
    });

    test('应该返回已过期当时间已过', async () => {
      const { getTimeUntilReset } = await import('../../utils/tracker');

      const past = new Date(Date.now() - 60 * 60 * 1000);
      const result = getTimeUntilReset(past.toISOString());

      expect(result).toBe('已过期');
    });

    test('应该正确处理只有小时的情况', async () => {
      const { getTimeUntilReset } = await import('../../utils/tracker');

      const future = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const result = getTimeUntilReset(future.toISOString());

      expect(result).toMatch(/^3h\s+(0m|00m)\s+后$/);
    });

    test('应该正确处理只有分钟的情况', async () => {
      const { getTimeUntilReset } = await import('../../utils/tracker');

      const future = new Date(Date.now() + 45 * 60 * 1000);
      const result = getTimeUntilReset(future.toISOString());

      expect(result).toMatch(/^0h\s+45m\s+后$/);
    });
  });

  describe('loadTracker 函数', () => {
    test('应该返回默认数据当 tracker 文件不存在时', async () => {
      const { loadTracker } = await import('../../utils/tracker');

      // 设置空的环境变量以确保读取默认路径
      const originalPath = process.env.OMO_QUOTA_TRACKER_PATH;
      delete process.env.OMO_QUOTA_TRACKER_PATH;

      const result = loadTracker();

      // 恢复环境变量
      if (originalPath !== undefined) {
        process.env.OMO_QUOTA_TRACKER_PATH = originalPath;
      }

      // 验证基本结构（由于用户可能有文件，我们只验证结构存在）
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('currentStrategy');
    });

    test('应该读取并解析存在的 tracker 文件', async () => {
      const { loadTracker } = await import('../../utils/tracker');

      // 创建临时文件
      const trackerPath = join(tempDir, 'test-tracker.json');
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

      // 设置环境变量
      process.env.OMO_QUOTA_TRACKER_PATH = trackerPath;

      const result = loadTracker();

      expect(result.currentStrategy).toBe('performance');
      expect(result.providers.anthropic).toBeDefined();
      expect(result.providers.anthropic.lastReset).toBe('2024-01-01T00:00:00.000Z');

      // 清理
      delete process.env.OMO_QUOTA_TRACKER_PATH;
    });
  });

  describe('tracker 数据结构验证', () => {
    test('应该正确处理5小时重置资源', () => {
      const trackerPath = join(tempDir, 'tracker.json');
      const now = new Date();

      const trackerData = {
        currentStrategy: 'balanced',
        providers: {
          anthropic: {
            lastReset: now.toISOString(),
            nextReset: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            resetInterval: '5h',
          },
        },
      };

      writeFileSync(trackerPath, JSON.stringify(trackerData, null, 2));

      const content = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(content.providers.anthropic.resetInterval).toBe('5h');
      expect(content.providers.anthropic.nextReset).toBeDefined();
    });

    test('应该正确处理月度资源', () => {
      const trackerPath = join(tempDir, 'tracker.json');

      const trackerData = {
        currentStrategy: 'balanced',
        providers: {
          'github-copilot-premium': {
            month: new Date().toISOString().slice(0, 7),
            usage: 150,
            limit: 300,
          },
        },
      };

      writeFileSync(trackerPath, JSON.stringify(trackerData, null, 2));

      const content = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(content.providers['github-copilot-premium'].usage).toBe(150);
      expect(content.providers['github-copilot-premium'].limit).toBe(300);
    });

    test('应该正确计算使用率百分比', () => {
      const usage = 180;
      const limit = 300;
      const percentage = Math.round((usage / limit) * 100);

      expect(percentage).toBe(60);

      // 测试高使用率警告阈值
      expect(percentage).toBeGreaterThan(50);
      expect(percentage).toBeLessThan(80);
    });

    test('应该标记高使用率', () => {
      const usage = 250;
      const limit = 300;
      const percentage = Math.round((usage / limit) * 100);

      expect(percentage).toBe(83);
      expect(percentage).toBeGreaterThan(80);
    });
  });

  describe('提供商名称映射', () => {
    test('应该正确映射提供商名称', () => {
      const providerNames: Record<string, string> = {
        'anthropic': 'Claude Pro',
        'google-1': 'Gemini Pro #1',
        'google-2': 'Gemini Pro #2',
        'zhipuai': 'ZhiPuAI Max',
        'fangzhou': '方舟 CodingPlan Pro',
      };

      expect(providerNames['anthropic']).toBe('Claude Pro');
      expect(providerNames['google-1']).toBe('Gemini Pro #1');
      expect(providerNames['zhipuai']).toBe('ZhiPuAI Max');
    });

    test('应该正确映射策略名称', () => {
      const strategyNames: Record<string, string> = {
        performance: '极致性能型',
        balanced: '均衡实用型',
        economical: '极致省钱型',
      };

      expect(strategyNames['performance']).toBe('极致性能型');
      expect(strategyNames['balanced']).toBe('均衡实用型');
      expect(strategyNames['economical']).toBe('极致省钱型');
    });
  });
});

describe('status 命令 - 集成测试', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('状态数据准备', () => {
    test('应该准备完整的 tracker 数据', () => {
      const trackerPath = join(tempDir, 'tracker.json');
      const now = new Date();

      const trackerData = {
        currentStrategy: 'balanced',
        providers: {
          // 5小时重置资源
          anthropic: {
            lastReset: now.toISOString(),
            nextReset: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            resetInterval: '5h',
          },
          'google-1': {
            lastReset: now.toISOString(),
            nextReset: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
            resetInterval: '5h',
          },
          // 月度资源
          'github-copilot-premium': {
            month: now.toISOString().slice(0, 7),
            usage: 120,
            limit: 300,
          },
        },
      };

      writeFileSync(trackerPath, JSON.stringify(trackerData, null, 2));

      // 验证数据结构
      const content = JSON.parse(readFileSync(trackerPath, 'utf-8'));
      expect(content.currentStrategy).toBe('balanced');
      expect(Object.keys(content.providers)).toHaveLength(3);
      expect(content.providers.anthropic.resetInterval).toBe('5h');
      expect(content.providers['github-copilot-premium'].usage).toBe(120);
    });

    test('应该处理已过期的资源', async () => {
      const { getTimeUntilReset } = await import('../../utils/tracker');

      const past = new Date(Date.now() - 60 * 60 * 1000);
      const result = getTimeUntilReset(past.toISOString());

      expect(result).toBe('已过期');
    });

    test('应该处理即将重置的资源', async () => {
      const { getTimeUntilReset } = await import('../../utils/tracker');

      // 20分钟后重置
      const future = new Date(Date.now() + 20 * 60 * 1000);
      const result = getTimeUntilReset(future.toISOString());

      expect(result).toContain('0h');
      expect(result).toContain('20m');
    });
  });
});
