# OmoQuota 错误处理系统

## 概述

omo-quota 现在包含一个统一的错误处理系统，提供：

- 自定义错误类（`OmoQuotaError`）
- 错误码枚举（`ErrorCodes`）
- 便捷工厂函数
- 统一的错误处理器（`handleError`）
- 用户友好的错误消息
- 自动帮助信息显示

## 快速开始

### 1. 导入错误处理工具

```typescript
import {
  OmoQuotaError,
  ErrorCodes,
  createTrackerNotFoundError,
  createStrategyNotFoundError,
  handleError,
} from './utils/error-handler';
```

### 2. 抛出错误

```typescript
// 使用工厂函数（推荐）
throw createTrackerNotFoundError();

// 或使用自定义错误类
throw new OmoQuotaError(
  ErrorCodes.INVALID_USAGE,
  { value: userInput }
);

// 或使用特定错误类
throw new StrategyNotFoundError('performance');
```

### 3. 处理错误

```typescript
import { handleError } from './utils/error-handler';

try {
  // 一些可能抛出错误的代码
} catch (error) {
  handleError(error); // 自动显示错误消息并退出
}
```

## 错误码

所有错误码都定义在 `ErrorCodes` 枚举中：

| 错误码 | 类别 | 退出码 | 说明 |
|--------|------|--------|------|
| `STRATEGY_NOT_FOUND` | strategy | 1 | 策略未找到 |
| `STRATEGY_INVALID` | strategy | 1 | 策略名称无效 |
| `STRATEGY_FILE_NOT_FOUND` | strategy | 2 | 策略文件不存在 |
| `STRATEGY_PARSE_ERROR` | strategy | 2 | 策略文件解析错误 |
| `TRACKER_NOT_FOUND` | tracker | 3 | 追踪器未找到 |
| `TRACKER_LOAD_ERROR` | tracker | 3 | 追踪器加载失败 |
| `TRACKER_SAVE_ERROR` | tracker | 3 | 追踪器保存失败 |
| `CONFIG_NOT_FOUND` | config | 4 | 配置文件不存在 |
| `CONFIG_LOAD_ERROR` | config | 4 | 配置文件加载失败 |
| `CONFIG_SAVE_ERROR` | config | 4 | 配置文件保存失败 |
| `PATH_ACCESS_DENIED` | permission | 5 | 路径访问被拒绝 |
| `INVALID_USAGE` | usage | 6 | 无效的用量值 |
| `INVALID_PROVIDER` | usage | 6 | 无效的提供者 |
| `UNKNOWN_ERROR` | system | 1 | 未知错误 |

## 工厂函数

### 策略相关

```typescript
import {
  createStrategyNotFoundError,
  createStrategyInvalidError,
  createStrategyFileNotFoundError,
} from './utils/error-handler';

// 策略未找到
throw createStrategyNotFoundError('performance');

// 策略无效
throw createStrategyInvalidError('invalid-name');

// 策略文件不存在
throw createStrategyFileNotFoundError('/path/to/strategy.jsonc');
```

### 追踪器相关

```typescript
import {
  createTrackerNotFoundError,
  createTrackerLoadError,
  createTrackerSaveError,
} from './utils/error-handler';

// 追踪器不存在
throw createTrackerNotFoundError();

// 追踪器加载失败
throw createTrackerLoadError('文件格式无效', originalError);

// 追踪器保存失败
throw createTrackerSaveError('权限不足', originalError);
```

### 配置相关

```typescript
import {
  createConfigNotFoundError,
  createConfigLoadError,
  createConfigSaveError,
} from './utils/error-handler';

// 配置不存在
throw createConfigNotFoundError('/path/to/config.jsonc');

// 配置加载失败
throw createConfigLoadError('JSON 语法错误', originalError);

// 配置保存失败
throw createConfigSaveError('磁盘空间不足', originalError);
```

### 用量和提供者相关

```typescript
import {
  createInvalidUsageError,
  createInvalidProviderError,
} from './utils/error-handler';

// 无效用量
throw createInvalidUsageError('abc');

// 无效提供者
throw createInvalidProviderError('unknown-provider');
```

### 路径相关

```typescript
import { createPathAccessDeniedError } from './utils/error-handler';

// 路径访问被拒绝
throw createPathAccessDeniedError('/protected/path');
```

## 迁移指南

### Before (旧代码)

```typescript
// 直接使用 Error
throw new Error('策略不存在: performance');

// 使用 console.error 和 process.exit
if (!isValidStrategy(strategy)) {
  console.error(chalk.red.bold(`✗ 无效的策略名称: ${strategy}\n`));
  console.log(chalk.yellow.bold('💡 可用策略：\n'));
  // ... 大量帮助代码 ...
  process.exit(1);
}

// 没有错误包装
try {
  const data = JSON.parse(content);
} catch (error) {
  console.error('解析失败:', error);
  process.exit(1);
}
```

