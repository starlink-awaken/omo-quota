import chalk from 'chalk';
import { existsSync, copyFileSync } from 'fs';
import { loadTracker, saveTracker } from '../utils/tracker';
import { STRATEGIES, CONFIG_PATH, STRATEGIES_DIR, BACKUP_PATH, type StrategyName } from '../types';

export function switchStrategy(strategy: string) {
  if (!isValidStrategy(strategy)) {
    console.error(chalk.red.bold(`✗ 无效的策略名称: ${strategy}\n`));
    console.log(chalk.yellow.bold('💡 可用策略：\n'));
    console.log(chalk.cyan('  • ') + chalk.bold('performance') + chalk.gray(' - 极致性能型 (关键任务、紧急项目)'));
    console.log(chalk.cyan('  • ') + chalk.bold('balanced') + chalk.gray(' - 均衡实用型 (日常开发、推荐) ⭐'));
    console.log(chalk.cyan('  • ') + chalk.bold('economical') + chalk.gray(' - 极致省钱型 (实验项目、预算受限)\n'));
    console.log(chalk.gray('使用 "omo-quota list" 查看所有策略详情'));
    console.log(chalk.gray('切换命令: omo-quota switch <策略名称>\n'));
    process.exit(1);
  }

  const strategyFile = STRATEGIES[strategy as StrategyName];
  const strategyPath = `${STRATEGIES_DIR}/${strategyFile}`;

  if (!existsSync(strategyPath)) {
    console.error(chalk.red.bold(`✗ 策略文件不存在: ${strategyPath}\n`));
    console.log(chalk.yellow.bold('💡 可能的解决方案：\n'));

    console.log(chalk.cyan('  1. 运行初始化生成策略模板：'));
    console.log(chalk.bold.white('     omo-quota init\n'));

    console.log(chalk.cyan('  2. 验证策略文件状态：'));
    console.log(chalk.bold.white('     omo-quota doctor\n'));

    console.log(chalk.cyan('  3. 查看所有可用策略：'));
    console.log(chalk.bold.white('     omo-quota list\n'));

    console.log(chalk.gray('📚 详细文档: https://github.com/xiamingxing/omo-quota#策略说明\n'));
    console.log(chalk.gray('💡 提示: 策略文件应位于 ~/.config/opencode/strategies/ 目录'));
    process.exit(1);
  }

  console.log(chalk.cyan('正在切换策略...'));

  if (existsSync(CONFIG_PATH)) {
    try {
      copyFileSync(CONFIG_PATH, BACKUP_PATH);
      console.log(chalk.green(`✓ 已备份当前配置到: ${BACKUP_PATH}`));
    } catch (error) {
      console.error(chalk.red('✗ 备份配置失败:'), error);
      process.exit(1);
    }
  }

  try {
    copyFileSync(strategyPath, CONFIG_PATH);
    console.log(chalk.green(`✓ 已应用策略: ${strategy}`));
  } catch (error) {
    console.error(chalk.red('✗ 应用策略失败:'), error);
    if (existsSync(BACKUP_PATH)) {
      copyFileSync(BACKUP_PATH, CONFIG_PATH);
      console.log(chalk.yellow('已恢复之前的配置'));
    }
    process.exit(1);
  }

  const tracker = loadTracker();
  tracker.currentStrategy = strategy;
  saveTracker(tracker);

  const strategyNames: Record<string, string> = {
    performance: '极致性能型',
    balanced: '均衡实用型',
    economical: '极致省钱型',
  };

  console.log(chalk.bold.green(`\n✓ 成功切换到 ${strategy} (${strategyNames[strategy]})`));
  console.log(chalk.gray('请重启 OpenCode 使配置生效。'));
}

function isValidStrategy(strategy: string): strategy is StrategyName {
  return strategy in STRATEGIES;
}
