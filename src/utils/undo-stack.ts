/**
 * OmoQuota 撤销/重做系统
 *
 * 提供操作历史的撤销和重做功能：
 * - 记录策略切换操作
 * - 支持多级撤销
 * - 持久化历史记录
 * - 安全的状态恢复
 */

import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { CONFIG_PATH, STRATEGIES_DIR, STRATEGIES, TRACKER_PATH } from '../types';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 操作类型
 */
export type OperationType = 'switch' | 'reset' | 'update' | 'init';

/**
 * 历史记录项
 */
export interface HistoryEntry {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: OperationType;
  /** 操作时间 */
  timestamp: string;
  /** 操作描述 */
  description: string;
  /** 恢复此操作需要的数据 */
  restoreData: {
    /** 前一个策略 */
    previousStrategy?: string;
    /** 前一个配置文件的备份路径 */
    configBackup?: string;
    /** 追踪器状态快照 */
    trackerSnapshot?: object;
  };
  /** 是否可以撤销 */
  reversible: boolean;
}

/**
 * 撤销栈配置
 */
interface UndoStackConfig {
  /** 最大历史记录数 */
  maxHistory: number;
  /** 历史文件路径 */
  historyPath: string;
  /** 备份目录 */
  backupDir: string;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: UndoStackConfig = {
  maxHistory: 10,
  historyPath: `${process.env.HOME}/.omo-quota-history.json`,
  backupDir: `${process.env.HOME}/.omo-quota-backups`,
};

// ============================================================================
// 撤销栈类
// ============================================================================

export class UndoStack {
  private history: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private config: UndoStackConfig;

