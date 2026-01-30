import chalk from 'chalk';
import boxen from 'boxen';
import { loadTracker, getTimeUntilReset } from '../utils/tracker';

export function status() {
  const tracker = loadTracker();
  const providers = tracker.providers;

  const strategyNames: Record<string, string> = {
    performance: '极致性能型',
    balanced: '均衡实用型',
    economical: '极致省钱型',
  };

  let output = '';
  
  output += chalk.bold.cyan(`当前策略: ${tracker.currentStrategy} (${strategyNames[tracker.currentStrategy] || '未知'})\n`);
  output += chalk.gray('─'.repeat(50)) + '\n\n';

  output += chalk.bold.yellow('5小时重置资源:\n');
  const fiveHourProviders = ['anthropic', 'google-1', 'google-2', 'zhipuai', 'fangzhou'];
  
  for (const provider of fiveHourProviders) {
    const status = providers[provider];
    if (status && status.nextReset) {
      const timeLeft = getTimeUntilReset(status.nextReset);
      const isExpired = timeLeft === '已过期';
      const icon = isExpired ? chalk.red('✗') : chalk.green('✓');
      const providerName = getProviderDisplayName(provider);
      
      output += `  ${icon} ${chalk.white(providerName.padEnd(20))} 重置于: ${isExpired ? chalk.red(timeLeft) : chalk.cyan(timeLeft)}\n`;
    } else {
      const icon = chalk.gray('○');
      const providerName = getProviderDisplayName(provider);
      output += `  ${icon} ${chalk.gray(providerName.padEnd(20))} 未追踪\n`;
    }
  }

  output += '\n';

  output += chalk.bold.yellow('月度资源:\n');
  const monthlyProvider = 'github-copilot-premium';
  const monthly = providers[monthlyProvider];
  
  if (monthly && monthly.limit) {
    const used = monthly.usage || 0;
    const percentage = Math.round((used / monthly.limit) * 100);
    let statusIcon = chalk.green('✓');
    let statusColor = chalk.green;
    
    if (percentage > 80) {
      statusIcon = chalk.red('⚠');
      statusColor = chalk.red;
    } else if (percentage > 60) {
      statusIcon = chalk.yellow('⚠');
      statusColor = chalk.yellow;
    }
    
    output += `  ${statusIcon} ${chalk.white('Github Copilot Premium:'.padEnd(20))} ${statusColor(`${used}/${monthly.limit} (${percentage}%)`)}\n`;
  } else {
    output += `  ${chalk.gray('○')} ${chalk.gray('Github Copilot Premium:'.padEnd(20))} 未追踪\n`;
  }

  output += '\n';

  output += chalk.bold.yellow('余额资源:\n');
  output += `  • DeepSeek: ${chalk.cyan('¥300')}\n`;
  output += `  • 硅基流动: ${chalk.cyan('¥200')}\n`;
  output += `  • Openrouter: ${chalk.cyan('$100')}\n`;

  output += '\n';

  const suggestions = generateSuggestions(providers);
  if (suggestions.length > 0) {
    output += chalk.bold.green('建议: ') + suggestions.join(', ') + '\n';
  }

  console.log(
    boxen(output, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title: 'Oh-My-OpenCode 资源状态',
      titleAlignment: 'center',
    })
  );
}

function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    'anthropic': 'Claude Pro',
    'google-1': 'Gemini Pro #1',
    'google-2': 'Gemini Pro #2',
    'zhipuai': 'ZhiPuAI Max',
    'fangzhou': '方舟 CodingPlan Pro',
  };
  return names[provider] || provider;
}

function generateSuggestions(providers: Record<string, any>): string[] {
  const suggestions: string[] = [];
  const now = new Date();

  for (const [provider, status] of Object.entries(providers)) {
    if (status.nextReset) {
      const reset = new Date(status.nextReset);
      const diff = reset.getTime() - now.getTime();
      const minutesLeft = diff / (1000 * 60);

      if (minutesLeft > 0 && minutesLeft < 30) {
        suggestions.push(`${getProviderDisplayName(provider)} 即将重置，可优先使用`);
      }
    }
  }

  for (const [provider, status] of Object.entries(providers)) {
    if (status.nextReset) {
      const reset = new Date(status.nextReset);
      if (reset.getTime() < now.getTime()) {
        suggestions.push(`${getProviderDisplayName(provider)} 配额已重置，请运行 'omo-quota reset ${provider}'`);
      }
    }
  }

  return suggestions;
}
