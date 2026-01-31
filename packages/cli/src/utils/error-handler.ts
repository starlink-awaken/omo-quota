/**
 * OmoQuota 错误处理工具
 *
 * 提供统一的错误处理、日志记录和用户友好的错误显示。
 */

import chalk from 'chalk';
import type { OmoQuotaError } from './errors';
import {
  isOmoQuotaError,
  wrapError,
  ErrorCodes,
  createTrackerNotFoundError,
  createStrategyNotFoundError,
  createConfigNotFoundError,
  createInvalidUsageError,
  createPathAccessDeniedError,
} from './errors';
import { logger } from './logger';

// Re-export logger types from the existing logger module
export type { ILogger, LoggerConfig } from './logger';
export { logger, createLogger, LogLevel } from './logger';

// Re-export error types and factory functions from errors.ts
export type { OmoQuotaError as OmoQuotaErrorType, ErrorDetails } from './errors';
export {
  OmoQuotaError,
  ErrorCodes,
  isOmoQuotaError,
  wrapError,
  createTrackerNotFoundError,
  createStrategyNotFoundError,
  createConfigNotFoundError,
  createInvalidUsageError,
  createPathAccessDeniedError,
  createStrategyInvalidError,
  createStrategyFileNotFoundError,
  createTrackerLoadError,
  createTrackerSaveError,
  createConfigLoadError,
  createConfigSaveError,
  createInvalidProviderError,
} from './errors';

/**
 * 错误处理器配置
 */
export interface ErrorHandlerConfig {
  /** 是否启用详细模式 */
  verbose: boolean;
  /** 是否启用静默模式 */
  silent: boolean;
}

/**
 * 默认配置
 */
const defaultConfig: ErrorHandlerConfig = {
  verbose: false,
  silent: false,
};

/**
 * 当前配置（可由外部修改）
 */
export let errorHandlerConfig: ErrorHandlerConfig = { ...defaultConfig };

/**
 * 更新错误处理器配置
 */
export function setErrorHandlerConfig(config: Partial<ErrorHandlerConfig>): void {
  errorHandlerConfig = { ...errorHandlerConfig, ...config };
}

/**
 * 获取帮助信息
 */
function getHelpMessage(error: OmoQuotaError): string[] {
  const lines: string[] = [];

  switch (error.code) {
    case ErrorCodes.STRATEGY_INVALID:
    case ErrorCodes.STRATEGY_NOT_FOUND:
      lines.push(
        '',
        chalk.yellow.bold('💡 可用策略：'),
        '',
        `${chalk.cyan('  • ')}${chalk.bold('performance')}${chalk.gray(' - 极致性能型 (关键任务、紧急项目)')}`,
        `${chalk.cyan('  • ')}${chalk.bold('balanced')}${chalk.gray(' - 均衡实用型 (日常开发、推荐) ⭐')}`,
        `${chalk.cyan('  • ')}${chalk.bold('economical')}${chalk.gray(' - 极致省钱型 (实验项目、预算受限)')}`,
        '',
        chalk.gray('使用 "omo-quota list" 查看所有策略详情'),
        chalk.gray('切换命令: omo-quota switch <策略名称>'),
      );
      break;

    case ErrorCodes.STRATEGY_FILE_NOT_FOUND:
      lines.push(
        '',
        chalk.yellow.bold('💡 可能的解决方案：'),
        '',
        chalk.cyan('  1. 运行初始化生成策略模板：'),
        chalk.bold.white('     omo-quota init'),
        '',
        chalk.cyan('  2. 验证策略文件状态：'),
        chalk.bold.white('     omo-quota doctor'),
        '',
        chalk.cyan('  3. 查看所有可用策略：'),
        chalk.bold.white('     omo-quota list'),
        '',
        chalk.gray('📚 详细文档: https://github.com/xiamingxing/omo-quota#策略说明'),
        chalk.gray('💡 提示: 策略文件应位于 ~/.config/opencode/strategies/ 目录'),
      );
      break;

    case ErrorCodes.TRACKER_NOT_FOUND:
      lines.push(
        '',
        chalk.yellow.bold('💡 请先初始化 omo-quota：'),
        '',
        chalk.bold.white('  omo-quota init'),
        '',
        chalk.gray('这将创建配额追踪文件并生成策略模板。'),
      );
      break;

    case ErrorCodes.INVALID_PROVIDER:
      lines.push(
        '',
        chalk.yellow.bold('💡 可用的提供者：'),
        '',
        chalk.gray('  5小时重置: anthropic, google-1, google-2, zhipuai, fangzhou'),
        chalk.gray('  月度重置: github-copilot-premium'),
        chalk.gray('  余额类型: deepseek, siliconflow, openrouter'),
        '',
        chalk.gray('使用 "omo-quota status" 查看所有提供者状态。'),
      );
      break;

    case ErrorCodes.PATH_NOT_FOUND:
      lines.push(
        '',
        chalk.yellow.bold('💡 请检查路径是否正确，或运行初始化：'),
        '',
        chalk.bold.white('  omo-quota doctor'),
        '',
        chalk.gray('这将检查所有必要的目录和文件。'),
      );
      break;

    default:
      lines.push(
        '',
        chalk.gray('💡 运行 "omo-quota doctor" 检查配置状态'),
        chalk.gray('📚 查看文档: https://github.com/xiamingxing/omo-quota'),
      );
      break;
  }

  return lines;
}

/**
 * 获取错误图标
 */
