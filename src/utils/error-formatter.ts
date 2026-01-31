/**
 * OmoQuota 结构化错误格式化器
 *
 * 提供用户友好的、结构化的、可操作的错误消息显示。
 * 设计原则：
 * 1. 错误类型视觉化 - 使用图标和颜色区分错误类别
 * 2. 信息层次化 - 标题、原因、解决方案分层显示
 * 3. 行动导向 - 提供具体可执行的解决方案
 * 4. 学习导向 - 提供文档链接帮助用户理解
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { OmoQuotaError, ErrorCodes } from './errors';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 错误类别配置
 */
interface ErrorCategoryConfig {
  /** 类别名称 */
  name: string;
  /** 图标 */
  icon: string;
  /** 颜色 */
  color: 'red' | 'yellow' | 'blue' | 'magenta' | 'cyan';
  /** 描述 */
  description: string;
}

/**
 * 解决方案步骤
 */
interface SolutionStep {
  /** 步骤标题 */
  title: string;
  /** 命令（如果适用） */
  command?: string;
  /** 说明 */
  explanation?: string;
}

/**
 * 格式化配置
 */
export interface ErrorFormatterConfig {
  /** 是否显示详细堆栈 */
  verbose: boolean;
  /** 是否使用 boxen 包装 */
  useBox: boolean;
  /** 主题（light/dark） */
  theme: 'light' | 'dark';
  /** 语言 */
  locale: 'zh' | 'en';
}

// ============================================================================
// 错误类别配置
// ============================================================================

const ERROR_CATEGORIES: Record<string, ErrorCategoryConfig> = {
  strategy: {
    name: '策略错误',
    icon: '📋',
    color: 'blue',
    description: '配置策略相关的问题',
  },
  tracker: {
    name: '追踪器错误',
    icon: '📊',
    color: 'magenta',
    description: '配额追踪器相关的问题',
  },
  config: {
    name: '配置错误',
    icon: '⚙️',
    color: 'yellow',
    description: '配置文件相关的问题',
  },
  permission: {
    name: '权限错误',
    icon: '🔒',
    color: 'red',
    description: '文件访问权限相关的问题',
  },
  usage: {
    name: '用量错误',
    icon: '📈',
    color: 'cyan',
    description: '资源用量相关的问题',
  },
  system: {
    name: '系统错误',
    icon: '❌',
    color: 'red',
    description: '系统级错误',
  },
};

// ============================================================================
// 解决方案库
// ============================================================================