### After (新代码)

```typescript
// 使用工厂函数
throw createStrategyNotFoundError('performance');

// 使用 wrapCommand 自动处理
import { wrapCommand } from './utils/error-handler';

program
  .command('switch <strategy>')
  .action(wrapCommand(switchStrategy));

// 在函数中直接抛出错误
export function switchStrategy(strategy: string): void {
  if (!isValidStrategy(strategy)) {
    throw createStrategyInvalidError(strategy);
  }
  // 帮助信息会自动显示
}
```

## 完整示例

### 命令函数

```typescript
import { loadTracker } from './utils/tracker';
import { createTrackerNotFoundError, createInvalidProviderError } from './utils/error-handler';

export function updateProvider(provider: string, usage: number): void {
  const tracker = loadTracker();

  if (!tracker) {
    throw createTrackerNotFoundError();
  }

  if (!tracker.providers[provider]) {
    throw createInvalidProviderError(provider);
  }

  tracker.providers[provider].usage = usage;
  saveTracker(tracker);
}
```

### 使用 wrapCommand

```typescript
import { wrapCommand } from './utils/error-handler';

program
  .command('update <provider> <usage>')
  .description('更新资源用量')
  .action(wrapCommand(updateProvider));

// 现在不需要 try-catch，错误会自动处理
```

### 自定义错误

```typescript
import { OmoQuotaError, ErrorCodes } from './utils/error-handler';

export class CustomBusinessError extends OmoQuotaError {
  constructor(resourceId: string, reason: string) {
    super(ErrorCodes.UNKNOWN_ERROR, {
      reason: `资源 ${resourceId}: ${reason}`,
    });
  }
}

// 使用
throw new CustomBusinessError('user-123', '超出配额限制');
```

## 高级用法

### 安全执行（不退出）

```typescript
import { safeExecute } from './utils/error-handler';

const result = await safeExecute(
  async () => {
    return await fetchData();
  },
  '获取数据',
  { fallback: null, exit: false }
);

if (result === null) {
  console.log('使用默认值');
}
```

### 同步安全执行

```typescript
import { safeExecuteSync } from './utils/error-handler';

const config = safeExecuteSync(
  () => JSON.parse(configContent),
  '解析配置',
  { fallback: defaultConfig, exit: false }
);
```

### 自定义错误详情

```typescript
throw new OmoQuotaError(
  ErrorCodes.INVALID_DATA_FORMAT,
  {
    field: 'email',
    value: userInput,
    expected: 'valid email address',
  }
);
```

## 错误输出示例

### 策略未找到

```
❌ 错误: 未找到策略: unknown-strategy

💡 可用策略：

  • performance - 极致性能型 (关键任务、紧急项目)
  • balanced - 均衡实用型 (日常开发、推荐) ⭐
  • economical - 极致省钱型 (实验项目、预算受限)

使用 "omo-quota list" 查看所有策略详情
切换命令: omo-quota switch <策略名称>
```

### 追踪器未找到

```
📊 错误: 配额追踪文件不存在，请先运行: omo-quota init

💡 请先初始化 omo-quota：

  omo-quota init

这将创建配额追踪文件并生成策略模板。
```

### 详细模式

```bash
omo-quota switch unknown --verbose
```

输出：

```
❌ 错误: 未找到策略: unknown-strategy

详细信息:
  strategy: unknown-strategy
  timestamp: 2025-01-31T10:30:00.000Z

💡 可用策略：
  ...
```

## 最佳实践

1. **使用工厂函数**：工厂函数提供预设的错误消息和帮助信息
2. **包装命令**：使用 `wrapCommand` 避免在每个命令中写 try-catch
3. **提供上下文**：在 `details` 中包含有用的调试信息
4. **保持向后兼容**：现有代码可以继续使用 `console.error` 和 `process.exit`
5. **使用特定错误类**：优先使用 `StrategyNotFoundError` 等特定类而不是通用 `OmoQuotaError`

## 向后兼容性

- 现有代码不需要立即更改
- `console.error` 和 `process.exit` 仍然有效
- 全局错误处理器会捕获未处理的异常
- 逐步迁移，一次一个命令

## 故障排除

### 错误信息没有颜色

确保你的终端支持颜色，并且没有设置 `NO_COLOR` 环境变量。

### 帮助信息没有显示

检查 `error.showHelp` 属性，某些错误默认不显示帮助。

### 自定义错误没有被正确处理

确保你的错误继承自 `OmoQuotaError`，或者使用 `wrapError()` 包装：
```typescript
import { wrapError } from './utils/error-handler';

throw wrapError(originalError);
```
