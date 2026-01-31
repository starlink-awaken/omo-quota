import { homedir } from 'os';
import { join } from 'path';

/**
 * 配置文件路径
 */
export const PATHS = {
  // 追踪文件
  tracker: join(homedir(), '.omo-quota-tracker.json'),
  
  // OpenCode 配置目录
  opencodeConfig: join(homedir(), '.config', 'opencode'),
  
  // 策略文件目录
  strategiesDir: join(homedir(), '.config', 'opencode', 'strategies'),
  
  // 当前配置文件
  currentConfig: join(homedir(), '.config', 'opencode', 'oh-my-opencode.jsonc'),
  
  // 备份配置文件
  backupConfig: join(homedir(), '.config', 'opencode', 'oh-my-opencode.backup.jsonc'),
};

/**
 * 获取策略文件路径
 */
export function getStrategyPath(strategy: string): string {
  return join(PATHS.strategiesDir, `strategy-${getStrategyNumber(strategy)}-${strategy}.jsonc`);
}

/**
 * 获取策略编号
 */
function getStrategyNumber(strategy: string): number {
  const numbers: Record<string, number> = {
    performance: 1,
    balanced: 2,
    economical: 3,
  };
  return numbers[strategy] || 0;
}