const SOLUTIONS: Record<ErrorCodes, SolutionStep[]> = {
  // 策略相关错误解决方案
  [ErrorCodes.STRATEGY_NOT_FOUND]: [
    {
      title: '检查策略名称拼写',
      explanation: '可用的策略名称: performance, balanced, economical',
    },
    {
      title: '查看所有可用策略',
      command: 'omo-quota list',
    },
    {
      title: '使用推荐的均衡策略',
      command: 'omo-quota switch balanced',
    },
  ],
  [ErrorCodes.STRATEGY_INVALID]: [
    {
      title: '使用有效的策略名称',
      explanation: '可用的策略: performance, balanced, economical',
    },
    {
      title: '查看策略详情',
      command: 'omo-quota list',
    },
  ],
  [ErrorCodes.STRATEGY_FILE_NOT_FOUND]: [
    {
      title: '运行初始化生成策略模板',
      command: 'omo-quota init',
    },
    {
      title: '验证策略文件状态',
      command: 'omo-quota doctor',
    },
    {
      title: '手动检查策略目录',
      explanation: '确认 ~/.config/opencode/strategies/ 目录存在且包含策略文件',
    },
  ],
  [ErrorCodes.STRATEGY_PARSE_ERROR]: [
    {
      title: '检查策略文件语法',
      explanation: 'JSONC 文件格式可能存在语法错误',
    },
    {
      title: '重新生成策略文件',
      command: 'omo-quota init',
    },
    {
      title: '查看详细错误信息',
      explanation: '使用 --verbose 标志获取更多调试信息',
    },
  ],

  // 追踪器相关错误解决方案
  [ErrorCodes.TRACKER_NOT_FOUND]: [
    {
      title: '初始化配额追踪系统',
      command: 'omo-quota init',
    },
    {
      title: '检查追踪文件路径',
      explanation: '默认路径: ~/.omo-quota-tracker.json',
    },
  ],
  [ErrorCodes.TRACKER_LOAD_ERROR]: [
    {
      title: '检查文件权限',
      explanation: '确保用户有读取 ~/.omo-quota-tracker.json 的权限',
    },
    {
      title: '验证文件格式',
      explanation: '文件可能已损坏，尝试重新初始化',
    },
    {
      title: '重新初始化（谨慎使用）',
      command: 'omo-quota init',
      explanation: '警告: 这将覆盖现有数据',
    },
  ],
  [ErrorCodes.TRACKER_SAVE_ERROR]: [
    {
      title: '检查目录权限',
      explanation: '确保用户有写入主目录的权限',
    },
    {
      title: '检查磁盘空间',
      explanation: '确保磁盘有足够的可用空间',
    },
  ],
  [ErrorCodes.TRACKER_INVALID]: [
    {
      title: '重新初始化追踪器',
      command: 'omo-quota init',
      explanation: '警告: 这将重置所有配额数据',
    },
  ],

  // 配置文件相关错误解决方案
  [ErrorCodes.CONFIG_NOT_FOUND]: [
    {
      title: '运行初始化',
      command: 'omo-quota init',
    },
    {
      title: '检查配置目录',
      explanation: '确认 ~/.config/opencode/ 目录存在',
    },
  ],
  [ErrorCodes.CONFIG_LOAD_ERROR]: [
    {
      title: '检查配置文件语法',
      explanation: 'JSONC 文件格式可能存在语法错误',
    },
    {
      title: '从备份恢复',
      explanation: '尝试从 ~/.config/opencode/oh-my-opencode.backup.jsonc 恢复',
    },
  ],
  [ErrorCodes.CONFIG_SAVE_ERROR]: [
    {
      title: '检查目录写权限',
      explanation: '确保 ~/.config/opencode/ 目录可写',
    },
  ],

  // 路径和权限相关错误解决方案
  [ErrorCodes.PATH_ACCESS_DENIED]: [
    {
      title: '检查文件权限',
      explanation: '使用 ls -la 检查文件权限',
    },
    {
      title: '修改权限（如适用）',
      command: 'chmod 644 <文件路径>',
      explanation: '谨慎使用，确保理解权限修改的影响',
    },
  ],
  [ErrorCodes.PATH_NOT_FOUND]: [
    {
      title: '运行诊断检查',
      command: 'omo-quota doctor',
    },
    {
      title: '创建必要的目录',
      explanation: 'mkdir -p ~/.config/opencode/strategies',
    },
  ],
  [ErrorCodes.DIRECTORY_CREATE_ERROR]: [
    {
      title: '手动创建目录',
      command: 'mkdir -p ~/.config/opencode/strategies',
    },
    {
      title: '检查父目录权限',
      explanation: '确保 ~/.config 目录可写',
    },
  ],

  // 用量和数据相关错误解决方案
  [ErrorCodes.INVALID_USAGE]: [
    {
      title: '使用有效的用量值',
      explanation: '用量值应为正数',
    },
    {
      title: '查看正确格式',
      command: 'omo-quota update <provider> <usage>',
    },
  ],
  [ErrorCodes.INVALID_PROVIDER]: [
    {
      title: '使用有效的提供商名称',
      explanation: '可用的提供商: anthropic, google-1, google-2, zhipuai, fangzhou, github-copilot-premium, deepseek, siliconflow, openrouter',
    },
    {
      title: '查看当前状态',
      command: 'omo-quota status',
    },
  ],
  [ErrorCodes.INVALID_DATA_FORMAT]: [
    {
      title: '检查数据格式',
      explanation: '确保输入数据格式正确',
    },
    {
      title: '使用 --verbose 查看详情',
      explanation: '获取更多关于数据格式错误的信息',
    },
  ],

  // 系统和环境错误解决方案
  [ErrorCodes.ENVIRONMENT_ERROR]: [
    {
      title: '检查环境变量',
      command: 'echo $HOME',
    },
    {
      title: '检查 Node/Bun 版本',
      command: 'bun --version',
    },
  ],
  [ErrorCodes.NETWORK_ERROR]: [
    {
      title: '检查网络连接',
      command: 'ping -c 3 api.example.com',
    },
    {
      title: '检查代理设置',
      explanation: '如果使用代理，确保配置正确',
    },
  ],
  [ErrorCodes.UNKNOWN_ERROR]: [
    {
      title: '运行诊断',
      command: 'omo-quota doctor --verbose',
    },
    {
      title: '查看日志',
      explanation: '检查 ~/.omo-quota/logs/ 目录下的日志文件',
    },
    {
      title: '报告问题',
      explanation: '如问题持续存在，请在 GitHub 上报告',
    },
  ],
};

// ============================================================================
// 文档链接库
// ============================================================================

