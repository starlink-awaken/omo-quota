import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';
import { STRATEGIES, CONFIG_PATH, STRATEGIES_DIR } from '../types';

export function doctor() {
  console.log(chalk.bold.cyan('正在检查配置...\n'));

  let allOk = true;

  console.log(chalk.yellow('1. 检查策略文件:'));
  for (const [name, file] of Object.entries(STRATEGIES)) {
    const strategyPath = `${STRATEGIES_DIR}/${file}`;
    if (existsSync(strategyPath)) {
      console.log(chalk.green(`  ✓ ${name}: ${strategyPath}`));
      
      try {
        const strategyContent = readFileSync(strategyPath, 'utf-8');
        parseJSONC(strategyContent);
      } catch (error) {
        console.log(chalk.red(`    ✗ 语法错误: ${error instanceof Error ? error.message : String(error)}`));
        allOk = false;
      }
    } else {
      console.log(chalk.red(`  ✗ ${name}: ${strategyPath} 不存在`));
      allOk = false;
    }
  }

  console.log(chalk.yellow('\n2. 检查当前配置:'));
  if (existsSync(CONFIG_PATH)) {
    console.log(chalk.green(`  ✓ 配置文件存在: ${CONFIG_PATH}`));
    
    try {
      const content = readFileSync(CONFIG_PATH, 'utf-8');
      parseJSONC(content);
      console.log(chalk.green('  ✓ 配置文件语法正确'));
    } catch (error) {
      console.log(chalk.red(`  ✗ 配置文件语法错误: ${error instanceof Error ? error.message : String(error)}`));
      allOk = false;
    }
  } else {
    console.log(chalk.red(`  ✗ 配置文件不存在: ${CONFIG_PATH}`));
    allOk = false;
  }

  console.log(chalk.yellow('\n3. 检查策略目录:'));
  if (existsSync(STRATEGIES_DIR)) {
    console.log(chalk.green(`  ✓ 策略目录存在: ${STRATEGIES_DIR}`));
  } else {
    console.log(chalk.red(`  ✗ 策略目录不存在: ${STRATEGIES_DIR}`));
    allOk = false;
  }

  console.log();
  if (allOk) {
    console.log(chalk.bold.green('✓ 所有检查通过！'));
  } else {
    console.log(chalk.bold.red('✗ 发现问题，请检查上述错误。'));
    process.exit(1);
  }
}
