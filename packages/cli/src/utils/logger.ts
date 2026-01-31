/**
 * Unified Logger System for omo-quota
 *
 * Features:
 * - Log levels: debug, info, warn, error, silent
 * - Environment variable: OMO_QUOTA_LOG_LEVEL
 * - Colored output via chalk (when available)
 * - Singleton pattern
 * - Bun-optimized
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Log level enumeration
 * Lower number = higher priority (more important)
 */
export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/**
 * Log level names for configuration
 */
export type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Enable colored output (requires chalk) */
  colorize: boolean;
  /** Prefix for all log messages */
  prefix?: string;
  /** Include timestamp in logs */
  timestamp: boolean;
  /** Custom output stream (defaults to console) */
  output?: Pick<Console, 'log' | 'warn' | 'error'>;
}

/**
 * Logger interface defining the public API
 */
export interface ILogger {
  /** Set the log level */
  setLevel(level: LogLevelName): void;
  /** Get current log level */
  getLevel(): LogLevel;
  /** Enable or disable colored output */
  setColorize(enabled: boolean): void;
  /** Log debug message */
  debug(...args: unknown[]): void;
  /** Log info message */
  info(...args: unknown[]): void;
  /** Log warning message */
  warn(...args: unknown[]): void;
  /** Log error message */
  error(...args: unknown[]): void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default log level from environment or 'info' */
const DEFAULT_LOG_LEVEL = (process.env.OMO_QUOTA_LOG_LEVEL as LogLevelName) || 'info';

/** Log level name to enum mapping */
const LOG_LEVEL_MAP: Record<LogLevelName, LogLevel> = {
  silent: LogLevel.SILENT,
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

/** Log level to name mapping */
const LOG_LEVEL_NAMES: Record<LogLevel, LogLevelName> = {
  [LogLevel.SILENT]: 'silent',
  [LogLevel.ERROR]: 'error',
  [LogLevel.WARN]: 'warn',
  [LogLevel.INFO]: 'info',
  [LogLevel.DEBUG]: 'debug',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely import chalk for colored output
 * Falls back to plain text if chalk is not available
 */
async function loadChalk(): Promise<(text: string, color: 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'cyan') => string> {
  try {
    const chalk = await import('chalk');
    return (text: string, color: 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'cyan') => {
      switch (color) {
        case 'red': return chalk.red(text);
        case 'yellow': return chalk.yellow(text);
        case 'green': return chalk.green(text);
        case 'blue': return chalk.blue(text);
        case 'gray': return chalk.gray(text);
        case 'cyan': return chalk.cyan(text);
        default: return text;
      }
    };
  } catch {
    // Chalk not available, return plain text
    return (text: string) => text;
  }
}

/**
 * Format timestamp for log messages
 */
function formatTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

/**
 * Main Logger class implementing ILogger interface
 */
class Logger implements ILogger {
  private config: LoggerConfig;
  private colorFn: (text: string, color: 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'cyan') => string;
  private chalkInitialized = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    const levelName = (config.level !== undefined)
      ? LOG_LEVEL_NAMES[config.level]
      : DEFAULT_LOG_LEVEL;

    this.config = {
      level: LOG_LEVEL_MAP[levelName],
      colorize: config.colorize ?? true,
      prefix: config.prefix,
      timestamp: config.timestamp ?? false,
      output: config.output ?? console,
    };

    // Initialize color function (will be lazily loaded on first use)
    this.colorFn = (text: string) => text;
  }

  /**
   * Ensure chalk is loaded before first colored output
   */
  private async ensureColorInitialized(): Promise<void> {
    if (!this.chalkInitialized && this.config.colorize) {
      this.colorFn = await loadChalk();
      this.chalkInitialized = true;
    }
  }

  /**
   * Format log message with prefix, level, and optional timestamp
   */
  private formatMessage(level: string, ...args: unknown[]): string[] {
    const parts: string[] = [];

    if (this.config.timestamp) {
      parts.push(this.colorFn(`[${formatTimestamp()}]`, 'gray'));
    }

    const levelLabel = `[${level.toUpperCase()}]`;
    const coloredLabel = this.colorizeLevel(levelLabel, level);
    parts.push(coloredLabel);

    if (this.config.prefix) {
      parts.push(this.colorFn(`[${this.config.prefix}]`, 'cyan'));
    }

    return [parts.join(' '), ...args.map(String)];
  }

  /**
   * Apply color to log level label
   */
  private colorizeLevel(label: string, level: string): string {
    if (!this.config.colorize) return label;

    const colorMap: Record<string, 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'cyan'> = {
      debug: 'gray',
      info: 'blue',
      warn: 'yellow',
      error: 'red',
    };

    const color = colorMap[level] ?? 'gray';
    return this.colorFn(label, color);
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevelName): void {
    this.config.level = LOG_LEVEL_MAP[level];
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable or disable colored output
   */
  setColorize(enabled: boolean): void {
    this.config.colorize = enabled;
    if (!enabled) {
      this.colorFn = (text: string) => text;
    }
  }

  /**
   * Log debug message
   */
  debug(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.ensureColorInitialized();
    const message = this.formatMessage('debug', ...args);
    this.config.output!.log(...message);
  }

  /**
   * Log info message
   */
  info(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.ensureColorInitialized();
    const message = this.formatMessage('info', ...args);
    this.config.output!.log(...message);
  }

  /**
   * Log warning message
   */
  warn(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.ensureColorInitialized();
    const message = this.formatMessage('warn', ...args);
    this.config.output!.warn(...message);
  }

  /**
   * Log error message
   */
  error(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    this.ensureColorInitialized();
    const message = this.formatMessage('error', ...args);
    this.config.output!.error(...message);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global logger instance
 * Can be reconfigured via setLevel(), setColorize(), etc.
 */
export const logger = new Logger();

/**
 * Create a new logger instance with custom configuration
 * Useful for creating context-specific loggers
 */
export function createLogger(config: Partial<LoggerConfig> & { prefix: string }): Logger {
  return new Logger(config);
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { LogLevel as LOG_LEVEL };
export type { LoggerConfig as LoggerConfigType };