const DOCS_LINKS: Record<ErrorCodes, string> = {
  [ErrorCodes.STRATEGY_NOT_FOUND]: 'https://github.com/xiamingxing/omo-quota#策略说明',
  [ErrorCodes.STRATEGY_INVALID]: 'https://github.com/xiamingxing/omo-quota#策略说明',
  [ErrorCodes.STRATEGY_FILE_NOT_FOUND]: 'https://github.com/xiamingxing/omo-quota#快速开始',
  [ErrorCodes.STRATEGY_PARSE_ERROR]: 'https://github.com/xiamingxing/omo-quota#配置格式',
  [ErrorCodes.TRACKER_NOT_FOUND]: 'https://github.com/xiamingxing/omo-quota#初始化',
  [ErrorCodes.TRACKER_LOAD_ERROR]: 'https://github.com/xiamingxing/omo-quota#故障排查',
  [ErrorCodes.TRACKER_SAVE_ERROR]: 'https://github.com/xiamingxing/omo-quota#故障排查',
  [ErrorCodes.TRACKER_INVALID]: 'https://github.com/xiamingxing/omo-quota#初始化',
  [ErrorCodes.CONFIG_NOT_FOUND]: 'https://github.com/xiamingxing/omo-quota#配置',
  [ErrorCodes.CONFIG_LOAD_ERROR]: 'https://github.com/xiamingxing/omo-quota#故障排查',
  [ErrorCodes.CONFIG_SAVE_ERROR]: 'https://github.com/xiamingxing/omo-quota#故障排查',
  [ErrorCodes.CONFIG_BACKUP_ERROR]: 'https://github.com/xiamingxing/omo-quota#备份',
  [ErrorCodes.CONFIG_RESTORE_ERROR]: 'https://github.com/xiamingxing/omo-quota#恢复',
  [ErrorCodes.PATH_ACCESS_DENIED]: 'https://github.com/xiamingxing/omo-quota#权限设置',
  [ErrorCodes.PATH_NOT_FOUND]: 'https://github.com/xiamingxing/omo-quota#目录结构',
  [ErrorCodes.DIRECTORY_CREATE_ERROR]: 'https://github.com/xiamingxing/omo-quota#安装',
  [ErrorCodes.INVALID_USAGE]: 'https://github.com/xiamingxing/omo-quota#命令参考',
  [ErrorCodes.INVALID_PROVIDER]: 'https://github.com/xiamingxing/omo-quota#提供商列表',
  [ErrorCodes.INVALID_DATA_FORMAT]: 'https://github.com/xiamingxing/omo-quota#数据格式',
  [ErrorCodes.ENVIRONMENT_ERROR]: 'https://github.com/xiamingxing/omo-quota#环境要求',
  [ErrorCodes.NETWORK_ERROR]: 'https://github.com/xiamingxing/omo-quota#网络配置',
  [ErrorCodes.UNKNOWN_ERROR]: 'https://github.com/xiamingxing/omo-quota#故障排查',
};

// ============================================================================
// 主格式化器类
// ============================================================================

export class ErrorFormatter {
  private config: ErrorFormatterConfig;

  constructor(config: Partial<ErrorFormatterConfig> = {}) {
    this.config = {
      verbose: config.verbose ?? false,
      useBox: config.useBox ?? true,
      theme: config.theme ?? 'dark',
      locale: config.locale ?? 'zh',
    };
  }

  /**
   * 格式化并显示错误
   */
  format(error: OmoQuotaError | Error): string {
    // 如果是 OmoQuotaError，使用结构化格式
    if (error instanceof OmoQuotaError) {
      return this.formatOmoQuotaError(error);
    }
    // 普通错误使用简单格式
    return this.formatGenericError(error);
  }

