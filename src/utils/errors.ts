/**
 * OmoQuota 统一错误处理系统
 *
 * 提供自定义错误类和工厂函数，用于统一错误处理和用户友好的错误消息。
 */

/**
 * 错误码枚举
 *
 * 每个错误码都有对应的退出码和用户友好的消息模板。
 */
export enum ErrorCodes {
  // 策略相关错误 (1-10)
  STRATEGY_NOT_FOUND = 'STRATEGY_NOT_FOUND',
  STRATEGY_INVALID = 'STRATEGY_INVALID',
  STRATEGY_FILE_NOT_FOUND = 'STRATEGY_FILE_NOT_FOUND',
  STRATEGY_PARSE_ERROR = 'STRATEGY_PARSE_ERROR',

  // 追踪器相关错误 (11-20)
  TRACKER_NOT_FOUND = 'TRACKER_NOT_FOUND',
  TRACKER_LOAD_ERROR = 'TRACKER_LOAD_ERROR',
  TRACKER_SAVE_ERROR = 'TRACKER_SAVE_ERROR',
  TRACKER_INVALID = 'TRACKER_INVALID',

  // 配置文件相关错误 (21-30)
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_LOAD_ERROR = 'CONFIG_LOAD_ERROR',
  CONFIG_SAVE_ERROR = 'CONFIG_SAVE_ERROR',
  CONFIG_BACKUP_ERROR = 'CONFIG_BACKUP_ERROR',
  CONFIG_RESTORE_ERROR = 'CONFIG_RESTORE_ERROR',

  // 路径和权限相关错误 (31-40)
  PATH_ACCESS_DENIED = 'PATH_ACCESS_DENIED',
  PATH_NOT_FOUND = 'PATH_NOT_FOUND',
  DIRECTORY_CREATE_ERROR = 'DIRECTORY_CREATE_ERROR',

  // 用量和数据相关错误 (41-50)
  INVALID_USAGE = 'INVALID_USAGE',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',

  // 系统和环境错误 (51-60)
  ENVIRONMENT_ERROR = 'ENVIRONMENT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 错误元数据
 */
interface ErrorMetadata {
  /** 用户友好的消息模板 */
  messageTemplate: string;
  /** 退出码 */
  exitCode: number;
  /** 是否需要显示帮助信息 */
  showHelp: boolean;
  /** 错误类别 */
  category: 'strategy' | 'tracker' | 'config' | 'permission' | 'usage' | 'system';
}

/**
 * 错误元数据映射表
 */
const ERROR_METADATA: Record<ErrorCodes, ErrorMetadata> = {
  // 策略相关
  [ErrorCodes.STRATEGY_NOT_FOUND]: {
    messageTemplate: '未找到策略: {strategy}',
    exitCode: 1,
    showHelp: true,
    category: 'strategy',
  },
  [ErrorCodes.STRATEGY_INVALID]: {
    messageTemplate: '无效的策略名称: {strategy}',
    exitCode: 1,
    showHelp: true,
    category: 'strategy',
  },
  [ErrorCodes.STRATEGY_FILE_NOT_FOUND]: {
    messageTemplate: '策略文件不存在: {path}',
    exitCode: 2,
    showHelp: true,
    category: 'strategy',
  },
  [ErrorCodes.STRATEGY_PARSE_ERROR]: {
    messageTemplate: '策略文件解析错误: {reason}',
    exitCode: 2,
    showHelp: false,
    category: 'strategy',
  },

  // 追踪器相关
  [ErrorCodes.TRACKER_NOT_FOUND]: {
    messageTemplate: '配额追踪文件不存在，请先运行: omo-quota init',
    exitCode: 3,
    showHelp: true,
    category: 'tracker',
  },
  [ErrorCodes.TRACKER_LOAD_ERROR]: {
    messageTemplate: '读取追踪文件失败: {reason}',
    exitCode: 3,
    showHelp: false,
    category: 'tracker',
  },
  [ErrorCodes.TRACKER_SAVE_ERROR]: {
    messageTemplate: '保存追踪文件失败: {reason}',
    exitCode: 3,
    showHelp: false,
    category: 'tracker',
  },
  [ErrorCodes.TRACKER_INVALID]: {
    messageTemplate: '追踪文件数据格式无效',
    exitCode: 3,
    showHelp: true,
    category: 'tracker',
  },

  // 配置文件相关
  [ErrorCodes.CONFIG_NOT_FOUND]: {
    messageTemplate: '配置文件不存在: {path}',
    exitCode: 4,
    showHelp: true,
    category: 'config',
  },
  [ErrorCodes.CONFIG_LOAD_ERROR]: {
    messageTemplate: '读取配置文件失败: {reason}',
    exitCode: 4,
    showHelp: false,
    category: 'config',
  },
  [ErrorCodes.CONFIG_SAVE_ERROR]: {
    messageTemplate: '保存配置文件失败: {reason}',
    exitCode: 4,
    showHelp: false,
    category: 'config',
  },
  [ErrorCodes.CONFIG_BACKUP_ERROR]: {
    messageTemplate: '备份配置失败: {reason}',
    exitCode: 4,
    showHelp: false,
    category: 'config',
  },
  [ErrorCodes.CONFIG_RESTORE_ERROR]: {
    messageTemplate: '恢复配置失败: {reason}',
    exitCode: 4,
    showHelp: false,
    category: 'config',
  },

  // 路径和权限相关
  [ErrorCodes.PATH_ACCESS_DENIED]: {
    messageTemplate: '无法访问路径: {path}',
    exitCode: 5,
    showHelp: false,
    category: 'permission',
  },
  [ErrorCodes.PATH_NOT_FOUND]: {
    messageTemplate: '路径不存在: {path}',
    exitCode: 5,
    showHelp: true,
    category: 'permission',
  },
  [ErrorCodes.DIRECTORY_CREATE_ERROR]: {
    messageTemplate: '创建目录失败: {path}',
    exitCode: 5,
    showHelp: false,
    category: 'permission',
  },

  // 用量和数据相关
  [ErrorCodes.INVALID_USAGE]: {
    messageTemplate: '无效的用量值: {value}',
    exitCode: 6,
    showHelp: false,
    category: 'usage',
  },
  [ErrorCodes.INVALID_PROVIDER]: {
    messageTemplate: '未知的提供者: {provider}',
    exitCode: 6,
    showHelp: true,
    category: 'usage',
  },
  [ErrorCodes.INVALID_DATA_FORMAT]: {
    messageTemplate: '数据格式无效: {reason}',
    exitCode: 6,
    showHelp: false,
    category: 'usage',
  },

  // 系统和环境错误
  [ErrorCodes.ENVIRONMENT_ERROR]: {
    messageTemplate: '环境配置错误: {reason}',
    exitCode: 7,
    showHelp: false,
    category: 'system',
  },
  [ErrorCodes.NETWORK_ERROR]: {
    messageTemplate: '网络错误: {reason}',
    exitCode: 7,
    showHelp: false,
    category: 'system',
  },
  [ErrorCodes.UNKNOWN_ERROR]: {
    messageTemplate: '未知错误: {reason}',
    exitCode: 1,
    showHelp: false,
    category: 'system',
  },
};

/**
 * 错误详情接口
 */
export interface ErrorDetails {
  [key: string]: string | number | boolean | undefined;
}

/**
 * OmoQuota 自定义错误基类
 *
 * 所有 omo-quota 相关的错误都应该继承此类。
 *
 * @example
 * ```ts
 * throw new OmoQuotaError(
 *   ErrorCodes.STRATEGY_NOT_FOUND,
 *   { strategy: 'performance' }
 * );
 * ```
 */
export class OmoQuotaError extends Error {
  /** 错误码 */
  public readonly code: ErrorCodes;

