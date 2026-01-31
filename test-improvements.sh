#!/usr/bin/env bun
/**
 * 改进演示脚本
 * 展示 switch 和 list 命令的错误提示优化
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🎯 omo-quota 错误提示改进演示\n'));

console.log(chalk.gray('═'.repeat(60)));

// 测试1: 无效的策略名称
console.log(chalk.yellow.bold('\n📝 测试 1: 无效的策略名称\n'));
console.log(chalk.gray('命令: omo-quota switch invalid-strategy\n'));
try {
  execSync('bun run src/index.ts switch invalid-strategy', { stdio: 'inherit' });
} catch {
  // Expected error
}

console.log(chalk.gray('\n' + '═'.repeat(60)));

// 测试2: 策略文件不存在
console.log(chalk.yellow.bold('\n📝 测试 2: 策略文件不存在\n'));
console.log(chalk.gray('命令: omo-quota switch performance (文件被临时移动)\n'));

// 临时移动文件
const fs = require('fs');
const path = require('path');
const { STRATEGIES_DIR } = require('./src/types');

const strategyPath = `${process.env.HOME}/.config/opencode/strategies/strategy-1-performance.jsonc`;
const backupPath = `${strategyPath}.tmp`;

try {
  if (fs.existsSync(strategyPath)) {
    fs.renameSync(strategyPath, backupPath);

    try {
      execSync('bun run src/index.ts switch performance', { stdio: 'inherit' });
    } catch {
      // Expected error
    } finally {
      // 恢复文件
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, strategyPath);
      }
    }
  }
} catch (error) {
  console.error(chalk.red('测试执行失败:'), error);
}

console.log(chalk.gray('\n' + '═'.repeat(60)));

// 测试3: 所有策略文件都不存在
console.log(chalk.yellow.bold('\n📝 测试 3: 所有策略文件都不存在\n'));
console.log(chalk.gray('命令: omo-quota list (所有策略文件被临时移动)\n'));

try {
  const strategiesDir = `${process.env.HOME}/.config/opencode/strategies`;
  const tempDir = '/tmp/omo-quota-test-backup';

  // 创建临时备份目录
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 移动所有策略文件
  const files = fs.readdirSync(strategiesDir).filter(f => f.endsWith('.jsonc'));
  files.forEach(file => {
    fs.renameSync(
      path.join(strategiesDir, file),
      path.join(tempDir, file)
    );
  });

  try {
    execSync('bun run src/index.ts list', { stdio: 'inherit' });
  } catch {
    // Expected error
  } finally {
    // 恢复所有文件
    const backupFiles = fs.readdirSync(tempDir);
    backupFiles.forEach(file => {
      fs.renameSync(
        path.join(tempDir, file),
        path.join(strategiesDir, file)
      );
    });

    // 清理临时目录
    fs.rmdirSync(tempDir);
  }
} catch (error) {
  console.error(chalk.red('测试执行失败:'), error);
}

console.log(chalk.gray('\n' + '═'.repeat(60)));

// 测试4: 部分策略文件缺失
console.log(chalk.yellow.bold('\n📝 测试 4: 部分策略文件缺失\n'));
console.log(chalk.gray('命令: omo-quota list (一个策略文件被临时移动)\n'));

try {
  const strategyPath = `${process.env.HOME}/.config/opencode/strategies/strategy-3-economical.jsonc`;
  const backupPath = `${strategyPath}.tmp`;

  if (fs.existsSync(strategyPath)) {
    fs.renameSync(strategyPath, backupPath);

    try {
      execSync('bun run src/index.ts list', { stdio: 'inherit' });
    } catch {
      // Expected error
    } finally {
      // 恢复文件
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, strategyPath);
      }
    }
  }
} catch (error) {
  console.error(chalk.red('测试执行失败:'), error);
}

console.log(chalk.gray('\n' + '═'.repeat(60)));

console.log(chalk.bold.green('\n✅ 改进演示完成！\n'));
console.log(chalk.gray('主要改进:'));
console.log(chalk.gray('  • 清晰说明问题是什么'));
console.log(chalk.gray('  • 解释为什么会出现这个问题'));
console.log(chalk.gray('  • 提供具体的解决步骤'));
console.log(chalk.gray('  • 使用友好的语言和emoji'));
console.log(chalk.gray('  • 使用颜色区分不同级别的信息'));
console.log(chalk.gray('  • 提供文档链接和帮助命令\n'));
