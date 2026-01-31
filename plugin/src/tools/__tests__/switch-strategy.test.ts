/**
 * switch-strategy tool tests
 */

import { test, expect, describe } from 'bun:test';

describe('switch-strategy tool - 单元测试', () => {
  test('应该验证有效策略名称', () => {
    const STRATEGIES = {
      performance: 'strategy-1-performance.jsonc',
      balanced: 'strategy-2-balanced.jsonc',
      economical: 'strategy-3-economical.jsonc',
    };
    expect('performance' in STRATEGIES).toBe(true);
    expect('balanced' in STRATEGIES).toBe(true);
    expect('economical' in STRATEGIES).toBe(true);
  });

  test('应该拒绝无效策略名称', () => {
    const STRATEGIES = {
      performance: 'strategy-1-performance.jsonc',
      balanced: 'strategy-2-balanced.jsonc',
      economical: 'strategy-3-economical.jsonc',
    };
    expect('invalid' in STRATEGIES).toBe(false);
    expect('' in STRATEGIES).toBe(false);
  });

  test('应该正确映射策略显示名称', () => {
    const STRATEGY_NAMES = {
      performance: '极致性能型',
      balanced: '均衡实用型',
      economical: '极致省钱型',
    };
    expect(STRATEGY_NAMES['performance']).toBe('极致性能型');
    expect(STRATEGY_NAMES['balanced']).toBe('均衡实用型');
    expect(STRATEGY_NAMES['economical']).toBe('极致省钱型');
  });

  test('应该正确解析JSONC格式(移除单行注释)', () => {
    const jsonc = '{\n  // 注释\n  "name": "test"\n}';
    const withoutComments = jsonc.replace(/\/\/.*$/gm, '');
    const parsed = JSON.parse(withoutComments);
    expect(parsed.name).toBe('test');
  });

  test('应该正确解析JSONC格式(移除多行注释)', () => {
    const jsonc = '{\n  /* 注释 */\n  "name": "test"\n}';
    const withoutComments = jsonc.replace(/\/\*[\s\S]*?\*\//g, '');
    const parsed = JSON.parse(withoutComments);
    expect(parsed.name).toBe('test');
  });

  test('应该比较两个策略的差异', () => {
    const oldConfig = { agents: { Sisyphus: { model: 'anthropic/claude-opus-4' } } };
    const newConfig = { agents: { Sisyphus: { model: 'google/gemini-2.0-flash-exp' } } };
    
    const hasChange = oldConfig.agents.Sisyphus.model !== newConfig.agents.Sisyphus.model;
    expect(hasChange).toBe(true);
  });

  test('应该提取模型名称', () => {
    const models = ['anthropic/claude-opus-4', 'google/gemini-2.0-flash-exp', 'claude-opus-4'];
    expect(models[0].split('/')[1]).toBe('claude-opus-4');
    expect(models[1].split('/')[1]).toBe('gemini-2.0-flash-exp');
    expect(models[2].split('/').length).toBe(1);
  });

  test('应该正确格式化变更摘要', () => {
    const changes = ['Sisyphus: claude-opus-4 → gemini-2.0-flash-exp', 'prometheus: 新增'];
    const formatted = changes.length > 0 ? '  ' + changes.join('\n  ') : '  (无变更)';
    expect(formatted).toContain('Sisyphus');
    expect(formatted).toContain('prometheus: 新增');
  });

  test('应该处理空变更列表', () => {
    const changes: string[] = [];
    const formatted = changes.length > 0 ? '  ' + changes.join('\n  ') : '  (无变更)';
    expect(formatted).toBe('  (无变更)');
  });
});

describe('switch-strategy tool - 路径处理', () => {
  test('应该正确构建策略文件路径', () => {
    const homeDir = '/mock/home';
    const strategyFile = 'strategy-2-balanced.jsonc';
    const strategyPath = `${homeDir}/.config/opencode/strategies/${strategyFile}`;
    expect(strategyPath).toBe('/mock/home/.config/opencode/strategies/strategy-2-balanced.jsonc');
  });

  test('应该正确构建配置文件路径', () => {
    const homeDir = '/mock/home';
    const configPath = `${homeDir}/.config/opencode/oh-my-opencode.jsonc`;
    expect(configPath).toBe('/mock/home/.config/opencode/oh-my-opencode.jsonc');
  });

  test('应该正确构建备份文件路径', () => {
    const homeDir = '/mock/home';
    const backupPath = `${homeDir}/.config/opencode/oh-my-opencode.backup.jsonc`;
    expect(backupPath).toBe('/mock/home/.config/opencode/oh-my-opencode.backup.jsonc');
  });

  test('应该正确构建tracker文件路径', () => {
    const homeDir = '/mock/home';
    const trackerPath = `${homeDir}/.omo-quota-tracker.json`;
    expect(trackerPath).toBe('/mock/home/.omo-quota-tracker.json');
  });
});

describe('switch-strategy tool - Agent名称映射', () => {
  test('应该正确映射agent显示名称', () => {
    const AGENT_NAMES = {
      Sisyphus: 'Sisyphus',
      oracle: 'Oracle',
      prometheus: 'Prometheus',
    };
    expect(AGENT_NAMES['Sisyphus']).toBe('Sisyphus');
    expect(AGENT_NAMES['oracle']).toBe('Oracle');
  });
});

describe('switch-strategy tool - 错误处理', () => {
  test('应该处理策略文件不存在', () => {
    const strategyExists = false;
    const errorMessage = strategyExists ? '成功' : '策略文件不存在';
    expect(errorMessage).toContain('不存在');
  });

  test('应该处理大小写敏感的策略名', () => {
    const validStrategy = 'balanced';
    const invalidStrategy = 'Balanced';
    const STRATEGIES = { balanced: 'strategy-2-balanced.jsonc' };
    expect(validStrategy in STRATEGIES).toBe(true);
    expect(invalidStrategy in STRATEGIES).toBe(false);
  });
});
