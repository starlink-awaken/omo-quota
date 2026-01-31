/**
 * OmoQuota 统一输出格式化器
 *
 * 为所有命令提供一致的、美观的输出格式：
 * - 统一的布局结构
 * - 一致的配色方案
 * - 清晰的信息层次
 * - 可访问的格式设计
 */

import chalk from 'chalk';
import boxen, { type BorderStyle } from 'boxen';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 输出区域类型
 */
type OutputSection = 'title' | 'status' | 'data' | 'action' | 'help';

/**
 * 输出配置
 */
export interface OutputConfig {
  /** 使用 boxen 包装 */
  useBox: boolean;
  /** 边框样式 */
  borderStyle: BorderStyle;
  /** 边框颜色 */
  borderColor: keyof typeof borderColorMap;
  /** 是否显示图标 */
  showIcons: boolean;
  /** 主题 */
  theme: 'light' | 'dark';
}

/**
 * 状态数据项
 */
export interface StatusItem {
  /** 标签 */
  label: string;
  /** 值 */
  value: string | number;
  /** 状态（影响颜色） */
  status?: 'success' | 'warning' | 'error' | 'info' | 'muted';
  /** 图标 */
  icon?: string;
}

/**
 * 数据表格行
 */
export interface DataRow {
  /** 列值 */
  columns: (string | number)[];
  /** 行状态 */
  status?: 'success' | 'warning' | 'error' | 'info' | 'muted';
}

/**
 * 操作按钮（显示为可执行命令）
 */
export interface Action {
  /** 标签 */
  label: string;
  /** 命令 */
  command: string;
  /** 描述 */
  description?: string;
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 状态颜色映射
 */
const STATUS_COLORS: Record<string, keyof typeof chalk> = {
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'cyan',
  muted: 'gray',
};

/**
 * 边框颜色映射
 */
const borderColorMap = {
  cyan: 'cyan',
  green: 'green',
  yellow: 'yellow',
  red: 'red',
  blue: 'blue',
  magenta: 'magenta',
  white: 'white',
  gray: 'gray',
} as const;

/**
 * 状态图标映射
 */
const STATUS_ICONS: Record<string, string> = {
  success: '✓',
  warning: '⚠',
  error: '✗',
  info: '●',
  muted: '○',
};

// ============================================================================
// 输出格式化器类
// ============================================================================

export class OutputFormatter {
  private config: OutputConfig;

  constructor(config: Partial<OutputConfig> = {}) {
    this.config = {
      useBox: config.useBox ?? true,
      borderStyle: config.borderStyle ?? 'round',
      borderColor: config.borderColor ?? 'cyan',
      showIcons: config.showIcons ?? true,
      theme: config.theme ?? 'dark',
    };
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<OutputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 格式化完整输出
   */
  format(options: {
    title?: string;
    titleIcon?: string;
    status?: StatusItem[];
    data?: DataRow[];
    actions?: Action[];
    help?: string[];
    footer?: string;
  }): string {
    const sections: string[] = [];

    // 标题区域
    if (options.title) {
      sections.push(this.formatTitle(options.title, options.titleIcon));
    }

    // 状态区域
    if (options.status && options.status.length > 0) {
      sections.push(this.formatStatus(options.status));
    }

    // 数据区域
    if (options.data && options.data.length > 0) {
      sections.push(this.formatData(options.data));
    }

    // 操作区域
    if (options.actions && options.actions.length > 0) {
      sections.push(this.formatActions(options.actions));
    }

    // 帮助区域
    if (options.help && options.help.length > 0) {
      sections.push(this.formatHelp(options.help));
    }

    // 页脚
    if (options.footer) {
      sections.push(chalk.gray(options.footer));
    }

    const content = sections.join('\n\n');

    // 使用 boxen 包装
    if (this.config.useBox) {
      return boxen(content, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: this.config.borderStyle,
        borderColor: this.config.borderColor,
        title: options.title ? undefined : '', // 如果有标题区域，不在 box 中显示
        titleAlignment: 'center',
      });
    }

    return content;
  }

  /**
   * 格式化标题区域
   */
  private formatTitle(title: string, icon?: string): string {
    const iconStr = icon || (this.config.showIcons ? '📊' : '');
    return chalk.bold.cyan(`${iconStr} ${title}`);
  }

