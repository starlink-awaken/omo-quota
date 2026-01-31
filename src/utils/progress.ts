/**
 * OmoQuota 进度反馈系统
 *
 * 提供清晰的命令执行进度反馈，包括：
 * - 分步进度显示
 * - 进度条
 * - 时间估算
 * - 实时状态更新
 */

import chalk from 'chalk';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 进度步骤配置
 */
export interface ProgressStep {
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 状态 */
  status?: 'pending' | 'running' | 'completed' | 'failed';
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 详细信息（如文件数、字节数等） */
  details?: string;
}

/**
 * 进度显示配置
 */
export interface ProgressOptions {
  /** 显示步骤编号 */
  showStepNumber: boolean;
  /** 显示时间 */
  showTime: boolean;
  /** 显示估算 */
  showEstimate: boolean;
  /** 简洁模式 */
  compact: boolean;
  /** 自定义输出流 */
  outputStream?: NodeJS.WriteStream;
}

// ============================================================================
// 进度管理器类
// ============================================================================

export class ProgressManager {
  private steps: ProgressStep[] = [];
  private currentStep = 0;
  private config: ProgressOptions;
  private output: NodeJS.WriteStream;
  private totalStartTime = 0;

  constructor(steps: string[], config: Partial<ProgressOptions> = {}) {
    this.config = {
      showStepNumber: config.showStepNumber ?? true,
      showTime: config.showTime ?? true,
      showEstimate: config.showEstimate ?? true,
      compact: config.compact ?? false,
      outputStream: config.outputStream ?? process.stdout,
    };
    this.output = this.config.outputStream || process.stdout;

    // 初始化步骤
    this.steps = steps.map((name, index) => ({
      name,
      status: 'pending' as const,
      icon: this.getDefaultIcon(index),
    }));
    this.totalStartTime = Date.now();
  }

  /**
   * 获取步骤默认图标
   */
  private getDefaultIcon(index: number): string {
    const icons = ['🔍', '📄', '🔧', '💰', '💾', '✅'];
    return icons[index % icons.length];
  }

  /**
   * 开始执行步骤
   */
  start(stepIndex?: number): void {
    const index = stepIndex ?? this.currentStep;
    if (index >= this.steps.length) return;

    this.steps[index].status = 'running';
    this.steps[index].startTime = Date.now();

    if (!this.config.compact) {
      this.renderStep(index);
    } else {
      this.renderCompact(index);
    }
  }

  /**
   * 更新步骤详情
   */
  update(details: string, stepIndex?: number): void {
    const index = stepIndex ?? this.currentStep;
    if (index >= this.steps.length) return;

    this.steps[index].details = details;

    if (this.config.compact) {
      this.renderCompact(index, true);
    }
  }

  /**
   * 完成当前步骤
   */
  complete(stepIndex?: number): void {
    const index = stepIndex ?? this.currentStep;
    if (index >= this.steps.length) return;

    this.steps[index].status = 'completed';
    this.steps[index].endTime = Date.now();

    if (!this.config.compact) {
      this.renderStepComplete(index);
    }

    this.currentStep++;
  }

  /**
   * 标记步骤失败
   */
  fail(error: string, stepIndex?: number): void {
    const index = stepIndex ?? this.currentStep;
    if (index >= this.steps.length) return;

    this.steps[index].status = 'failed';
    this.steps[index].endTime = Date.now();

    this.renderStepFailed(index, error);
  }

  /**
   * 渲染步骤（初始显示）
   */
  private renderStep(index: number): void {
    const step = this.steps[index];
    const stepNum = this.config.showStepNumber ? `[${index + 1}/${this.steps.length}]` : '';
    const icon = step.icon || '➤';

    console.log(
      `${chalk.cyan(stepNum)} ${icon} ${chalk.white(step.name)}...`
    );
  }