  /**
   * 格式化 OmoQuotaError
   */
  private formatOmoQuotaError(error: OmoQuotaError): string {
    const category = ERROR_CATEGORIES[error.category] || ERROR_CATEGORIES.system;
    const solutions = SOLUTIONS[error.code] || [];
    const learnMore = DOCS_LINKS[error.code];

    const lines: string[] = [];

    // 1. 错误标题（带图标和颜色）
    const colorFn = this.getColorFn(category.color);
    lines.push(colorFn.bold(`${category.icon} ${category.name}: ${error.message}`));

    // 2. 错误类别描述
    lines.push(chalk.gray(`┌─ ${category.description}`));
    lines.push(chalk.gray('│'));

    // 3. 错误详情（如果有）
    if (Object.keys(error.details).length > 0) {
      lines.push(chalk.gray('│') + ' ' + chalk.yellow.bold('详细信息:'));
      for (const [key, value] of Object.entries(error.details)) {
        lines.push(chalk.gray('│') + `   ${chalk.cyan(key)}: ${chalk.white(String(value))}`);
      }
      lines.push(chalk.gray('│'));
    }

    // 4. 原因（如果有）
    if (error.cause) {
      lines.push(chalk.gray('│') + ' ' + chalk.yellow.bold('原因:'));
      lines.push(chalk.gray('│') + `   ${chalk.red(error.cause.message)}`);
      lines.push(chalk.gray('│'));
    }

    // 5. 解决方案（如果有）
    if (solutions.length > 0) {
      lines.push(chalk.gray('│') + ' ' + chalk.green.bold('💡 解决方案:'));
      solutions.forEach((solution, index) => {
        lines.push(chalk.gray('│') + `   ${chalk.cyan(index + 1)}. ${chalk.white(solution.title)}`);
        if (solution.command) {
          lines.push(chalk.gray('│') + `      ${chalk.green('$ ' + solution.command)}`);
        }
        if (solution.explanation) {
          lines.push(chalk.gray('│') + `      ${chalk.gray(solution.explanation)}`);
        }
      });
      lines.push(chalk.gray('│'));
    }

    // 6. 学习更多（如果有）
    if (learnMore) {
      lines.push(chalk.gray('│') + ' ' + chalk.blue.bold('📚 学习更多:'));
      lines.push(chalk.gray('│') + `   ${chalk.underline(learnMore)}`);
      lines.push(chalk.gray('│'));
    }

    // 7. 错误码（调试用）
    if (this.config.verbose) {
      lines.push(chalk.gray('│') + ' ' + chalk.gray(`错误码: ${error.code} (退出码: ${error.exitCode})`));
    }

    lines.push(chalk.gray('└' + '─'.repeat(50)));

    const output = lines.join('\n');

    // 如果启用 boxen，包装输出
    if (this.config.useBox) {
      return boxen(output, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: 'single',
        borderColor: category.color,
        titleAlignment: 'left',
      });
    }

    return '\n' + output + '\n';
  }

  /**
   * 格式化普通错误
   */
  private formatGenericError(error: Error): string {
    const lines: string[] = [];

    lines.push(chalk.red.bold('❌ 未知错误:'));
    lines.push(chalk.white(error.message));

    if (this.config.verbose && error.stack) {
      lines.push('');
      lines.push(chalk.gray('堆栈跟踪:'));
      lines.push(chalk.gray(error.stack));
    }

    lines.push('');
    lines.push(chalk.gray('💡 运行 "omo-quota doctor" 检查配置状态'));

    return '\n' + lines.join('\n') + '\n';
  }

  /**
   * 获取颜色函数
   */
  private getColorFn(color: string): any {
    const colorMap: Record<string, any> = {
      red: chalk.red,
      yellow: chalk.yellow,
      green: chalk.green,
      blue: chalk.blue,
      magenta: chalk.magenta,
      cyan: chalk.cyan,
      white: chalk.white,
      gray: chalk.gray,
    };
    return colorMap[color] || chalk.white;
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<ErrorFormatterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ErrorFormatterConfig {
    return { ...this.config };
  }
}

// ============================================================================
// 单例实例
// ============================================================================

/**
 * 全局错误格式化器实例
 */
export const errorFormatter = new ErrorFormatter();

/**
 * 格式化并显示错误（便捷函数）
 */
export function formatError(error: OmoQuotaError | Error, config?: Partial<ErrorFormatterConfig>): string {
  const formatter = config ? new ErrorFormatter(config) : errorFormatter;
  return formatter.format(error);
}

/**
 * 显示错误到控制台（便捷函数）
 */
export function displayError(error: OmoQuotaError | Error, config?: Partial<ErrorFormatterConfig>): void {
  console.error(formatError(error, config));
}

// ============================================================================
// Before/After 对比示例（文档用）
// ============================================================================

/**
 * Before 示例（旧版错误输出）:
 *
 * ✗ 策略文件不存在: /Users/xxx/.config/opencode/strategies/strategy-2-balanced.jsonc
 *
 * After 示例（新版错误输出）:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ⚙️ 配置错误: 策略文件不存在: /Users/xxx/.config/opencode/   │
 * │              strategies/strategy-2-balanced.jsonc            │
 * │ ┌─ 配置文件相关的问题                                         │
 * │ │                                                            │
 * │ │ 💡 解决方案:                                               │
 * │ │    1. 运行初始化生成策略模板                               │
 * │ │       $ omo-quota init                                    │
 * │ │    2. 验证策略文件状态                                     │
 * │ │       $ omo-quota doctor                                  │
 * │ │    3. 手动检查策略目录                                     │
 * │ │       确认 ~/.config/opencode/strategies/ 目录存在且      │
 * │ │       包含策略文件                                          │
 * │ │                                                            │
 * │ │ 📚 学习更多:                                               │
 * │ │    https://github.com/xiamingxing/omo-quota#快速开始      │
 * │ └──────────────────────────────────────────────────────────┘
 * └─────────────────────────────────────────────────────────────┘
 */
