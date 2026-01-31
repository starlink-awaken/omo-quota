# 策略文件自动化生成系统

## 概述

本系统为 omo-quota 提供完整的策略文件自动化生成和初始化功能，支持三种预设策略（性能型、均衡型、经济型）以及自定义策略扩展。

## 文件结构

```
src/
├── types/
│   └── strategy.ts          # 策略数据结构定义
├── data/
│   └── presets.ts           # 预设策略配置数据
├── generators/
│   └── strategy.ts          # 策略生成器
├── validators/
│   └── strategy.ts          # 策略验证器
├── managers/
│   └── migration.ts         # 策略迁移管理器
├── commands/
│   └── init-new.ts          # 增强的 init 命令
└── tests/
    └── strategy.test.ts     # 策略系统测试
```

## 核心数据结构

### StrategyConfig

完整的策略配置文件结构：

```typescript
interface StrategyConfig {
  $schema?: string;                      // JSON Schema 引用
  _metadata?: StrategyMetadata;          // 策略元数据
  description: string;                   // 策略描述
  providers?: StrategyProviders;         // 提供商回退链配置
  agents: Record<string, AgentConfig>;   // Agent 配置
  categories?: Record<string, CategoryConfig>; // 类别配置
  extensions?: Record<string, any>;      // 自定义扩展
}
```

### AgentConfig

Agent 配置结构：

```typescript
interface AgentConfig {
  model: string;                         // 主模型 (provider/model)
  variant?: 'max' | 'high' | 'medium' | 'low' | 'xhigh';
  primary_provider?: string;             // 主要提供商
  fallback_providers?: string[];         // 回退提供商链
  description?: string;                  // Agent 描述
  tags?: string[];                       // 场景标签
}
```

## 三种预设策略

### 1. 性能型 (performance)

- **成本等级**: 10/10
- **性能等级**: 10/10
- **主力模型**: Claude Opus 4.5, GPT-5.2
- **适用场景**: 关键项目、紧急任务、高质量要求

```bash
omo-quota switch performance
```

### 2. 均衡型 (balanced) - 推荐

- **成本等级**: 5/10
- **性能等级**: 8/10
- **主力模型**: GLM-4.7, Claude Sonnet 4.5
- **适用场景**: 日常开发、通用任务

```bash
omo-quota switch balanced
```

### 3. 经济型 (economical)

- **成本等级**: 1/10
- **性能等级**: 6/10
- **主力模型**: GitHub Copilot Free, Haiku, Flash
- **适用场景**: 实验项目、预算受限

```bash
omo-quota switch economical
```

## 使用方法

### 初始化

```bash
# 完整初始化（推荐首次使用）
omo-quota init

# 仅生成策略文件
bun run src/generators/strategy.ts
```

初始化命令会：
1. 创建策略目录 (`~/.config/opencode/strategies`)
2. 生成三个预设策略文件
3. 初始化配额追踪文件 (`~/.omo-quota-tracker.json`)
4. 应用默认策略（balanced）
5. 验证配置完整性

### 验证策略

```bash
# 验证当前策略
omo-quota validate-models

# 验证指定策略
omo-quota validate-models --strategy performance

# 验证所有策略
omo-quota validate-models --all
```

### 列出策略

```bash
omo-quota list
```

### 切换策略

```bash
omo-quota switch performance
omo-quota switch balanced
omo-quota switch economical
```

## 自定义策略

### 生成自定义策略

```typescript
import { StrategyGenerator } from './generators/strategy';

const generator = new StrategyGenerator('~/.config/opencode/strategies');

// 基于预设模板生成
const customStrategy = generator.generate({
  type: 'balanced',
  name: 'my-custom',
  description: '我的自定义策略',
  customAgents: {
    sisyphus: {
      model: 'openai/gpt-4o',
      description: '使用 GPT-4o 作为主力',
    },
  },
});

// 保存到文件
generator.saveToFile('my-custom.jsonc', customStrategy);
```

### 修改预设策略

编辑预设策略文件：

```bash
# 编辑均衡型策略
vim ~/.config/opencode/strategies/strategy-2-balanced.jsonc
```

