/**
 * Init 命令 - 初始化 omo-quota 配置
 *
 * 功能：
 * 1. 创建策略目录
 * 2. 生成预设策略文件
 * 3. 初始化配额追踪文件
 * 4. 验证生成结果
 * 5. 提供初始化后的指导
 */

import chalk from 'chalk';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import boxen from 'boxen';
import { saveTracker, loadTracker } from '../utils/tracker';
import { TRACKER_PATH, CONFIG_PATH, STRATEGIES_DIR, STRATEGIES } from '../types';
import { savePresetStrategies } from '../generators/strategy';
import { createValidator } from '../validators/strategy';
import type { InitConfig } from '../types/strategy';

/**
 * 默认初始化配置
 */
const DEFAULT_INIT_CONFIG: InitConfig = {
  strategiesDir: STRATEGIES_DIR,
  generateDefaultStrategies: true,
  defaultStrategy: 'balanced',
  createBackup: true,
  validate: true,
  customStrategies: [],
};

/**
 * 执行初始化
 */
export function init(options: Partial<InitConfig> = {}): void {
  const config = { ...DEFAULT_INIT_CONFIG, ...options };

  console.log(chalk.bold.cyan('🚀 初始化 omo-quota 配置\n'));

  // 步骤 1: 检查并创建策略目录
  ensureStrategiesDirectory(config.strategiesDir);

  // 步骤 2: 生成预设策略文件
  if (config.generateDefaultStrategies) {
    generateStrategies(config.strategiesDir);
  }

  // 步骤 3: 初始化配额追踪文件
  initializeTracker();

  // 步骤 4: 应用默认策略
  applyDefaultStrategy(config.defaultStrategy, config.createBackup);

  // 步骤 5: 验证配置
  if (config.validate) {
    validateConfiguration();
  }

  // 步骤 6: 显示完成信息
  showCompletionMessage(config);
}

/**
 * 确保策略目录存在
 */
function ensureStrategiesDirectory(strategiesDir: string): void {
  console.log(chalk.yellow('📁 检查策略目录...'));

  if (existsSync(strategiesDir)) {
    console.log(chalk.gray(`   ✓ 目录已存在: ${strategiesDir}`));
  } else {
    try {
      mkdirSync(strategiesDir, { recursive: true });
      console.log(chalk.green(`   ✓ 已创建目录: ${strategiesDir}`));
    } catch (error) {
      console.error(chalk.red(`   ✗ 创建目录失败: ${error}`));
      process.exit(1);
    }
  }
  console.log();
}

/**
 * 生成预设策略文件
 */
function generateStrategies(strategiesDir: string): void {
  console.log(chalk.yellow('📝 生成预设策略文件...'));

  try {
    savePresetStrategies(strategiesDir);

    // 列出生成的文件
    for (const [name, filename] of Object.entries(STRATEGIES)) {
      const filepath = `${strategiesDir}/${filename}`;
      if (existsSync(filepath)) {
        console.log(chalk.green(`   ✓ ${name}: ${filename}`));
      } else {
        console.log(chalk.red(`   ✗ ${name}: ${filename} (生成失败)`));
      }
    }

    console.log(chalk.gray(`   📂 策略目录: ${strategiesDir}`));
  } catch (error) {
    console.error(chalk.red(`   ✗ 生成策略文件失败: ${error}`));
    process.exit(1);
  }
  console.log();
}

/**
 * 初始化配额追踪文件
 */
function initializeTracker(): void {
  console.log(chalk.yellow('📊 初始化配额追踪文件...'));

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

  try {
    saveTracker(defaultTracker);
    console.log(chalk.green(`   ✓ 配额追踪文件已创建: ${TRACKER_PATH}`));
  } catch (error) {
    console.error(chalk.red(`   ✗ 创建配额追踪文件失败: ${error}`));
    process.exit(1);
  }
  console.log();
}

/**
 * 应用默认策略
 */
