import chalk from 'chalk';
import { loadTracker, saveTracker } from '../utils/tracker';

export function update(provider: string, usageStr: string) {
  const usage = parseInt(usageStr, 10);

  if (isNaN(usage)) {
    console.error(chalk.red('✗ 用量必须是数字'));
    process.exit(1);
  }

  const tracker = loadTracker();

  if (!tracker.providers[provider]) {
    tracker.providers[provider] = {};
  }

  tracker.providers[provider].usage = usage;

  if (provider === 'github-copilot-premium') {
    tracker.providers[provider].limit = 300;
    tracker.providers[provider].month = new Date().toISOString().slice(0, 7);
  }

  saveTracker(tracker);
  console.log(chalk.green(`✓ 已更新 ${provider} 用量为 ${usage}`));
}
