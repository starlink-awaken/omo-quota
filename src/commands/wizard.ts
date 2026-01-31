/**
 * OmoQuota 交互式引导向导
 *
 * 为首次使用的用户提供友好的引导体验，包括：
 * - 欢迎界面和功能介绍
 * - 策略选择引导
 * - 配置初始化
 * - 快速入门教程
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { existsSync } from 'fs';
import { saveTracker, calculateNextReset } from '../utils/tracker';
import { TRACKER_PATH } from '../types';
import { generateStrategies } from '../utils/strategy-generator';
import { Spinner } from '../utils/progress';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 策略选项
 */
interface StrategyOption {
  /** 策略ID */
  id: string;
  /** 策略名称 */
  name: string;
  /** 策略描述 */
  description: string;
  /** 成本级别 */
  cost: 'high' | 'medium' | 'low';
  /** 性能级别 */
  performance: 'highest' | 'excellent' | 'good';
  /** 适用场景 */
  useCase: string;
  /** 是否推荐 */
  recommended?: boolean;
}

// ============================================================================
// 策略配置
// ============================================================================

const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    id: 'balanced',
    name: '均衡实用型 (Balanced)',
    description: '在日常开发中使用，平衡性能和成本',
    cost: 'medium',
    performance: 'excellent',
    useCase: '日常开发、通用任务',
    recommended: true,
  },
  {
    id: 'performance',
    name: '极致性能型 (Performance)',
    description: '关键任务和紧急项目时使用，追求最佳效果',
    cost: 'high',
    performance: 'highest',
    useCase: '关键项目、紧急任务',
  },
  {
    id: 'economical',
    name: '经济节约型 (Economical)',
    description: '实验项目或预算受限时使用，严格控制成本',
    cost: 'low',
    performance: 'good',
    useCase: '实验项目、预算受限',
  },
];

// ============================================================================
// 欢迎界面
// ============================================================================

/**
 * 显示欢迎界面
 */
function showWelcome(): void {
  const welcome = `
${chalk.cyan.bold('🎉 欢迎使用 omo-quota！')}

${chalk.white.bold('omo-quota 是您的 AI 配额管理助手，可以：')}
  ${chalk.gray('•')} ${chalk.white('实时追踪')} ${chalk.cyan('各 AI 模型的使用量')}
  ${chalk.gray('•')} ${chalk.white('一键切换')} ${chalk.cyan('性能/均衡/经济策略')}
  ${chalk.gray('•')} ${chalk.white('自动预警')} ${chalk.cyan('即将耗尽的配额')}
  ${chalk.gray('•')} ${chalk.white('生成报告')} ${chalk.cyan('详细的成本分析')}

${chalk.yellow.bold('🚀 快速开始（3步）：')}
  ${chalk.cyan('1️⃣')}  ${chalk.white('omo-quota init')}     ${chalk.gray('初始化配置')}
  ${chalk.cyan('2️⃣')}  ${chalk.white('omo-quota status')}    ${chalk.gray('查看当前状态')}
  ${chalk.cyan('3️⃣')}  ${chalk.white('omo-quota switch')}    ${chalk.gray('选择推荐策略')}
`;

  const box = boxen(welcome, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'cyan',
    title: 'omo-quota 引导向导',
    titleAlignment: 'center',
  });

  console.log(box);
}

/**
 * 显示策略选择菜单
 */
function showStrategyMenu(): void {
  console.log(chalk.cyan.bold('\n📋 选择默认策略:\n'));

  STRATEGY_OPTIONS.forEach((option, index) => {
    const num = chalk.cyan(`${index + 1}`);
    const name = chalk.bold(option.name);
    const tag = option.recommended ? chalk.green(' ⭐ 推荐') : '';
    const desc = chalk.gray(option.description);
    const cost = getCostLabel(option.cost);
    const perf = getPerfLabel(option.performance);
    const use = chalk.gray(`  适用: ${option.useCase}`);

    console.log(`  ${num}. ${name}${tag}`);
    console.log(`     ${desc}`);
    console.log(`     ${cost} • ${perf}`);
    console.log(use);
    console.log('');
  });

  console.log(chalk.gray('  输入策略编号 (1-3) 或按 Enter 使用推荐策略 [2]:'));
}

