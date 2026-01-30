import chalk from 'chalk';
import { loadTracker, saveTracker, calculateNextReset } from '../utils/tracker';

export function reset(provider: string) {
  const tracker = loadTracker();
  const now = new Date().toISOString();

  if (provider === 'all') {
    const providers = ['anthropic', 'google-1', 'google-2', 'zhipuai', 'fangzhou'];
    
    for (const p of providers) {
      if (!tracker.providers[p]) {
        tracker.providers[p] = {};
      }
      tracker.providers[p].lastReset = now;
      tracker.providers[p].nextReset = calculateNextReset('5h');
      tracker.providers[p].resetInterval = '5h';
    }

    saveTracker(tracker);
    console.log(chalk.green('✓ 已标记所有 5 小时重置资源'));
  } else {
    if (!tracker.providers[provider]) {
      tracker.providers[provider] = {};
    }

    tracker.providers[provider].lastReset = now;
    tracker.providers[provider].nextReset = calculateNextReset('5h');
    tracker.providers[provider].resetInterval = '5h';

    saveTracker(tracker);
    console.log(chalk.green(`✓ 已标记 ${provider} 为已重置`));
  }
}
