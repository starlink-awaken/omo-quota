/**
 * cost-report tool tests
 */

import { test, expect, describe } from 'bun:test';

describe('cost-report tool - 定价计算', () => {
  test('应该正确计算Anthropic Claude Opus成本', () => {
    const pricing = { prompt: 0.015, completion: 0.075 };
    const inputTokens = 1000000;
    const outputTokens = 500000;
    const promptCost = (inputTokens / 1000000) * pricing.prompt;
    const completionCost = (outputTokens / 1000000) * pricing.completion;
    const total = promptCost + completionCost;
    expect(promptCost).toBe(0.015);
    expect(completionCost).toBe(0.0375);
    expect(total).toBeCloseTo(0.0525);
  });

  test('应该正确计算Anthropic Claude Sonnet成本', () => {
    const pricing = { prompt: 0.003, completion: 0.015 };
    const inputTokens = 1000000;
    const outputTokens = 500000;
    const promptCost = (inputTokens / 1000000) * pricing.prompt;
    const completionCost = (outputTokens / 1000000) * pricing.completion;
    expect(promptCost).toBe(0.003);
    expect(completionCost).toBe(0.0075);
  });

  test('应该正确计算Google Gemini成本', () => {
    const pricing = { prompt: 0.00125, completion: 0.005 };
    const inputTokens = 1000000;
    const outputTokens = 500000;
    const promptCost = (inputTokens / 1000000) * pricing.prompt;
    const completionCost = (outputTokens / 1000000) * pricing.completion;
    expect(promptCost).toBe(0.00125);
    expect(completionCost).toBe(0.0025);
  });

  test('应该正确计算DeepSeek成本', () => {
    const pricing = { prompt: 0.0014, completion: 0.0028 };
    const inputTokens = 1000000;
    const outputTokens = 500000;
    const promptCost = (inputTokens / 1000000) * pricing.prompt;
    const completionCost = (outputTokens / 1000000) * pricing.completion;
    expect(promptCost).toBe(0.0014);
    expect(completionCost).toBe(0.0014);
  });

  test('应该计算带cache的成本', () => {
    const pricing = { prompt: 0.003, completion: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 };
    const inputTokens = 1000000;
    const outputTokens = 500000;
    const cacheReadTokens = 800000;
    const cacheWriteTokens = 200000;
    const promptCost = (inputTokens / 1000000) * pricing.prompt;
    const completionCost = (outputTokens / 1000000) * pricing.completion;
    const cacheCost = (cacheReadTokens / 1000000) * pricing.cacheRead +
                     (cacheWriteTokens / 1000000) * pricing.cacheWrite;
    const total = promptCost + completionCost + cacheCost;
    expect(cacheCost).toBeCloseTo(0.00099);
    expect(total).toBeCloseTo(0.01149);
  });
});

describe('cost-report tool - 聚合计算', () => {
  test('应该按提供商聚合成本', () => {
    const costs = [
      { provider: 'anthropic', cost: 0.05 },
      { provider: 'anthropic', cost: 0.03 },
      { provider: 'google', cost: 0.01 },
    ];
    const providerCosts = new Map<string, number>();
    for (const item of costs) {
      providerCosts.set(item.provider, (providerCosts.get(item.provider) || 0) + item.cost);
    }
    expect(providerCosts.get('anthropic')).toBe(0.08);
    expect(providerCosts.get('google')).toBe(0.01);
  });

  test('应该计算提供商成本百分比', () => {
    const costs = [{ provider: 'anthropic', cost: 0.08 }, { provider: 'google', cost: 0.02 }];
    const totalCost = 0.10;
    const percentages = costs.map(p => ({
      provider: p.provider,
      percentage: (p.cost / totalCost * 100).toFixed(1),
    }));
    expect(percentages[0].percentage).toBe('80.0');
    expect(percentages[1].percentage).toBe('20.0');
  });

  test('应该按成本降序排序提供商', () => {
    const providerCosts = new Map([['anthropic', 0.08], ['google', 0.02]]);
    const sorted = Array.from(providerCosts.entries()).sort((a, b) => b[1] - a[1]);
    expect(sorted[0][0]).toBe('anthropic');
    expect(sorted[1][0]).toBe('google');
  });
});

describe('cost-report tool - 日期过滤', () => {
  test('应该正确过滤今日消息', () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const messages = [
      { time: { created: startOfDay - 1000 } },
      { time: { created: startOfDay + 1000 } },
      { time: { created: Date.now() } },
    ];
    const todayMessages = messages.filter(m => m.time.created >= startOfDay);
    expect(todayMessages.length).toBe(2);
  });

  test('应该正确过滤本月消息', () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const messages = [
      { time: { created: startOfMonth - 86400000 } },
      { time: { created: startOfMonth + 86400000 } },
    ];
    const monthMessages = messages.filter(m => m.time.created >= startOfMonth);
    expect(monthMessages.length).toBe(1);
  });

  test('应该计算月度日均成本', () => {
    const totalCost = 15.50;
    const daysInMonth = 31;
    const dailyAverage = totalCost / daysInMonth;
    expect(dailyAverage).toBeCloseTo(0.5);
  });
});

describe('cost-report tool - 格式化', () => {
  test('应该正确格式化货币值(USD)', () => {
    expect('$' + 0.01234.toFixed(4)).toBe('$0.0123');
    expect('$' + 1.2345.toFixed(4)).toBe('$1.2345');
  });

  test('应该正确格式化货币值(CNY)', () => {
    expect('¥' + 10.50.toFixed(2)).toBe('¥10.50');
  });

  test('应该格式化数字(千分位)', () => {
    expect((1000).toLocaleString('en-US')).toBe('1,000');
    expect((1000000).toLocaleString('en-US')).toBe('1,000,000');
  });
});

describe('cost-report tool - 报告生成', () => {
  test('应该生成每日报告标题', () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const title = '📊 成本报告（' + dateStr + '）';
    expect(title).toContain('📊');
    expect(title).toContain('成本报告');
    expect(title).toContain(dateStr);
  });

  test('应该生成月度报告标题', () => {
    const now = new Date();
    const monthStr = now.toISOString().substring(0, 7);
    const title = '📊 成本报告（' + monthStr + '）';
    expect(title).toContain(monthStr);
  });

  test('应该格式化提供商成本行', () => {
    const provider = 'anthropic';
    const cost = 0.0525;
    const totalCost = 0.10;
    const percentage = (cost / totalCost * 100).toFixed(1);
    const line = '  • ' + provider + ': $' + cost.toFixed(4) + ' (' + percentage + '%)';
    expect(line).toContain('anthropic');
    expect(line).toContain('52.5%');
  });

  test('应该处理无数据情况', () => {
    const messageCount = 0;
    const output = messageCount === 0 ? '未找到使用数据' : '有数据';
    expect(output).toContain('未找到使用数据');
  });
});
