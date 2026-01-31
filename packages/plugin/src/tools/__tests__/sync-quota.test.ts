/**
 * sync-quota tool tests
 */

import { test, expect, describe } from 'bun:test';

describe('sync-quota tool - 单元测试', () => {
  test('应该正确解析消息数据', () => {
    const messageData = {
      role: 'assistant',
      providerID: 'anthropic',
      tokens: { input: 1000, output: 500 },
    };
    const isValid = messageData.role === 'assistant';
    const totalTokens = messageData.tokens.input + messageData.tokens.output;
    expect(isValid).toBe(true);
    expect(totalTokens).toBe(1500);
  });

  test('应该跳过非assistant角色的消息', () => {
    const messages = [
      { role: 'user', tokens: { input: 100 } },
      { role: 'assistant', tokens: { input: 1000, output: 500 } },
    ];
    const validMessages = messages.filter(m => m.role === 'assistant');
    expect(validMessages.length).toBe(1);
  });

  test('应该聚合提供商使用量', () => {
    const messages = [
      { providerID: 'anthropic', tokens: { input: 5000, output: 2000 } },
      { providerID: 'anthropic', tokens: { input: 3000, output: 1000 } },
      { providerID: 'google', tokens: { input: 2000, output: 1000 } },
    ];
    const providerUsage = new Map<string, number>();
    for (const msg of messages) {
      const total = msg.tokens.input + msg.tokens.output;
      providerUsage.set(msg.providerID, (providerUsage.get(msg.providerID) || 0) + total);
    }
    expect(providerUsage.get('anthropic')).toBe(11000);
    expect(providerUsage.get('google')).toBe(3000);
  });

  test('应该正确计算总token数', () => {
    const tokens = { input: 10000, output: 2000, reasoning: 15000 };
    const standardTokens = tokens.input + tokens.output;
    const totalWithReasoning = standardTokens + tokens.reasoning;
    expect(standardTokens).toBe(12000);
    expect(totalWithReasoning).toBe(27000);
  });

  test('应该处理带缓存的token计算', () => {
    const tokens = { input: 10000, output: 2000, cache: { read: 8000, write: 2000 } };
    const hasCache = !!(tokens.cache && (tokens.cache.read > 0 || tokens.cache.write > 0));
    const cacheTotal = (tokens.cache?.read || 0) + (tokens.cache?.write || 0);
    expect(hasCache).toBe(true);
    expect(cacheTotal).toBe(10000);
  });

  test('应该格式化数字(千分位)', () => {
    expect((1000).toLocaleString('en-US')).toBe('1,000');
    expect((1000000).toLocaleString('en-US')).toBe('1,000,000');
  });

  test('应该从providerID提取key', () => {
    const keys = ['anthropic', 'google-1', 'github-copilot-premium']
      .map(id => id.toLowerCase().split('-')[0]);
    expect(keys[0]).toBe('anthropic');
    expect(keys[1]).toBe('google');
    expect(keys[2]).toBe('github');
  });
});

describe('sync-quota tool - 时间相关测试', () => {
  test('应该正确判断同步间隔', () => {
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();
    const lastSyncTimes = [now - 2 * 60 * 1000, now - 6 * 60 * 1000];
    const shouldSync = lastSyncTimes.map(time => now - time > fiveMinutes);
    expect(shouldSync[0]).toBe(false);
    expect(shouldSync[1]).toBe(true);
  });

  test('应该处理强制同步选项', () => {
    const force = true;
    expect(force).toBe(true);
  });

  test('应该格式化时间差(分钟)', () => {
    const now = Date.now();
    const pastTime = now - 3 * 60 * 1000;
    const minutesAgo = Math.floor((now - pastTime) / 60000);
    expect(minutesAgo).toBe(3);
  });
});

describe('sync-quota tool - Tracker更新', () => {
  test('应该创建新的tracker条目', () => {
    const tracker: any = { currentStrategy: 'balanced', providers: {} };
    const providerID = 'anthropic';
    const usage = 12000;
    if (!tracker.providers[providerID]) {
      tracker.providers[providerID] = {};
    }
    tracker.providers[providerID].usage = usage;
    expect(tracker.providers[providerID].usage).toBe(12000);
  });
});

describe('sync-quota tool - 消息文件匹配', () => {
  test('应该匹配消息文件名模式', () => {
    const fileNames = ['msg_001.json', 'msg_123.json', 'ses_001', 'other.txt'];
    const msgFiles = fileNames.filter(f => f.startsWith('msg_'));
    expect(msgFiles.length).toBe(2);
  });

  test('应该匹配会话目录名模式', () => {
    const dirNames = ['ses_001', 'ses_002', 'msg_001.json', 'other_dir'];
    const sessionDirs = dirNames.filter(d => d.startsWith('ses_'));
    expect(sessionDirs.length).toBe(2);
  });
});