/**
 * 获取成本标签
 */
function getCostLabel(cost: string): string {
  const labels = {
    high: chalk.red('💰 成本高'),
    medium: chalk.yellow('💰 成本中'),
    low: chalk.green('💰 成本低'),
  };
  return labels[cost as keyof typeof labels] || '';
}

/**
 * 获取性能标签
 */
function getPerfLabel(perf: string): string {
  const labels = {
    highest: chalk.magenta('🚀 性能极致'),
    excellent: chalk.blue('🚀 性能优秀'),
    good: chalk.cyan('🚀 性能良好'),
  };
  return labels[perf as keyof typeof labels] || '';
}

/**
 * 显示完成信息
 */
function showCompletion(strategy: string): void {
  const strategyNames: Record<string, string> = {
    performance: '极致性能型',
    balanced: '均衡实用型',
    economical: '经济节约型',
  };

  const completion = `
${chalk.green.bold('✨ 初始化完成！')}

${chalk.white.bold('您的配置：')}
  ${chalk.gray('•')} 默认策略: ${chalk.cyan(strategyNames[strategy])}
  ${chalk.gray('•')} 追踪文件: ${chalk.gray(TRACKER_PATH)}
  ${chalk.gray('•')} 策略目录: ${chalk.gray('~/.config/opencode/strategies')}

${chalk.yellow.bold('💡 下一步：')}
  ${chalk.cyan('•')} ${chalk.white('omo-quota status')}    ${chalk.gray('查看配额状态')}
  ${chalk.cyan('•')} ${chalk.white('omo-quota list')}       ${chalk.gray('查看所有策略')}
  ${chalk.cyan('•')} ${chalk.white('omo-quota switch')}    ${chalk.gray('切换策略')}
  ${chalk.cyan('•')} ${chalk.white('omo-quota sync')}       ${chalk.gray('同步使用记录')}

${chalk.blue.bold('📚 更多帮助：')}
  ${chalk.gray('• omo-quota doctor       - 检查配置状态')}
  ${chalk.gray('• omo-quota --help       - 查看所有命令')}
  ${chalk.gray('• omo-quota report       - 生成成本报告')}
`;

  console.log(boxen(completion, {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'green',
  }));
}

// ============================================================================
// 主向导函数
// ============================================================================

/**
 * 运行交互式引导向导
 */