修改后运行验证：

```bash
omo-quota validate-models --strategy balanced
```

## 策略验证

验证器会检查：
- 文件是否存在
- JSONC 语法是否正确
- 必需的 agents 是否配置
- 模型格式是否正确 (provider/model)
- 提供商是否支持
- 回退链是否有效
- 类别配置是否完整

### 验证错误代码

| 代码 | 说明 |
|------|------|
| FILE_NOT_FOUND | 策略文件不存在 |
| PARSE_ERROR | JSONC 解析失败 |
| MISSING_DESCRIPTION | 缺少策略描述 |
| MISSING_AGENTS | 缺少 agents 配置 |
| MISSING_REQUIRED_AGENT | 缺少必需的 agent |
| MISSING_MODEL | agent 缺少 model 配置 |
| INVALID_MODEL_FORMAT | model 格式错误 |
| UNKNOWN_PROVIDER | 未知的提供商 |
| UNKNOWN_MODEL | 提供商不支持该模型 |
| PRIMARY_PROVIDER_MISMATCH | primary_provider 与 model 不匹配 |

## 策略迁移

当策略 schema 版本更新时，系统会自动检测并迁移：

```typescript
import { StrategyMigrationManager } from './managers/migration';

const manager = new StrategyMigrationManager();

// 检测版本
const version = manager.detectVersion('/path/to/strategy.jsonc');

// 检查是否需要迁移
if (manager.needsMigration('/path/to/strategy.jsonc')) {
  // 执行迁移
  manager.migrate('/path/to/strategy.jsonc', true);
}
```

## 策略文件位置

| 文件 | 位置 |
|------|------|
| 策略目录 | `~/.config/opencode/strategies/` |
| 当前配置 | `~/.config/opencode/oh-my-opencode.jsonc` |
| 配置备份 | `~/.config/opencode/oh-my-opencode.backup.jsonc` |
| 追踪文件 | `~/.omo-quota-tracker.json` |

## 测试

```bash
# 运行策略系统测试
bun test src/tests/strategy.test.ts
```

## 设计考虑

### 策略文件存储位置

- **选择**: 用户目录 (`~/.config/opencode/strategies/`)
- **理由**:
  - 符合 XDG 配置目录规范
  - 与 oh-my-opencode 配置在同一位置
  - 便于用户自定义和修改
  - 不受项目目录影响

### 用户自定义策略

- **支持**: 完全支持
- **方法**:
  1. 直接编辑策略文件
  2. 使用生成器创建新策略
  3. 基于预设模板扩展

### 策略版本更新

- **检测**: 自动检测 `_metadata.version` 或 `$schema` 版本
- **迁移**: 使用 MigrationRule 定义版本间的转换
- **备份**: 迁移前自动备份原文件

### 策略验证

- **静态验证**: 语法检查、结构验证
- **动态验证**: 模型可用性检查（未来支持 API 调用）
- **回退链验证**: 确保回退路径有效

### 错误处理

- **init 失败**: 回滚已创建的文件
- **switch 失败**: 恢复备份配置
- **迁移失败**: 保留原文件，记录错误
- **验证失败**: 显示详细错误信息，不修改文件

## 扩展性

### 添加新的预设策略

```typescript
// src/data/presets.ts
export const customStrategy: StrategyConfig = {
  description: '自定义策略',
  agents: { /* ... */ },
  categories: { /* ... */ },
};

export const presetStrategies = {
  performance: performanceStrategy,
  balanced: balancedStrategy,
  economical: economicalStrategy,
  custom: customStrategy,  // 添加新策略
};
```

### 添加新的提供商

```typescript
// src/validators/strategy.ts
const SUPPORTED_PROVIDERS: Record<string, string[]> = {
  // ... 现有提供商
  'new-provider': ['model-1', 'model-2'],
};
```

### 添加迁移规则

```typescript
// src/managers/migration.ts
const MIGRATION_RULES: MigrationRule[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '2.0.0',
    migrate: (config) => {
      // 转换逻辑
      return newConfig;
    },
  },
];
```
