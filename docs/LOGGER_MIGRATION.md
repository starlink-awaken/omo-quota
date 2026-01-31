# Logger 迁移指南

本文档说明如何将现有的 `console.log` 调用迁移到统一的 logger 系统。

---

## 概述

omo-quota 现在使用统一的 logger 系统，位于 `src/utils/logger.ts`。该系统提供:

- **日志级别控制**: debug, info, warn, error, silent
- **环境变量支持**: 通过 `OMO_QUOTA_LOG_LEVEL` 设置默认级别
- **彩色输出**: 使用 chalk 进行颜色高亮（当可用时）
- **单例模式**: 通过 `logger` 实例全局访问
- **上下文日志**: 使用 `createLogger()` 创建带前缀的专用日志记录器

---

## 快速开始

### 基本用法

```typescript
// 导入 logger
import { logger } from './index';

// 替换 console.log
logger.info('Application started');

// 替换 console.error
logger.error('Something went wrong:', error);

// 替换 console.warn
logger.warn('Deprecated feature used');

// 调试信息（仅在 debug 模式显示）
logger.debug('Variable value:', variable);
```

---

## 迁移对照表

### 1. 信息日志

**Before:**
```typescript
console.log('Processing file:', filename);
console.log('[INFO]', 'User logged in');
```

**After:**
```typescript
import { logger } from './index';

logger.info('Processing file:', filename);
logger.info('User logged in');
```

---

### 2. 错误日志

**Before:**
```typescript
console.error('Failed to load config');
console.error('[ERROR]', 'Connection failed:', error);
```

**After:**
```typescript
import { logger } from './index';

logger.error('Failed to load config');
logger.error('Connection failed:', error);
```

---

### 3. 警告日志

**Before:**
```typescript
console.warn('Deprecated API usage');
console.warn('[WARN]', 'Rate limit approaching');
```

**After:**
```typescript
import { logger } from './index';

logger.warn('Deprecated API usage');
logger.warn('Rate limit approaching');
```

---

### 4. 调试日志

**Before:**
```typescript
if (verbose) {
  console.log('Debug info:', data);
}
console.log('[DEBUG]', 'Processing step', step);
```

**After:**
```typescript
import { logger } from './index';

// Logger 自动处理级别过滤
logger.debug('Debug info:', data);
logger.debug('Processing step', step);
```

---

## 高级用法

### 上下文专用日志记录器

为特定模块创建带前缀的日志记录器:

```typescript
import { createLogger } from './utils/logger';

const syncLogger = createLogger({
  prefix: 'SYNC',
  level: 'info',
  timestamp: true,
});

syncLogger.info('Starting sync...');
// 输出: [INFO] [SYNC] Starting sync...
```

### 动态级别控制

```typescript
import { logger } from './index';

// 运行时更改日志级别
logger.setLevel('debug');  // 启用详细日志
logger.setLevel('error');  // 仅显示错误
logger.setLevel('silent'); // 完全静默

// 禁用彩色输出（用于 CI/CD）
logger.setColorize(false);
```

### 环境变量配置

在 `.env` 文件或 shell 中设置:

```bash
# 设置默认日志级别
export OMO_QUOTA_LOG_LEVEL=debug

# 在 package.json 中使用
"scripts": {
  "dev": "OMO_QUOTA_LOG_LEVEL=debug bun run src/index.ts",
  "prod": "OMO_QUOTA_LOG_LEVEL=warn bun run src/index.ts"
}
```

---

## 完整迁移示例

### Before (使用 console):

```typescript
// src/commands/sync.ts
export function syncQuota() {
  console.log('[INFO]', 'Starting quota sync...');
  try {
    const data = fetchData();
    console.log('[DEBUG]', 'Fetched data:', data);
    processData(data);
  } catch (error) {
    console.error('[ERROR]', 'Sync failed:', error);
  }
}
```

### After (使用 logger):

```typescript
// src/commands/sync.ts
import { logger } from '../index';

export function syncQuota() {
  logger.info('Starting quota sync...');
  try {
    const data = fetchData();
    logger.debug('Fetched data:', data);
    processData(data);
  } catch (error) {
    logger.error('Sync failed:', error);
  }
}
```

---

## 命令行选项

omo-quota CLI 提供了日志控制选项:

```bash
# 启用详细日志（等同于 --log debug）
omo-quota status --verbose

# 设置特定日志级别
omo-quota status --log debug
omo-quota status --log warn
omo-quota status --log error

# 静默模式（仅错误）
omo-quota status --silent
```

---

## 类型定义

```typescript
// 日志级别
import { LogLevel } from './index';

// 接口
import type { ILogger, LoggerConfig } from './index';

// 创建配置化记录器
const config: LoggerConfig = {
  level: LogLevel.DEBUG,
  colorize: true,
  prefix: 'MY_MODULE',
  timestamp: true,
};
```

---

## 最佳实践

1. **使用适当的级别**:
   - `debug`: 开发诊断信息
   - `info`: 一般信息（默认）
   - `warn`: 警告，但不需要用户操作
   - `error`: 错误，需要关注

2. **避免日志污染**:
   ```typescript
   // 不推荐 - 频繁的调试日志
   for (const item of largeArray) {
     logger.debug('Processing:', item);  // 可能产生大量输出
   }

   // 推荐 - 使用更高级别的汇总
   logger.info(`Processing ${largeArray.length} items`);
   ```

3. **错误处理**:
   ```typescript
   // 推荐 - 包含上下文
   logger.error('Failed to load config:', {
     path: configPath,
     error: error.message,
   });
   ```

4. **生产环境**:
   ```typescript
   // 推荐 - 生产环境使用 warn 级别
   const isProd = process.env.NODE_ENV === 'production';
   logger.setLevel(isProd ? 'warn' : 'info');
   ```

---

## 常见问题

### Q: 如何完全禁用日志？
```typescript
logger.setLevel('silent');
```

### Q: 如何为测试禁用颜色？
```typescript
if (process.env.NODE_ENV === 'test') {
  logger.setColorize(false);
}
```

### Q: Logger 是线程安全的吗？
Bun 是单线程的，所以 logger 是安全的。但如果你使用 workers，每个 worker 需要自己的 logger 实例。

---

## API 参考

### `logger`
全局单例日志记录器实例。

**方法:**
- `setLevel(level: LogLevelName): void` - 设置日志级别
- `getLevel(): LogLevel` - 获取当前日志级别
- `setColorize(enabled: boolean): void` - 启用/禁用颜色
- `debug(...args: unknown[]): void` - 调试日志
- `info(...args: unknown[]): void` - 信息日志
- `warn(...args: unknown[]): void` - 警告日志
- `error(...args: unknown[]): void` - 错误日志

### `createLogger(config: Partial<LoggerConfig> & { prefix: string }): Logger`
创建带有前缀的新日志记录器实例。

**配置选项:**
- `level: LogLevel` - 最小日志级别
- `colorize: boolean` - 启用彩色输出
- `prefix: string` - 所有消息的前缀
- `timestamp: boolean` - 包含时间戳
- `output: Console` - 自定义输出流

---

## 迁移检查清单

- [ ] 导入 `logger` 从 `./index` 或 `../index`
- [ ] 替换 `console.log` 为 `logger.info`
- [ ] 替换 `console.error` 为 `logger.error`
- [ ] 替换 `console.warn` 为 `logger.warn`
- [ ] 添加 `logger.debug` 用于开发调试
- [ ] 移除手动的级别检查逻辑（logger 自动处理）
- [ ] 测试不同日志级别下的输出