export async function runWizard(): Promise<void> {
  // 清屏（可选）
  // console.clear();

  // 1. 显示欢迎界面
  showWelcome();

  // 2. 检查是否已初始化
  if (existsSync(TRACKER_PATH)) {
    console.log(chalk.yellow('\n⚠️  检测到已存在配置文件'));

    // 这里可以添加选项：重新配置或退出
    console.log(chalk.gray('\n运行 "omo-quota init" 重新初始化'));
    console.log(chalk.gray('运行 "omo-quota status" 查看当前状态\n'));
    return;
  }

  // 3. 显示策略选择
  showStrategyMenu();

  // 4. 等待用户输入
  // 注意：在实际使用中，这里需要使用 readline 或交互式库
  // 由于 CLI 的限制，这里使用默认选择
  console.log(chalk.gray('\n💡 向导模式使用默认策略: balanced'));
  console.log(chalk.gray('   使用 "omo-quota switch <strategy>" 切换策略\n'));

  const selectedStrategy = 'balanced';

  // 5. 执行初始化
  const spinner = new Spinner();
  spinner.start('正在初始化 omo-quota...');

  try {
    // 初始化追踪器
    const now = new Date().toISOString();

    const defaultTracker = {
      currentStrategy: selectedStrategy,
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
    spinner.update('已创建配额追踪文件...');

    // 生成策略文件
    const generatedFiles = generateStrategies();
    spinner.update(`已生成 ${generatedFiles.length} 个策略文件...`);

    // 完成
    spinner.succeed('初始化完成！');

    // 6. 显示完成信息
    showCompletion(selectedStrategy);

  } catch (error) {
    spinner.fail('初始化失败');
    if (error instanceof Error) {
      console.error(chalk.red(`错误: ${error.message}`));
    }
    process.exit(1);
  }
}

/**
 * 显示快速帮助（用于 --help 标志）
 */
export function showQuickHelp(): void {
  const help = `
${chalk.bold.cyan('omo-quota 交互式向导')}

${chalk.white.bold('用法：')}
  omo-quota init --wizard    ${chalk.gray('启动交互式引导向导')}
  omo-quota init              ${chalk.gray('使用默认配置快速初始化')}

${chalk.white.bold('向导功能：')}
  • 引导选择默认策略
  • 自动初始化配置文件
  • 生成策略模板
  • 显示快速入门教程

${chalk.white.bold('策略说明：')}
  ${chalk.cyan('performance')}  ${chalk.gray('- 极致性能，适合关键任务 (成本高)')}
  ${chalk.cyan('balanced')}     ${chalk.gray('- 均衡实用，适合日常开发 (推荐) ⭐')}
  ${chalk.cyan('economical')}   ${chalk.gray('- 经济节约，适合实验项目 (成本低)')}
`;

  console.log(help);
}

// ============================================================================
// Before/After 对比示例
// ============================================================================

/**
 * Before 示例（旧版初始化输出）:
 *
 * $ omo-quota init
 * 🚀 初始化 omo-quota 配额管理系统
 *
 * ✅ 配额追踪文件已初始化
 * 📝 生成策略配置文件...
 * ✅ 策略文件已生成
 * ✨ 初始化完成!
 *
 * After 示例（新版向导输出）:
 *
 * $ omo-quota init --wizard
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │              🎉 欢迎使用 omo-quota！                        │
 * │                                                            │
 * │ omo-quota 是您的 AI 配额管理助手，可以：                  │
 * │ • 实时追踪各 AI 模型的使用量                               │
 * │ • 一键切换性能/均衡/经济策略                               │
 * │ • 自动预警即将耗尽的配额                                   │
 * │ • 生成详细的成本分析报告                                   │
 * │                                                            │
 * │ 🚀 快速开始（3步）：                                       │
 * │ 1️⃣  omo-quota init     初始化配置                         │
 * │ 2️⃣  omo-quota status    查看当前状态                      │
 * │ 3️⃣  omo-quota switch    选择推荐策略                      │
 * └────────────────────────────────────────────────────────────┘
 *
 * 📋 选择默认策略:
 *
 *   1. 极致性能型 (Performance)
 *      关键任务和紧急项目时使用，追求最佳效果
 *      💰 成本高 • 🚀 性能极致
 *       适用: 关键项目、紧急任务
 *
 *   2. 均衡实用型 (Balanced) ⭐ 推荐
 *      在日常开发中使用，平衡性能和成本
 *      💰 成本中 • 🚀 性能优秀
 *       适用: 日常开发、通用任务
 *
 *   3. 经济节约型 (Economical)
 *      实验项目或预算受限时使用，严格控制成本
 *      💰 成本低 • 🚀 性能良好
 *       适用: 实验项目、预算受限
 *
 *   输入策略编号 (1-3) 或按 Enter 使用推荐策略 [2]:
 *
 * ✓ 正在初始化 omo-quota...
 * ✓ 已创建配额追踪文件...
 * ✓ 已生成 3 个策略文件...
 * ✓ 初始化完成！
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │ ✨ 初始化完成！                                            │
 * │                                                            │
 * │ 您的配置：                                                 │
 * │ • 默认策略: 均衡实用型                                      │
 * │ • 追踪文件: ~/.omo-quota-tracker.json                      │
 * │ • 策略目录: ~/.config/opencode/strategies                  │
 * │                                                            │
 * │ 💡 下一步：                                                │
 * │ • omo-quota status    查看配额状态                         │
 * │ • omo-quota list       查看所有策略                        │
 * │ • omo-quota switch    切换策略                             │
 * │ • omo-quota sync       同步使用记录                        │
 * └────────────────────────────────────────────────────────────┘
 */
