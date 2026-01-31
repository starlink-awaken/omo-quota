import chalk from 'chalk';
import { syncQuota } from './sync';
import { loadTracker } from '../utils/tracker';

interface WatchOptions {
  interval?: number;
  threshold?: number;
  autoSwitch?: boolean;
}

export async function watch(options: WatchOptions = {}) {
  const interval = options.interval || 300000; // 默认 5 分钟
  const threshold = options.threshold || 20; // 配额低于 20% 时预警
  const autoSwitch = options.autoSwitch || false;

  console.log(chalk.blue('🔍 启动配额监控...'));
  console.log(chalk.gray(`   检查间隔: ${interval / 1000} 秒`));
  console.log(chalk.gray(`   预警阈值: ${threshold}%`));
  console.log(chalk.gray(`   自动切换: ${autoSwitch ? '启用' : '禁用'}`));
  console.log(chalk.gray(`   按 Ctrl+C 停止监控\n`));

  let lastAlerts = new Set<string>();

  const check = async () => {
    try {
      await syncQuota();
      
      const tracker = loadTracker();
      const currentAlerts = new Set<string>();

      console.log(chalk.gray(`[${new Date().toLocaleTimeString()}] 检查配额状态...`));

      for (const [provider, data] of Object.entries(tracker.providers)) {
        if (typeof data === 'object' && data !== null && 'limit' in data && 'used' in data) {
          const { limit, used } = data as { limit: number; used: number };
          const percentage = (used / limit) * 100;
          
          if (percentage >= (100 - threshold)) {
            const alertKey = `${provider}-${Math.floor(percentage / 10)}`;
            
            if (!lastAlerts.has(alertKey)) {
              console.log(chalk.yellow(`\n⚠️  配额预警: ${provider}`));
              console.log(chalk.yellow(`   已使用: ${percentage.toFixed(1)}%`));
              
              if (percentage >= 90) {
                console.log(chalk.red(`   🔴 严重不足! 建议立即切换到 economical 模式`));
                
                if (autoSwitch && tracker.currentStrategy !== 'economical') {
                  console.log(chalk.red(`   🔄 自动切换到 economical 模式...`));
                  const { switchStrategy } = await import('./switch');
                  void switchStrategy('economical');
                }
              } else if (percentage >= 80) {
                console.log(chalk.yellow(`   🟠 配额紧张! 建议切换到 economical 模式`));
              } else if (percentage >= (100 - threshold)) {
                console.log(chalk.yellow(`   🟡 配额偏低,请注意使用`));
              }
              
              currentAlerts.add(alertKey);
            }
          }
        }
      }

      if (currentAlerts.size === 0 && lastAlerts.size > 0) {
        console.log(chalk.green(`✅ 所有配额正常\n`));
      }

      lastAlerts = currentAlerts;

    } catch (error: any) {
      console.error(chalk.red(`❌ 检查失败: ${error.message}`));
    }
  };

  await check();

  const intervalId = setInterval(check, interval);

  process.on('SIGINT', () => {
    console.log(chalk.blue('\n\n🛑 停止监控'));
    clearInterval(intervalId);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clearInterval(intervalId);
    process.exit(0);
  });
}