  /**
   * 格式化状态区域
   */
  private formatStatus(items: StatusItem[]): string {
    const lines: string[] = [chalk.bold.yellow('状态:')];

    for (const item of items) {
      const color = STATUS_COLORS[item.status || 'info'];
      const icon = this.config.showIcons ? (item.icon || STATUS_ICONS[item.status || 'info'] || '•') : '';
      const coloredIcon = chalk[color](icon);
      const label = chalk.white(item.label);
      const value = chalk[color](String(item.value));

      lines.push(`  ${coloredIcon} ${label}: ${value}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化数据区域（表格）
   */
  private formatData(rows: DataRow[]): string {
    if (rows.length === 0) return '';

    // 计算每列的最大宽度
    const numCols = rows[0].columns.length;
    const colWidths: number[] = [];

    for (let i = 0; i < numCols; i++) {
      let maxWidth = 0;
      for (const row of rows) {
        const width = String(row.columns[i]).length;
        if (width > maxWidth) maxWidth = width;
      }
      colWidths.push(maxWidth + 2); // 加上 padding
    }

    const lines: string[] = [];

    // 分隔线
    const separator = chalk.gray('─'.repeat(colWidths.reduce((a, b) => a + b, 0) + numCols - 1));
    lines.push(separator);

    for (const row of rows) {
      const cells = row.columns.map((col, i) => {
        const color = row.status ? STATUS_COLORS[row.status] : 'white';
        const padded = String(col).padEnd(colWidths[i]);
        return chalk[color](padded);
      });
      lines.push(cells.join(chalk.gray('│')));
    }

    lines.push(separator);

    return lines.join('\n');
  }

  /**
   * 格式化操作区域
   */
  private formatActions(actions: Action[]): string {
    const lines: string[] = [chalk.bold.green('操作:')];

    for (const action of actions) {
      const cmd = chalk.green(`$ ${action.command}`);
      lines.push(`  • ${chalk.white(action.label)}`);
      lines.push(`    ${cmd}`);
      if (action.description) {
        lines.push(`    ${chalk.gray(action.description)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 格式化帮助区域
   */
  private formatHelp(items: string[]): string {
    const lines: string[] = [chalk.bold.blue('💡 提示:')];

    for (const item of items) {
      lines.push(`  ${chalk.gray('•')} ${chalk.white(item)}`);
    }

    return lines.join('\n');
  }

  /**
   * 快速格式化简单消息
   */
  message(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    const colors = {
      info: chalk.cyan,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };

    const icon = this.config.showIcons ? icons[type] + ' ' : '';
    return colors[type](icon + text);
  }

  /**
   * 格式化命令标题
   */
  commandTitle(command: string, description: string): string {
    return `${chalk.bold.cyan(command)} ${chalk.gray('- ' + description)}`;
  }

  /**
   * 格式化配额状态
   */
  quotaStatus(
    name: string,
    used: number,
    limit: number,
    unit: string = ''
  ): string {
    const percentage = Math.round((used / limit) * 100);
    const status = percentage >= 90 ? 'error' : percentage >= 70 ? 'warning' : 'success';
    const color = STATUS_COLORS[status];

    const barLength = 20;
    const filled = Math.round((barLength * used) / limit);
    const bar = chalk[color]('█'.repeat(filled)) + chalk.gray('░'.repeat(barLength - filled));

    return `  ${chalk.white(name.padEnd(20))} ${bar} ${chalk[color](percentage + '%')} (${used}/${limit}${unit})`;
  }

  /**
   * 格式化时间
   */
  timeRemaining(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) {
      return chalk.red('已过期');
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return chalk.cyan(`${days}天${hours % 24}小时`);
    }

    return chalk.cyan(`${hours}小时${minutes}分钟`);
  }
}

// ============================================================================
// 单例实例
// ============================================================================

/**
 * 全局输出格式化器实例
 */
export const outputFormatter = new OutputFormatter();

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 快速显示消息
 */
export function showMessage(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  console.log(outputFormatter.message(text, type));
}

/**
 * 快速显示标题
 */
export function showTitle(title: string, icon?: string): void {
  console.log(outputFormatter.formatTitle(title, icon));
}

/**
 * 快速显示状态列表
 */
export function showStatus(items: StatusItem[]): void {
  console.log(outputFormatter.formatStatus(items));
}

/**
 * 快速显示操作列表
 */
export function showActions(actions: Action[]): void {
  console.log(outputFormatter.formatActions(actions));
}

/**
 * 格式化并显示完整输出
 */
export function showOutput(options: Parameters<OutputFormatter['format']>[0]): void {
  console.log(outputFormatter.format(options));
}

// ============================================================================
// 预设模板
// ============================================================================

/**
 * 成功输出模板
 */
export function successTemplate(
  title: string,
  message?: string,
  actions?: Action[]
): void {
  showOutput({
    title,
    titleIcon: '✅',
    status: message ? [{ label: '状态', value: message, status: 'success' }] : undefined,
    actions,
    help: ['运行 "omo-quota status" 查看当前状态'],
  });
}

/**
 * 错误输出模板
 */
export function errorTemplate(
  title: string,
  message: string,
  actions?: Action[]
): void {
  showOutput({
    title,
    titleIcon: '❌',
    status: [{ label: '错误', value: message, status: 'error' }],
    actions,
    help: ['运行 "omo-quota doctor" 检查配置状态'],
  });
}

/**
 * 警告输出模板
 */
export function warningTemplate(
  title: string,
  message: string,
  actions?: Action[]
): void {
  showOutput({
    title,
    titleIcon: '⚠️',
    status: [{ label: '警告', value: message, status: 'warning' }],
    actions,
  });
}

// ============================================================================
// Before/After 对比示例
// ============================================================================

/**
 * Before 示例（旧版输出）:
 *
 * $ omo-quota status
 * 当前策略: balanced (均衡实用型)
 * ──────────────────────────────────────────────────
 * 5小时重置资源:
 *   ✓ Claude Pro             重置于: 2h 30m 后
 *   ✓ Gemini Pro #1          重置于: 1h 15m 后
 *   ⚠ Gemini Pro #2          重置于: 已过期
 *
 * After 示例（新版输出）:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 📊 Oh-My-OpenCode 资源状态                                   │
 * │                                                             │
 * │ 状态:                                                       │
 * │   ✓ 当前策略: balanced (均衡实用型)                          │
 * │   ✓ Claude Pro: 2h 30m 后                                   │
 * │   ✓ Gemini Pro #1: 1h 15m 后                                │
 * │   ⚠ Gemini Pro #2: 已过期                                   │
 * │                                                             │
 * │ 操作:                                                       │
 * │   • 重置过期配额                                             │
 * │     $ omo-quota reset google-2                              │
 * │   • 切换策略                                                │
 * │     $ omo-quota switch performance                          │
 * │                                                             │
 * │ 💡 提示:                                                    │
 * │   • Gemini Pro #2 配额已重置，请运行重置命令                 │
 * └─────────────────────────────────────────────────────────────┘
 */
