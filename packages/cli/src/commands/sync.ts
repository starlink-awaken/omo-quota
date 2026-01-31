import chalk from 'chalk';
import { scanAllSessions, DEFAULT_STORAGE_PATH } from '../utils/message-parser';
import { loadTracker, saveTracker } from '../utils/tracker';

export async function syncQuota() {
  console.log(chalk.cyan('🔄 Syncing quota from oh-my-opencode messages...\n'));
  
  const startTime = Date.now();
  
  console.log(chalk.gray(`Scanning: ${DEFAULT_STORAGE_PATH}`));
  const messages = await scanAllSessions(DEFAULT_STORAGE_PATH);
  
  if (messages.length === 0) {
    console.log(chalk.yellow('⚠️  No messages found. Make sure oh-my-opencode has been used.'));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${messages.length} assistant messages\n`));
  
  const providerUsage = new Map<string, number>();
  
  for (const msg of messages) {
    const totalTokens = msg.tokens.input + msg.tokens.output;
    const current = providerUsage.get(msg.providerID) || 0;
    providerUsage.set(msg.providerID, current + totalTokens);
  }
  
  const tracker = loadTracker();
  
  for (const [provider, tokens] of providerUsage.entries()) {
    if (!tracker.providers[provider]) {
      tracker.providers[provider] = {};
    }
    
    tracker.providers[provider].usage = tokens;
    
    console.log(
      chalk.blue(`${provider}:`),
      chalk.white(`${tokens.toLocaleString()} tokens`)
    );
  }
  
  saveTracker(tracker);
  
  const elapsed = Date.now() - startTime;
  console.log(chalk.green(`\n✓ Sync completed in ${elapsed}ms`));
  console.log(chalk.gray(`Updated: ${process.env.HOME}/.omo-quota-tracker.json`));
}