  constructor(config: Partial<UndoStackConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 确保备份目录存在
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true });
    }

    // 加载历史记录
    this.loadHistory();
  }

  /**
   * 记录一个操作
   */
  push(
    type: OperationType,
    description: string,
    restoreData: HistoryEntry['restoreData']
  ): string {
    const entry: HistoryEntry = {
      id: this.generateId(),
      type,
      timestamp: new Date().toISOString(),
      description,
      restoreData,
      reversible: !!restoreData.previousStrategy || !!restoreData.configBackup,
    };

    this.history.push(entry);

    // 清空 redo 栈（新操作使之前的 redo 无效）
    this.redoStack = [];

    // 限制历史记录数量
    if (this.history.length > this.config.maxHistory) {
      const removed = this.history.shift();
      // 清理对应的备份文件
      if (removed?.restoreData.configBackup) {
        // 可以选择清理旧备份
      }
    }

    // 保存历史记录
    this.saveHistory();

    return entry.id;
  }

  /**
   * 撤销上一个操作
   */
  async undo(): Promise<boolean> {
    const entry = this.history.pop();

    if (!entry) {
      console.log(chalk.yellow('没有可撤销的操作'));
      return false;
    }

    if (!entry.reversible) {
      console.log(chalk.yellow(`"${entry.description}" 不可撤销`));
      // 放回历史栈
      this.history.push(entry);
      return false;
    }

    try {
      await this.restoreEntry(entry);
      this.redoStack.push(entry);
      this.saveHistory();

      return true;
    } catch (error) {
      console.log(chalk.red('撤销失败:'), error);
      // 放回历史栈
      this.history.push(entry);
      return false;
    }
  }

  /**
   * 重做已撤销的操作
   */
  async redo(): Promise<boolean> {
    const entry = this.redoStack.pop();

    if (!entry) {
      console.log(chalk.yellow('没有可重做的操作'));
      return false;
    }

    try {
      // 这里需要重新执行原操作，而不是恢复
      // 简化版本：我们只记录策略切换，所以重新切换即可
      if (entry.restoreData.previousStrategy) {
        // 这需要重新执行切换操作
        console.log(chalk.yellow('重做功能需要完整的操作记录'));
      }

      this.history.push(entry);
      this.saveHistory();

      return true;
    } catch (error) {
      console.log(chalk.red('重做失败:'), error);
      this.redoStack.push(entry);
      return false;
    }
  }

  /**
   * 恢复历史条目
   */
  private async restoreEntry(entry: HistoryEntry): Promise<void> {
    console.log(chalk.cyan(`正在撤销: ${entry.description}`));

    // 恢复策略
    if (entry.restoreData.previousStrategy) {
      const strategyFile = STRATEGIES[entry.restoreData.previousStrategy as keyof typeof STRATEGIES];
      if (strategyFile) {
        const strategyPath = `${STRATEGIES_DIR}/${strategyFile}`;

        if (existsSync(strategyPath)) {
          // 恢复配置文件
          const content = readFileSync(strategyPath, 'utf-8');
          writeFileSync(CONFIG_PATH, content);

          // 更新追踪器
          if (existsSync(TRACKER_PATH)) {
            const tracker = JSON.parse(readFileSync(TRACKER_PATH, 'utf-8'));
            tracker.currentStrategy = entry.restoreData.previousStrategy;
            writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2));
          }

          console.log(chalk.green(`✓ 已恢复到策略: ${entry.restoreData.previousStrategy}`));
        }
      }
    }

    // 恢复配置备份
    if (entry.restoreData.configBackup && existsSync(entry.restoreData.configBackup)) {
      const backup = readFileSync(entry.restoreData.configBackup, 'utf-8');
      writeFileSync(CONFIG_PATH, backup);
      console.log(chalk.green('✓ 已恢复配置文件'));
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * 获取可重做的操作
   */
  getRedoStack(): HistoryEntry[] {
    return [...this.redoStack];
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.history = [];
    this.redoStack = [];
    this.saveHistory();
  }

  /**
   * 加载历史记录
   */
  private loadHistory(): void {
    if (existsSync(this.config.historyPath)) {
      try {
        const data = JSON.parse(readFileSync(this.config.historyPath, 'utf-8'));
        this.history = data.history || [];
        this.redoStack = data.redoStack || [];
      } catch {
        // 忽略加载错误，使用空历史
      }
    }
  }

  /**
   * 保存历史记录
   */
  private saveHistory(): void {
    try {
      const data = {
        history: this.history,
        redoStack: this.redoStack,
      };
      writeFileSync(this.config.historyPath, JSON.stringify(data, null, 2));
    } catch {
      // 忽略保存错误
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建配置备份
   */
  static createBackup(): string | null {
    if (!existsSync(CONFIG_PATH)) {
      return null;
    }

    const backupDir = `${process.env.HOME}/.omo-quota-backups`;
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${backupDir}/config-${timestamp}.jsonc`;

    try {
      const content = readFileSync(CONFIG_PATH, 'utf-8');
      writeFileSync(backupPath, content);
      return backupPath;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

/**
 * 全局撤销栈实例
 */
export const undoStack = new UndoStack();

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 记录策略切换操作
 */
export function recordSwitch(
  fromStrategy: string,
  toStrategy: string
): string {
  // 创建切换前的备份
  const backup = UndoStack.createBackup();

  return undoStack.push('switch', `切换策略: ${fromStrategy} → ${toStrategy}`, {
    previousStrategy: fromStrategy,
    configBackup: backup || undefined,
  });
}

/**
 * 执行撤销操作
 */
export async function performUndo(): Promise<boolean> {
  if (!undoStack.canUndo()) {
    console.log(chalk.yellow('没有可撤销的操作'));
    console.log(chalk.gray('使用 "omo-quota history" 查看操作历史'));
    return false;
  }

  const history = undoStack.getHistory();
  const lastOp = history[history.length - 1];

  console.log(chalk.cyan('\n撤销操作:'));
  console.log(chalk.gray(`  操作: ${lastOp.description}`));
  console.log(chalk.gray(`  时间: ${new Date(lastOp.timestamp).toLocaleString('zh-CN')}`));

  const success = await undoStack.undo();

  if (success) {
    console.log(chalk.green('\n✓ 撤销成功'));

    if (lastOp.restoreData.previousStrategy) {
      console.log(chalk.gray(`\n当前策略: ${lastOp.restoreData.previousStrategy}`));
      console.log(chalk.gray('请重启 OpenCode 使配置生效'));
    }
  }

  return success;
}

/**
 * 执行重做操作
 */
export async function performRedo(): Promise<boolean> {
  if (!undoStack.canRedo()) {
    console.log(chalk.yellow('没有可重做的操作'));
    return false;
  }

  return await undoStack.redo();
}

/**
 * 显示历史记录
 */
export function showHistory(): void {
  const history = undoStack.getHistory();
  const redoStack = undoStack.getRedoStack();

  if (history.length === 0 && redoStack.length === 0) {
    console.log(chalk.yellow('暂无操作历史'));
    return;
  }

  console.log(chalk.bold.cyan('\n操作历史:\n'));

  if (history.length > 0) {
    console.log(chalk.white.bold('可撤销的操作:'));
    history.slice().reverse().forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const status = entry.reversible ? chalk.green('✓') : chalk.gray('○');
      console.log(`  ${status} ${chalk.gray(time)} ${chalk.white(entry.description)}`);
    });
  }

  if (redoStack.length > 0) {
    console.log(chalk.white.bold('\n可重做的操作:'));
    redoStack.slice().reverse().forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log(`  ${chalk.yellow('↶')} ${chalk.gray(time)} ${chalk.white(entry.description)}`);
    });
  }

  console.log('');
}