function applyDefaultStrategy(defaultStrategy: string, createBackup: boolean): void {
  console.log(chalk.yellow('🎯 应用默认策略...'));

  const strategyFile = STRATEGIES[defaultStrategy as keyof typeof STRATEGIES];
  const strategyPath = `${STRATEGIES_DIR}/${strategyFile}`;

  if (!existsSync(strategyPath)) {
    console.error(chalk.red(`   ✗ 策略文件不存在: ${strategyPath}`));
    return;
  }

  // 备份现有配置
  if (createBackup && existsSync(CONFIG_PATH)) {
    const backupPath = `${CONFIG_PATH}.backup`;
    try {
      copyFileSync(CONFIG_PATH, backupPath);
      console.log(chalk.gray(`   ✓ 已备份现有配置: ${backupPath}`));
    } catch (error) {
      console.warn(chalk.yellow(`   ⚠ 备份配置失败: ${error}`));
    }
  }

  // 应用策略
  try {
    copyFileSync(strategyPath, CONFIG_PATH);
    console.log(chalk.green(`   ✓ 已应用策略: ${defaultStrategy}`));
    console.log(chalk.gray(`   📄 配置文件: ${CONFIG_PATH}`));
  } catch (error) {
    console.error(chalk.red(`   ✗ 应用策略失败: ${error}`));
    process.exit(1);
  }
  console.log();
}

/**
 * 验证配置
 */
function validateConfiguration(): void {
  console.log(chalk.yellow('🔍 验证配置...'));

  const validator = createValidator();

  // 验证所有策略文件
  const strategyFiles = Object.values(STRATEGIES).map(f => `${STRATEGIES_DIR}/${f}`);
  const results = validator.validateAll(strategyFiles);

  // 显示验证结果
  let hasErrors = false;

  for (const result of results.errors) {
    hasErrors = true;
    console.error(chalk.red(`   ✗ 错误: ${result.message}`));
  }

  for (const warning of results.warnings) {
    console.warn(chalk.yellow(`   ⚠ 警告: ${warning.message}`));
  }

  if (!hasErrors && results.warnings.length === 0) {
    console.log(chalk.green('   ✓ 所有策略文件验证通过'));
  } else if (!hasErrors) {
    console.log(chalk.yellow('   ⚠ 验证通过，但存在警告'));
  } else {
    console.log(chalk.red('   ✗ 验证失败，请检查错误'));
    process.exit(1);
  }
  console.log();
}

/**
 * 显示完成信息
 */
function showCompletionMessage(config: InitConfig): void {
  const message = boxen(
    [
      chalk.bold.green('✅ omo-quota 初始化完成！'),
      '',
      chalk.bold('📁 创建的文件:'),
      chalk.gray(`  • 策略目录: ${config.strategiesDir}`),
      chalk.gray(`  • 配置文件: ${CONFIG_PATH}`),
      chalk.gray(`  • 追踪文件: ${TRACKER_PATH}`),
      '',
      chalk.bold('📋 生成的策略:'),
      chalk.gray('  • performance (极致性能型)'),
      chalk.gray('  • balanced   (均衡实用型) ← 当前'),
      chalk.gray('  • economical  (经济节约型)'),
      '',
      chalk.bold('🚀 常用命令:'),
      chalk.cyan('  omo-quota list           # 查看所有策略'),
      chalk.cyan('  omo-quota status         # 查看配额状态'),
      chalk.cyan('  omo-quota switch <策略>  # 切换策略'),
      chalk.cyan('  omo-quota validate-models # 验证模型配置'),
      '',
      chalk.yellow('⚠️  请重启 OpenCode 使配置生效'),
    ].join('\n'),
    {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'double',
    }
  );

  console.log(message);
}

/**
 * 计算下次重置时间
 */
function calculateNextReset(interval: string): string {
  const now = new Date();
  const hours = interval === '5h' ? 5 : 24;
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * 检查是否已初始化
 */
export function isInitialized(): boolean {
  return existsSync(TRACKER_PATH) &&
         existsSync(STRATEGIES_DIR) &&
         existsSync(CONFIG_PATH);
}

/**
 * 获取初始化状态
 */
export function getInitStatus(): {
  trackerExists: boolean;
  strategiesDirExists: boolean;
  configExists: boolean;
  isFullyInitialized: boolean;
} {
  return {
    trackerExists: existsSync(TRACKER_PATH),
    strategiesDirExists: existsSync(STRATEGIES_DIR),
    configExists: existsSync(CONFIG_PATH),
    isFullyInitialized: isInitialized(),
  };
}