function getErrorIcon(error: OmoQuotaError): string {
  switch (error.category) {
    case 'strategy':
      return '📋';
    case 'tracker':
      return '📊';
    case 'config':
      return '⚙️';
    case 'permission':
      return '🔒';
    case 'usage':
      return '📈';
    case 'system':
    default:
      return '❌';
  }
}

/**
 * 格式化错误消息并输出
 */
function formatAndDisplayError(error: OmoQuotaError): void {
  const { silent, verbose } = errorHandlerConfig;
  const icon = getErrorIcon(error);

  // 静默模式只输出最关键的错误
  if (silent) {
    console.error(`Error: ${error.message}`);
    return;
  }

  // 主错误消息
  const errorPrefix = chalk.red.bold(`${icon} 错误`);
  console.error(`\n${errorPrefix}: ${error.message}`);

  // 显示详细信息
  if (verbose && Object.keys(error.details).length > 0) {
    console.error(chalk.gray('\n详细信息:'));
    for (const [key, value] of Object.entries(error.details)) {
      console.error(chalk.gray(`  ${key}: ${value}`));
    }
  }

  // 显示原因
  if (error.cause) {
    console.error(chalk.gray(`\n原因: ${error.cause.message}`));
  }

  // 显示帮助信息
  if (error.showHelp) {
    const helpLines = getHelpMessage(error);
    console.error(helpLines.join('\n'));
  }

  console.error('');
}

/**
 * 处理错误的主函数
 *
 * @param error - 错误对象
 * @param exitProcess - 是否退出进程（默认 true）
 * @returns 退出码（如果 exitProcess 为 false）
 */
export function handleError(error: unknown, exitProcess: boolean = true): number {
  let omoError: OmoQuotaError;

  // 包装非 OmoQuotaError
  if (!isOmoQuotaError(error)) {
    omoError = wrapError(error);

    // 对于非自定义错误，记录原始堆栈
    if (error instanceof Error && error.stack) {
      logDebug('原始错误堆栈:', error.stack);
    }
  } else {
    omoError = error;
  }

  // 记录错误日志
  logError(`[${omoError.code}] ${omoError.message}`, {
    category: omoError.category,
    exitCode: omoError.exitCode,
    details: omoError.details,
  });

  // 显示错误消息
  formatAndDisplayError(omoError);

  // 退出进程
  if (exitProcess) {
    process.exit(omoError.exitCode);
  }

  return omoError.exitCode;
}

/**
 * 安全执行函数，自动处理错误
 *
 * @example
 * ```ts
 * const result = await safeExecute(
 *   async () => {
 *     const tracker = loadTracker();
 *     return tracker.currentStrategy;
 *   },
 *   '加载追踪器失败'
 * );
 * ```
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  context: string = '操作',
  options: {
    fallback?: T;
    exit?: boolean;
  } = {}
): Promise<T | undefined> {
  const { fallback, exit = true } = options;

  try {
    return await fn();
  } catch (error) {
    logError(`${context}失败: ${error instanceof Error ? error.message : String(error)}`);

    if (exit) {
      handleError(error, true);
    }

    return fallback;
  }
}

/**
 * 同步版本的安全执行
 */
export function safeExecuteSync<T>(
  fn: () => T,
  context: string = '操作',
  options: {
    fallback?: T;
    exit?: boolean;
  } = {}
): T | undefined {
  const { fallback, exit = true } = options;

  try {
    return fn();
  } catch (error) {
    logError(`${context}失败: ${error instanceof Error ? error.message : String(error)}`);

    if (exit) {
      handleError(error, true);
    }

    return fallback;
  }
}

// ============================================================================
// 日志工具（使用现有的 logger 模块）
// ============================================================================

/**
 * 记录调试日志
 */
export function logDebug(...args: unknown[]): void {
  logger.debug(...args);
}

/**
 * 记录信息日志
 */
export function logInfo(...args: unknown[]): void {
  logger.info(...args);
}

/**
 * 记录警告日志
 */
export function logWarn(...args: unknown[]): void {
  logger.warn(...args);
}

/**
 * 记录错误日志
 */
export function logError(...args: unknown[]): void {
  logger.error(...args);
}

// ============================================================================
// 命令包装器
// ============================================================================

/**
 * 包装命令函数，自动处理错误
 *
 * @example
 * ```ts
 * program
 *   .command('status')
 *   .description('显示所有资源的当前状态')
 *   .action(wrapCommand(status));
 * ```
 */
export function wrapCommand<T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>
): (...args: T) => Promise<void> {
  return async (...args: T): Promise<void> => {
    try {
      await Promise.resolve(fn(...args));
    } catch (error) {
      handleError(error, true);
    }
  };
}

/**
 * 同步命令包装器
 */
export function wrapCommandSync<T extends unknown[]>(
  fn: (...args: T) => void
): (...args: T) => void {
  return (...args: T): void => {
    try {
      fn(...args);
    } catch (error) {
      handleError(error, true);
    }
  };
}

// ============================================================================
// 初始化（设置全局错误处理）
// ============================================================================

/**
 * 设置全局错误处理器
 *
 * 这将捕获所有未处理的异常和拒绝的 Promise。
 */
export function setupGlobalErrorHandlers(): void {
  // 捕获未处理的异常
  process.on('uncaughtException', (error: Error) => {
    logError('未捕获的异常:', error.message);
    if (errorHandlerConfig.verbose && error.stack) {
      logError(error.stack);
    }
    handleError(error, true);
  });

  // 捕获未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logError('未处理的 Promise 拒绝:', error.message);
    if (errorHandlerConfig.verbose && error.stack) {
      logError(error.stack);
    }
    handleError(error, true);
  });
}