  /** 退出码 */
  public readonly exitCode: number;

  /** 错误详情 */
  public readonly details: ErrorDetails;

  /** 错误类别 */
  public readonly category: string;

  /** 是否显示帮助信息 */
  public readonly showHelp: boolean;

  /** 原始错误（如果是由其他错误包装而来） */
  public readonly cause?: Error;

  constructor(
    code: ErrorCodes,
    details: ErrorDetails = {},
    cause?: Error
  ) {
    const metadata = ERROR_METADATA[code];
    const message = OmoQuotaError.formatMessage(metadata.messageTemplate, details);

    super(message, { cause });

    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = metadata.exitCode;
    this.details = details;
    this.category = metadata.category;
    this.showHelp = metadata.showHelp;
    this.cause = cause;

    // 保持正确的堆栈跟踪
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * 格式化错误消息
   */
  private static formatMessage(template: string, details: ErrorDetails): string {
    let message = template;
    for (const [key, value] of Object.entries(details)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return message;
  }

  /**
   * 获取完整的错误信息（包括详情）
   */
  getFullMessage(): string {
    const parts: string[] = [this.message];

    if (Object.keys(this.details).length > 0) {
      parts.push('\n详情:');
      for (const [key, value] of Object.entries(this.details)) {
        parts.push(`  ${key}: ${value}`);
      }
    }

    if (this.cause) {
      parts.push(`\n原因: ${this.cause.message}`);
    }

    return parts.join('\n');
  }

  /**
   * 检查是否为特定错误码
   */
  isErrorCode(code: ErrorCodes): boolean {
    return this.code === code;
  }

  /**
   * 检查是否为特定类别
   */
  isCategory(category: string): boolean {
    return this.category === category;
  }

  /**
   * 转换为可序列化的对象
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      exitCode: this.exitCode,
      category: this.category,
      details: this.details,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
      } : undefined,
    };
  }
}

/**
 * 策略未找到错误
 */
export class StrategyNotFoundError extends OmoQuotaError {
  constructor(strategy: string) {
    super(ErrorCodes.STRATEGY_NOT_FOUND, { strategy });
  }
}

/**
 * 策略无效错误
 */
export class StrategyInvalidError extends OmoQuotaError {
  constructor(strategy: string) {
    super(ErrorCodes.STRATEGY_INVALID, { strategy });
  }
}

/**
 * 策略文件未找到错误
 */
export class StrategyFileNotFoundError extends OmoQuotaError {
  constructor(path: string) {
    super(ErrorCodes.STRATEGY_FILE_NOT_FOUND, { path });
  }
}

/**
 * 追踪器未找到错误
 */
export class TrackerNotFoundError extends OmoQuotaError {
  constructor() {
    super(ErrorCodes.TRACKER_NOT_FOUND);
  }
}

/**
 * 追踪器加载错误
 */
export class TrackerLoadError extends OmoQuotaError {
  constructor(reason: string, cause?: Error) {
    super(ErrorCodes.TRACKER_LOAD_ERROR, { reason }, cause);
  }
}

/**
 * 追踪器保存错误
 */
export class TrackerSaveError extends OmoQuotaError {
  constructor(reason: string, cause?: Error) {
    super(ErrorCodes.TRACKER_SAVE_ERROR, { reason }, cause);
  }
}

/**
 * 配置未找到错误
 */
export class ConfigNotFoundError extends OmoQuotaError {
  constructor(path: string) {
    super(ErrorCodes.CONFIG_NOT_FOUND, { path });
  }
}

/**
 * 配置加载错误
 */
export class ConfigLoadError extends OmoQuotaError {
  constructor(reason: string, cause?: Error) {
    super(ErrorCodes.CONFIG_LOAD_ERROR, { reason }, cause);
  }
}

/**
 * 配置保存错误
 */
export class ConfigSaveError extends OmoQuotaError {
  constructor(reason: string, cause?: Error) {
    super(ErrorCodes.CONFIG_SAVE_ERROR, { reason }, cause);
  }
}

/**
 * 路径访问拒绝错误
 */
export class PathAccessDeniedError extends OmoQuotaError {
  constructor(path: string) {
    super(ErrorCodes.PATH_ACCESS_DENIED, { path });
  }
}

/**
 * 无效用量错误
 */
export class InvalidUsageError extends OmoQuotaError {
  constructor(value: string) {
    super(ErrorCodes.INVALID_USAGE, { value });
  }
}

/**
 * 无效提供商错误
 */
export class InvalidProviderError extends OmoQuotaError {
  constructor(provider: string) {
    super(ErrorCodes.INVALID_PROVIDER, { provider });
  }
}

// ============================================================================
// 便捷工厂函数
// ============================================================================

/**
 * 创建策略未找到错误
 */
export function createStrategyNotFoundError(strategy: string): StrategyNotFoundError {
  return new StrategyNotFoundError(strategy);
}

/**
 * 创建策略无效错误
 */
export function createStrategyInvalidError(strategy: string): StrategyInvalidError {
  return new StrategyInvalidError(strategy);
}

/**
 * 创建策略文件未找到错误
 */
export function createStrategyFileNotFoundError(path: string): StrategyFileNotFoundError {
  return new StrategyFileNotFoundError(path);
}

/**
 * 创建追踪器未找到错误
 */
export function createTrackerNotFoundError(): TrackerNotFoundError {
  return new TrackerNotFoundError();
}

/**
 * 创建追踪器加载错误
 */
export function createTrackerLoadError(reason: string, cause?: Error): TrackerLoadError {
  return new TrackerLoadError(reason, cause);
}

/**
 * 创建追踪器保存错误
 */
export function createTrackerSaveError(reason: string, cause?: Error): TrackerSaveError {
  return new TrackerSaveError(reason, cause);
}

/**
 * 创建配置未找到错误
 */
export function createConfigNotFoundError(path: string): ConfigNotFoundError {
  return new ConfigNotFoundError(path);
}

/**
 * 创建配置加载错误
 */
export function createConfigLoadError(reason: string, cause?: Error): ConfigLoadError {
  return new ConfigLoadError(reason, cause);
}

/**
 * 创建配置保存错误
 */
export function createConfigSaveError(reason: string, cause?: Error): ConfigSaveError {
  return new ConfigSaveError(reason, cause);
}

/**
 * 创建路径访问拒绝错误
 */
export function createPathAccessDeniedError(path: string): PathAccessDeniedError {
  return new PathAccessDeniedError(path);
}

/**
 * 创建无效用量错误
 */
export function createInvalidUsageError(value: string): InvalidUsageError {
  return new InvalidUsageError(value);
}

/**
 * 创建无效提供商错误
 */
export function createInvalidProviderError(provider: string): InvalidProviderError {
  return new InvalidProviderError(provider);
}

/**
 * 检查错误是否为 OmoQuotaError
 */
export function isOmoQuotaError(error: unknown): error is OmoQuotaError {
  return error instanceof OmoQuotaError;
}

/**
 * 包装未知错误为 OmoQuotaError
 *
 * 如果错误已经是 OmoQuotaError，直接返回；
 * 否则，将其包装为 UNKNOWN_ERROR。
 */
export function wrapError(error: unknown): OmoQuotaError {
  if (isOmoQuotaError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new OmoQuotaError(
      ErrorCodes.UNKNOWN_ERROR,
      { reason: error.message },
      error
    );
  }

  return new OmoQuotaError(
    ErrorCodes.UNKNOWN_ERROR,
    { reason: String(error) }
  );
}
