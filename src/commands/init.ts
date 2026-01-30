import chalk from 'chalk';
import { existsSync } from 'fs';
import { saveTracker, calculateNextReset } from '../utils/tracker';
import { TRACKER_PATH } from '../types';

export function init() {
  if (existsSync(TRACKER_PATH)) {
    console.log(chalk.yellow('⚠ 追踪文件已存在，将覆盖现有数据'));
  }

  const now = new Date().toISOString();

  const defaultTracker = {
    currentStrategy: 'balanced',
    providers: {
      'anthropic': {
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
      'zhipuai': {
        lastReset: now,
        nextReset: calculateNextReset('5h'),
        resetInterval: '5h',
      },
      'fangzhou': {
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

  saveTracker(defaultTracker);
  
  console.log(chalk.green('✓ 已初始化配额追踪文件'));
  console.log(chalk.gray(`位置: ${TRACKER_PATH}`));
  console.log(chalk.cyan('\n提示: 所有资源的上次重置时间已设置为当前时间。'));
  console.log(chalk.cyan('如需调整，请使用 omo-quota reset <provider> 命令。'));
}
