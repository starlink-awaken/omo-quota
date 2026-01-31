import chalk from 'chalk';
import { existsSync } from 'fs';
import { saveTracker, calculateNextReset } from '../utils/tracker';
import { TRACKER_PATH } from '../types';
import { generateStrategies } from '../utils/strategy-generator';
import { runWizard } from './wizard';

export interface InitOptions {
  /** 交互式向导模式 */
  wizard?: boolean;
  /** 跳过确认 */
  yes?: boolean;
}

export async function init(options: InitOptions = {}): Promise<void> {
  // 如果启用向导模式，运行向导
  if (options.wizard) {
    await runWizard();
    return;
  }

  // 普通初始化模式
  console.log(chalk.cyan.bold('\n🚀 初始化 omo-quota 配额管理系统\n'));

  // 1. 初始化追踪器
  if (existsSync(TRACKER_PATH)) {
    console.log(chalk.yellow('⚠️  配额追踪文件已存在，将覆盖现有数据'));
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

  console.log(chalk.green('✅ 配额追踪文件已初始化'));
  console.log(chalk.gray(`   位置: ${TRACKER_PATH}`));

  // 2. 生成策略文件
  console.log(chalk.cyan('\n📝 生成策略配置文件...'));

  try {
    const generatedFiles = generateStrategies();

    console.log(chalk.green('✅ 策略文件已生成'));
    generatedFiles.forEach(file => {
      const filename = file.split('/').pop();
      console.log(chalk.gray(`   ✓ ${filename}`));
    });

    console.log(chalk.cyan('\n💡 提示:'));
    console.log(chalk.gray('   • 所有资源的上次重置时间已设置为当前时间'));
    console.log(chalk.gray('   • 如需调整，请使用 omo-quota reset <provider> 命令'));
    console.log(chalk.gray('   • 默认策略: balanced (均衡实用型)'));
    console.log(chalk.gray('   • 切换策略: omo-quota switch <performance|balanced|economical>'));
    console.log(chalk.gray('   • 查看状态: omo-quota status'));

    console.log(chalk.cyan('\n📖 策略说明:'));
    console.log(chalk.gray('   • Performance  - 极致性能，适合关键任务 (成本高)'));
    console.log(chalk.gray('   • Balanced     - 均衡实用，适合日常开发 (推荐) ⭐'));
    console.log(chalk.gray('   • Economical   - 经济节约，适合实验学习 (成本低)'));

  } catch (error) {
    console.log(chalk.red('\n❌ 策略文件生成失败'));
    if (error instanceof Error) {
      console.log(chalk.red(`   错误: ${error.message}`));
    }
    console.log(chalk.cyan('\n💡 您可以稍后手动生成策略文件:'));
    console.log(chalk.gray('   bun run src/generate-strategies.ts'));
  }

  console.log(chalk.green('\n✨ 初始化完成!\n'));
}
