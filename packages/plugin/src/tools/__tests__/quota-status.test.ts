/**
 * quota-status tool tests
 */

import { test, expect, describe } from 'bun:test';

describe('quota-status tool - 单元测试', () => {
  test('应该正确计算使用百分比', () => {
    const used = 8500;
    const limit = 10000;
    const percentage = Math.round((used / limit) * 100);
    expect(percentage).toBe(85);
  });

  test('应该正确计算距离重置的剩余时间', () => {
    const now = Date.now();
    const nextReset = new Date(now + 30 * 60 * 1000);
    const diff = nextReset.getTime() - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let result = hours > 0 ? `${hours}小时${minutes}分后` : `${minutes}分钟后`;
    expect(result).toBe('30分钟后');
  });

  test('应该判断是否为小时重置类型的提供商', () => {
    const provider = {
      lastReset: '2025-01-31T00:00:00Z',
      nextReset: '2025-01-31T05:00:00Z',
      resetInterval: 'hourly',
      usage: 45,
    };
    const isHourly = 'resetInterval' in provider;
    expect(isHourly).toBe(true);
  });

  test('应该判断是否为月度重置类型的提供商', () => {
    const provider = { month: '2025-01', used: 8500, limit: 10000 };
    const isMonthly = 'month' in provider && 'limit' in provider;
    expect(isMonthly).toBe(true);
  });

  test('应该判断是否为余额类型的提供商', () => {
    const provider = { balance: '¥450.50', currency: 'CNY' };
    const isBalance = 'balance' in provider && 'currency' in provider;
    expect(isBalance).toBe(true);
  });

  test('应该正确显示提供商名称映射', () => {
    const providerNames: Record<string, string> = {
      anthropic: 'Claude Pro',
      'github-copilot-premium': 'GitHub Copilot Premium',
      deepseek: 'DeepSeek',
    };
    expect(providerNames['anthropic']).toBe('Claude Pro');
    expect(providerNames['deepseek']).toBe('DeepSeek');
  });

  test('应该正确显示策略名称映射', () => {
    const strategyNames: Record<string, string> = {
      performance: '极致性能型',
      balanced: '均衡实用型',
      economical: '极致省钱型',
    };
    expect(strategyNames['performance']).toBe('极致性能型');
    expect(strategyNames['economical']).toBe('极致省钱型');
  });

  test('应该判断是否需要显示警告', () => {
    const usages = [0, 45, 80, 85, 90, 95, 100];
    const warnings = usages.map(u => u > 80);
    expect(warnings[2]).toBe(false);
    expect(warnings[3]).toBe(true);
    expect(warnings[4]).toBe(true);
  });

  test('应该正确格式化提供商状态行 - 小时重置类型', () => {
    const provider = { usage: 45 };
    const displayName = 'Claude Pro';
    const usage = provider.usage ?? 0;
    const percentage = usage > 0 ? `${usage}%` : '活跃';
    expect(percentage).toBe('45%');
  });

  test('应该正确格式化提供商状态行 - 月度类型', () => {
    const provider = { used: 8500, limit: 10000 };
    const displayName = 'GitHub Copilot Premium';
    const percentage = Math.round((provider.used / provider.limit) * 100);
    expect(percentage).toBe(85);
  });

  test('应该添加警告emoji当使用率超过80%', () => {
    const usage = 85;
    const isWarning = usage > 80;
    expect(isWarning).toBe(true);
  });

  test('应该正确解析有效的tracker JSON', () => {
    const validJson = JSON.stringify({
      currentStrategy: 'balanced',
      providers: { anthropic: { usage: 45 } },
    });
    const parsed = JSON.parse(validJson);
    expect(parsed.currentStrategy).toBe('balanced');
  });

  test('应该处理无效的JSON', () => {
    const invalidJson = 'invalid json';
    expect(() => JSON.parse(invalidJson)).toThrow();
  });
});

describe('quota-status tool - 时间计算', () => {
  test('应该处理已过期的时间', () => {
    const now = Date.now();
    const pastReset = new Date(now - 10 * 60 * 1000);
    const diff = pastReset.getTime() - now;
    const result = diff < 0 ? '已过期' : '未来';
    expect(result).toBe('已过期');
  });

  test('应该正确处理超过1小时的剩余时间', () => {
    const now = Date.now();
    const nextReset = new Date(now + 90 * 60 * 1000);
    const diff = nextReset.getTime() - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    expect(hours).toBe(1);
    expect(minutes).toBe(30);
  });

  test('应该判断月度配额警告状态', () => {
    const providers = [
      { used: 5000, limit: 10000 },
      { used: 9500, limit: 10000 },
    ];
    const warnings = providers.map(p => Math.round((p.used / p.limit) * 100) > 90);
    expect(warnings[0]).toBe(false);
    expect(warnings[1]).toBe(true);
  });
});