  /**
   * 渲染步骤完成
   */
  private renderStepComplete(index: number): void {
    const step = this.steps[index];
    const duration = step.endTime && step.startTime
      ? `${((step.endTime - step.startTime) / 1000).toFixed(2)}s`
      : '';

    // 清除当前行并显示完成状态
    if (this.config.showTime && duration) {
      console.log(`${chalk.green('  ✓')} ${chalk.gray(`完成 (${duration})`)}`);
    } else {
      console.log(chalk.green('  ✓ 完成'));
    }
  }

  /**
   * 渲染步骤失败
   */
  private renderStepFailed(index: number, error: string): void {
    console.log(`${chalk.red('  ✗ 失败:')} ${chalk.red(error)}`);
  }

  /**
   * 渲染紧凑模式
   */
  private renderCompact(index: number, clear = false): void {
    const step = this.steps[index];
    const stepNum = index + 1;
    const icon = step.status === 'running' ? '⏳' : '✓';
    const details = step.details ? ` (${step.details})` : '';

    const line = `[${stepNum}/${this.steps.length}] ${icon} ${step.name}${details}`;

    if (clear && process.stdout.isTTY) {
      // 清除当前行
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
    }

    process.stdout.write('\r' + chalk.cyan(line));
  }

  /**
   * 获取剩余时间估算
   */
  getEstimatedTimeRemaining(): string {
    const completedSteps = this.steps.filter(s => s.status === 'completed' && s.startTime && s.endTime);
    if (completedSteps.length === 0) return '计算中...';

    const avgDuration = completedSteps.reduce((sum, s) => {
      return sum + ((s.endTime! - s.startTime!) / 1000);
    }, 0) / completedSteps.length;

    const remainingSteps = this.steps.length - this.currentStep;
    const estimatedSeconds = Math.ceil(avgDuration * remainingSteps);

    if (estimatedSeconds < 60) {
      return `约 ${estimatedSeconds} 秒`;
    } else {
      const minutes = Math.floor(estimatedSeconds / 60);
      const seconds = estimatedSeconds % 60;
      return `约 ${minutes} 分 ${seconds} 秒`;
    }
  }

  /**
   * 渲染最终摘要
   */
  renderSummary(): void {
    const totalTime = ((Date.now() - this.totalStartTime) / 1000).toFixed(2);

    console.log('');
    console.log(chalk.green.bold('✅ 全部完成!'));
    console.log(chalk.gray(`总耗时: ${totalTime}秒`));
    console.log('');
  }
}

// ============================================================================
// 进度条类
// ============================================================================

export class ProgressBar {
  private total: number;
  private current = 0;
  private width: number;
  private label: string;
  private lastOutput = '';

  constructor(total: number, label = '进度', width = 30) {
    this.total = total;
    this.width = width;
    this.label = label;
  }

  /**
   * 更新进度
   */
  update(current: number, details?: string): void {
    this.current = current;
    this.render(details);
  }

  /**
   * 增加进度
   */
  increment(amount = 1, details?: string): void {
    this.current += amount;
    this.render(details);
  }

  /**
   * 渲染进度条
   */
  private render(details?: string): void {
    if (!process.stdout.isTTY) return;

    const percentage = Math.min(100, Math.max(0, (this.current / this.total) * 100));
    const filled = Math.round((this.width * percentage) / 100);
    const empty = this.width - filled;

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const percentageText = `${percentage.toFixed(1)}%`;
    const detailsText = details ? ` - ${chalk.gray(details)}` : '';

    const output = `\r${this.label}: [${bar}] ${percentageText}${detailsText}`;

    // 清除之前的输出
    const clearLength = Math.max(this.lastOutput.length, output.length);
    process.stdout.write('\r' + ' '.repeat(clearLength) + '\r' + output);
    this.lastOutput = output;
  }

  /**
   * 完成进度条
   */
  complete(): void {
    this.current = this.total;
    this.render();
    process.stdout.write('\n');
  }
}

