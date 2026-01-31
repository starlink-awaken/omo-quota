# 策略文件自动化生成系统 - 快速参考

## 一句话总结

完整的策略文件自动化生成和初始化系统，支持三种预设策略和自定义扩展。

## 核心组件

| 组件 | 文件 | 功能 |
|------|------|------|
| 类型定义 | `src/types/strategy.ts` | 策略数据结构接口 |
| 预设策略 | `src/data/presets.ts` | 三种预设策略配置 |
| 策略生成器 | `src/generators/strategy.ts` | 生成策略文件 |
| 策略验证器 | `src/validators/strategy.ts` | 验证策略有效性 |
| 迁移管理器 | `src/managers/migration.ts` | 版本管理和迁移 |
| Init 命令 | `src/commands/init-new.ts` | 增强的初始化命令 |
| 测试文件 | `src/tests/strategy.test.ts` | 完整测试套件 |

## 三种预设策略

| 策略 | 成本 | 性能 | 主力模型 | 适用场景 |
|------|------|------|----------|----------|
| **performance** | 10/10 | 10/10 | Claude Opus, GPT-5.2 | 关键项目 |
| **balanced** | 5/10 | 8/10 | GLM-4.7, Sonnet | 日常开发 |
| **economical** | 1/10 | 6/10 | Copilot Free, Haiku | 实验项目 |

## 常用命令

```bash
# 初始化
omo-quota init

# 列出策略
omo-quota list

# 切换策略
omo-quota switch performance
omo-quota switch balanced
omo-quota switch economical

# 验证模型
omo-quota validate-models
omo-quota validate-models --strategy balanced
omo-quota validate-models --all

# 查看状态
omo-quota status
```

## 策略文件位置

```
~/.config/opencode/strategies/
├── strategy-1-performance.jsonc   # 性能型
├── strategy-2-balanced.jsonc      # 均衡型
└── strategy-3-economical.jsonc    # 经济型
```

## 自定义策略

```typescript
import { StrategyGenerator } from './generators/strategy';

const generator = new StrategyGenerator('~/.config/opencode/strategies');
const strategy = generator.generate({
  type: 'balanced',
  name: 'my-custom',
  customAgents: {
    sisyphus: { model: 'openai/gpt-4o' },
  },
});
generator.saveToFile('my-custom.jsonc', strategy);
```

## 测试

```bash
bun test src/tests/strategy.test.ts
```

## 设计决策

| 问题 | 决策 | 理由 |
|------|------|------|
| 存储位置 | 用户目录 `~/.config/opencode/strategies/` | XDG 规范，便于用户修改 |
| 自定义策略 | 完全支持 | 可编辑文件或使用生成器 |
| 版本管理 | 自动检测和迁移 | `_metadata.version` 字段 |
| 验证方式 | 静态验证 + 回退链检查 | 确保配置有效性 |
| 错误处理 | 自动备份和回滚 | 保证系统稳定性 |

## 验证错误代码

- `FILE_NOT_FOUND` - 策略文件不存在
- `PARSE_ERROR` - JSONC 解析失败
- `MISSING_MODEL` - 缺少 model 配置
- `INVALID_MODEL_FORMAT` - model 格式错误
- `UNKNOWN_PROVIDER` - 未知的提供商
- `UNKNOWN_MODEL` - 不支持的模型
- `MISSING_REQUIRED_AGENT` - 缺少必需的 agent

## 状态

- [x] 类型定义完成
- [x] 预设策略完成
- [x] 策略生成器完成
- [x] 策略验证器完成
- [x] 迁移管理器完成
- [x] Init 命令增强完成
- [x] 测试套件完成
- [x] 文档完成

## 测试结果

```
19 pass
0 fail
```
