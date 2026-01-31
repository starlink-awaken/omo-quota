/**
 * 撤销命令
 *
 * 允许用户撤销上一次策略切换操作
 */

import chalk from 'chalk';
import { performUndo, performRedo, showHistory, undoStack } from '../utils/undo-stack';

export interface UndoOptions {
  /** 重做已撤销的操作 */
  redo?: boolean;
}

export async function undo(options: UndoOptions = {}): Promise<void> {
  console.log('');

  if (options.redo) {
    // 重做操作
    const success = await performRedo();
    if (success) {
      console.log(chalk.green('✓ 重做成功'));
    }
  } else {
    // 撤销操作
    await performUndo();
  }

  console.log('');
}

/**
 * 显示历史记录命令
 */
export function history(): void {
  showHistory();
}

/**
 * 显示撤销帮助
 */
export function showUndoHelp(): void {
  const help = `
${chalk.bold.cyan('omo-quota 撤销/重做系统')}

${chalk.white.bold('命令：')}
  omo-quota undo          ${chalk.gray('撤销上一次策略切换')}
  omo-quota undo --redo   ${chalk.gray('重做已撤销的操作')}
  omo-quota history       ${chalk.gray('查看操作历史')}

${chalk.white.bold('说明：')}
  • 撤销功能支持策略切换操作的回退
  • 最多记录 10 个操作历史
  • 撤销后可以重做（直到执行新操作）
  • 配置备份保存在 ~/.omo-quota-backups/

${chalk.white.bold('示例：')}
  $ omo-quota switch performance
  ✓ 成功切换到 performance (极致性能型)

  $ omo-quota switch economical
  ✓ 成功切换到 economical (经济节约型)

  $ omo-quota undo
  撤销操作:
    操作: 切换策略: performance → economical
    时间: 2024-01-31 14:30:00
  ✓ 撤销成功
  当前策略: performance
`;

  console.log(help);
}

// Before/After 对比示例

/**
 * Before 示例（无撤销功能）:
 *
 * $ omo-quota switch performance
 * ✓ 成功切换到 performance
 *
 * $ omo-quota switch economical
 * ✓ 成功切换到 economical
 *
 * # 用户改变主意... 需要手动切回去
 * $ omo-quota switch performance
 * ✓ 成功切换到 performance
 *
 * After 示例（有撤销功能）:
 *
 * $ omo-quota switch performance
 * ✓ 成功切换到 performance (极致性能型)
 *
 * $ omo-quota switch economical
 * ✓ 成功切换到 economical (经济节约型)
 *
 * # 用户改变主意，使用撤销
 * $ omo-quota undo
 *
 * 撤销操作:
 *   操作: 切换策略: performance → economical
 *   时间: 14:30:00
 *
 * ✓ 撤销成功
 * 当前策略: performance
 * 请重启 OpenCode 使配置生效
 *
 * # 查看操作历史
 * $ omo-quota history
 *
 * 操作历史:
 *
 * 可撤销的操作:
 *   ✓ 14:30:00 切换策略: performance → economical
 *
 * 可重做的操作:
 *   ↶ 14:25:00 切换策略: balanced → performance
 */