// ============================================================================
// Spinner（加载动画）类
// ============================================================================

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frameIndex = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private text = '';
  private isRunning = false;

  /**
   * 开始加载动画
   */
  start(text: string): void {
    if (this.isRunning) return;

    this.text = text;
    this.isRunning = true;

    this.interval = setInterval(() => {
      this.render();
    }, 80);
  }

  /**
   * 更新文本
   */
  update(text: string): void {
    this.text = text;
    if (!this.isRunning) {
      this.start(text);
    }
  }

  /**
   * 渲染当前帧
   */
  private render(): void {
    if (!process.stdout.isTTY || !this.isRunning) return;

    const frame = this.frames[this.frameIndex];
    this.frameIndex = (this.frameIndex + 1) % this.frames.length;

    process.stdout.write(`\r${chalk.cyan(frame)} ${this.text}`);
  }

  /**
   * 停止加载动画
   */
  stop(finalText?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;

    if (process.stdout.isTTY) {
      // 清除当前行
      process.stdout.write('\r' + ' '.repeat(this.text.length + 5) + '\r');

      if (finalText) {
        console.log(finalText);
      }
    }
  }

  /**
   * 停止并显示成功
   */
  succeed(text?: string): void {
    const message = text || this.text;
    this.stop(chalk.green('✓') + ' ' + message);
  }

  /**
   * 停止并显示失败
   */
  fail(text?: string): void {
    const message = text || this.text;
    this.stop(chalk.red('✗') + ' ' + message);
  }

  /**
   * 停止并显示警告
   */
  warn(text?: string): void {
    const message = text || this.text;
    this.stop(chalk.yellow('⚠') + ' ' + message);
  }
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 创建并执行多步骤任务
 */
export async function runSteps(
  steps: Array<{ name: string; fn: () => Promise<void> | void }>,
  options?: Partial<ProgressOptions>
): Promise<void> {
  const manager = new ProgressManager(
    steps.map(s => s.name),
    options
  );

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    manager.start(i);

    try {
      await step.fn();
      manager.complete(i);
    } catch (error) {
      manager.fail(error instanceof Error ? error.message : String(error), i);
      throw error;
    }
  }

  manager.renderSummary();
}

/**
 * 创建进度条并执行任务
 */
export async function runWithProgress<T>(
  total: number,
  label: string,
  fn: (progress: ProgressBar) => Promise<T> | T
): Promise<T> {
  const bar = new ProgressBar(total, label);

  try {
    const result = await fn(bar);
    bar.complete();
    return result;
  } catch (error) {
    process.stdout.write('\n');
    throw error;
  }
}

/**
 * 创建 Spinner 并执行任务
 */
export async function runWithSpinner<T>(
  text: string,
  fn: (spinner: Spinner) => Promise<T> | T
): Promise<T> {
  const spinner = new Spinner();
  spinner.start(text);

  try {
    const result = await fn(spinner);
    return result;
  } finally {
    if (spinner.isRunning) {
      spinner.stop();
    }
  }
}

// ============================================================================
// Before/After 对比示例
// ============================================================================

/**
 * Before 示例（旧版进度输出）:
 *
 * $ omo-quota sync
 * 🔄 Syncing quota from oh-my-opencode messages...
 * Scanning: ~/.opencode/messages
 * ✓ Found 342 assistant messages
 * ✓ Sync completed in 1234ms
 *
 * After 示例（新版进度输出）:
 *
 * $ omo-quota sync --verbose
 *
 * [1/5] 🔍 扫描消息历史目录...
 *   ✓ 完成 (0.3s)
 * [2/5] 📄 解析会话文件... (127/342)
 *   ✓ 完成 (1.2s)
 * [3/5] 💰 计算成本...
 *   ✓ 完成 (0.1s)
 * [4/5] 💾 更新追踪文件...
 *   ✓ 完成 (0.0s)
 * [5/5] ✅ 同步完成!
 *
 * 总耗时: 1.67秒
 */
