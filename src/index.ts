#!/usr/bin/env bun
import { Command } from 'commander';
import { status } from './commands/status';
import { switchStrategy } from './commands/switch';
import { reset } from './commands/reset';
import { update } from './commands/update';
import { init } from './commands/init';
import { undo } from './commands/undo';
import { doctor } from './commands/doctor';
import { list } from './commands/list';
import { syncQuota } from './commands/sync';
import { reportDaily, reportMonthly } from './commands/report';
import { startDashboard } from './commands/dashboard';
import { watch } from './commands/watch';
import { validateModels } from './commands/validate-models';
import packageJson from '../package.json';
import { logger, LogLevel } from './utils/logger';
import { setupGlobalErrorHandlers, setErrorHandlerConfig, wrapCommand } from './utils/error-handler';

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export logger for use in other modules
export { logger, createLogger, LogLevel } from './utils/logger';
export type { ILogger, LoggerConfig } from './utils/logger';

// Export error handling utilities for use in commands
export {
  setupGlobalErrorHandlers,
  setErrorHandlerConfig,
  wrapCommand,
  OmoQuotaError,
  ErrorCodes,
  createTrackerNotFoundError,
  createStrategyNotFoundError,
  createConfigNotFoundError,
  createInvalidUsageError,
  createPathAccessDeniedError,
} from './utils/error-handler';

// Export error types and factory functions
export {
  OmoQuotaError as OmoQuotaErrorType,
  isOmoQuotaError,
  wrapError,
} from './utils/errors';

const program = new Command();

// ============================================================================
// SETUP GLOBAL ERROR HANDLERS
// ============================================================================

// 设置全局错误处理（必须在任何其他代码之前）
setupGlobalErrorHandlers();

// ============================================================================
// LOGGING AND ERROR HANDLING CONFIGURATION
// ============================================================================

/**
 * Configure logger and error handler based on command-line options
 * Priority: --silent > --log > --verbose > OMO_QUOTA_LOG_LEVEL env var
 */
function configureLoggerAndErrorHandler(options: { verbose?: boolean; log?: string; silent?: boolean }): void {
  // Configure logger
  if (options.silent) {
    logger.setLevel('error');
  } else if (options.log) {
    const level = options.log.toLowerCase();
    if (['debug', 'info', 'warn', 'error', 'silent'].includes(level)) {
      logger.setLevel(level as any);
    } else {
      logger.warn(`Invalid log level: ${options.log}. Using: info`);
    }
  } else if (options.verbose) {
    logger.setLevel('debug');
  }

  // Configure error handler
  setErrorHandlerConfig({
    verbose: options.verbose || false,
    silent: options.silent || false,
  });
}

// ============================================================================
// CLI PROGRAM SETUP
// ============================================================================

program
  .name('omo-quota')
  .description('Oh-My-OpenCode 配额管理和策略切换工具')
  .version(packageJson.version)
  .option('-v, --verbose', '详细输出模式 (等同于 --log debug)')
  .option('--log <level>', '日志级别 (debug|info|warn|error|silent)', 'info')
  .option('--silent', '静默模式 (仅输出错误)')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    configureLoggerAndErrorHandler(opts);
  });

// ============================================================================
// COMMANDS
// ============================================================================

program
  .command('list')
  .description('列出所有可用的配置策略')
  .action(list);

program
  .command('status')
  .description('显示所有资源的当前状态')
  .action(status);

program
  .command('switch <strategy>')
  .description('切换配置策略 (performance|balanced|economical)')
  .action(switchStrategy);

program
  .command('reset <provider>')
  .description('手动标记资源已重置 (anthropic|google-1|google-2|zhipuai|all)')
  .action(reset);

program
  .command('update <provider> <usage>')
  .description('更新资源用量 (例如: github-copilot-premium 150)')
  .action(update);

program
  .command('init')
  .description('初始化配额追踪文件')
  .option('-w, --wizard', '启动交互式引导向导')
  .option('-y, --yes', '跳过确认直接覆盖')
  .action((options) => init(options));

program
  .command('doctor')
  .description('验证配置文件和策略')
  .action(doctor);

program
  .command('sync')
  .description('同步 oh-my-opencode 使用记录到配额追踪器')
  .action(syncQuota);

program
  .command('report <period>')
  .description('生成成本分析报告 (daily|monthly)')
  .option('--export', '导出为Markdown文件')
  .action((period: string, options: any) => {
    if (period === 'daily') {
      reportDaily(options);
    } else if (period === 'monthly') {
      reportMonthly();
    } else {
      logger.error('Invalid period. Use: daily or monthly');
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('启动 Web 仪表盘')
  .option('-p, --port <port>', '端口号', '3737')
  .action((options: any) => {
    const port = parseInt(options.port);
    startDashboard(port);
  });

program
  .command('watch')
  .description('监控配额状态并自动预警')
  .action(watch);

program
  .command('validate-models')
  .description('验证模型配置和回退链')
  .option('-s, --strategy <name>', '指定要验证的策略名称', 'balanced')
  .option('--all', '验证所有策略')
  .action(validateModels);

program
  .command('undo')
  .description('撤销上一次策略切换操作')
  .option('--redo', '重做已撤销的操作')
  .action(undo);

program.parse();
