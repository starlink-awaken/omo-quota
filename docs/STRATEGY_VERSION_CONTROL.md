# omo-quota策略文件版本控制与更新方案

## 概述

本文档描述了omo-quota策略文件的版本控制机制、更新策略和自动化生成方案。

## 配置文件格式

### oh-my-opencode配置格式分析

基于对[oh-my-opencode官方文档](https://github.com/code-yeongyu/oh-my-opencode)的分析，配置文件支持以下结构：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "description": "策略描述",
  "providers": {
    // Provider回退链配置
    "provider-name": ["model-1", "model-2", "model-3"]
  },
  "agents": {
    "agent-name": {
      "model": "provider/model-name",
      "temperature": 0.3,
      "variant": "high|max|xhigh",
      "primary_provider": "provider-name",
      "fallback_providers": ["provider/model-1", "provider/model-2"]
    }
  },
  "categories": {
    "category-name": {
      "model": "provider/model-name",
      "temperature": 0.5
    }
  },
  "metadata": {
    "version": "1.0.0",
    "created": "2026-01-30T15:13:24.532Z",
    "cost_level": "medium",
    "use_case": "日常开发工作"
  }
}
```

### 配置文件路径

| 文件 | 路径 |
|------|------|
| 当前配置 | `~/.config/opencode/oh-my-opencode.jsonc` |
| 策略目录 | `~/.config/opencode/strategies/` |
| 备份配置 | `~/.config/opencode/oh-my-opencode.backup.jsonc` |
| 性能策略 | `~/.config/opencode/strategies/strategy-1-performance.jsonc` |
| 均衡策略 | `~/.config/opencode/strategies/strategy-2-balanced.jsonc` |
| 经济策略 | `~/.config/opencode/strategies/strategy-3-economical.jsonc` |

## 三种策略配置

### Strategy 1: Performance (极致性能)

**适用场景**:
- 生产环境紧急修复
- 关键功能开发
- 客户演示准备

**预估成本**: ¥200-300/天

**核心配置**:
```jsonc
{
  "agents": {
    "Sisyphus": {
      "model": "antigravity/claude-opus-4-5",
      "fallback_providers": [
        "github-copilot/claude-opus-4-5",
        "anthropic/claude-opus-4-5"
      ]
    },
    "oracle": {
      "model": "openai/gpt-4.1",
      "fallback_providers": [
        "anthropic/claude-opus-4-5",
        "google/gemini-2.0-flash-thinking-exp"
      ]
    }
  }
}
```

### Strategy 2: Balanced (均衡实用) ⭐推荐

**适用场景**:
- 日常开发工作 (80%+ 场景)
- 中等复杂度项目
- 持续迭代开发

**预估成本**: ¥100-150/天

**核心配置**:
```jsonc
{
  "agents": {
    "Sisyphus": {
      "model": "zhipuai-coding-plan/glm-4.7",
      "fallback_providers": [
        "openai/gpt-4o",
        "github-copilot/gpt-4o",
        "antigravity/claude-sonnet-4-5"
      ]
    },
    "oracle": {
      "model": "google/gemini-2.0-flash-thinking-exp:antigravity",
      "fallback_providers": [
        "openai/gpt-4o",
        "zhipuai-coding-plan/glm-4.7"
      ]
    }
  }
}
```

### Strategy 3: Economical (经济节约)

**适用场景**:
- 个人学习项目
- 实验性开发
- 预算受限

**预估成本**: ¥5-20/天

**核心配置**:
```jsonc
{
  "agents": {
    "Sisyphus": {
      "model": "github-copilot-free/gpt-4o",
      "fallback_providers": [
        "zhipuai-coding-plan/glm-4.7",
        "openai/gpt-4o-mini"
      ]
    },
    "oracle": {
      "model": "zhipuai-coding-plan/glm-4.7",
      "fallback_providers": [
        "github-copilot-free/gpt-4o"
      ]
    }
  }
}
```

## Fallback回退机制

### oh-my-opencode的3步解析流程

1. **User Override** - 用户在配置中指定的模型优先使用
2. **Provider Priority Fallback** - 按provider优先级顺序尝试
3. **System Default** - 回退到系统默认模型

### Provider回退链示例

```
Sisyphus (Balanced策略):
  主模型: zhipuai-coding-plan/glm-4.7
  ↓ 不可用时
  尝试: openai/gpt-4o
  ↓ 不可用时
  尝试: github-copilot/gpt-4o
  ↓ 不可用时
  尝试: antigravity/claude-sonnet-4-5
  ↓ 失败
  报错
```

## 自动化生成方案

### 策略文件生成器

位置: `src/generate-strategies.ts`

**使用方法**:
```bash
# 生成所有策略
bun run src/generate-strategies.ts

# 只生成特定策略
bun run src/generate-strategies.ts -s balanced

# 生成到自定义目录
bun run src/generate-strategies.ts -o /tmp/strategies

# 详细输出
bun run src/generate-strategies.ts --verbose
```

**命令选项**:
| 选项 | 简写 | 说明 |
|------|------|------|
| `--output` | `-o` | 输出目录 (默认: ~/.config/opencode/strategies) |
| `--strategy` | `-s` | 要生成的策略，逗号分隔 (默认: performance,balanced,economical) |
| `--verbose` | `-v` | 详细输出 |
| `--help` | `-h` | 显示帮助信息 |

## 版本控制机制

### 策略文件版本

每个策略文件包含`metadata`字段:

```jsonc
{
  "metadata": {
    "version": "1.0.0",
    "created": "2026-01-30T15:13:24.532Z",
    "cost_level": "medium",
    "use_case": "日常开发工作"
  }
}
```

### 版本号规则

采用[语义化版本](https://semver.org/):

- **MAJOR** (主版本): 策略结构重大变更，不向后兼容
- **MINOR** (次版本): 新增agent或category，向后兼容
- **PATCH** (修订版): 模型名称调整，bug修复

示例:
- `1.0.0` - 初始版本
- `1.1.0` - 新增Metis agent
- `1.1.1` - 修正temperature值
- `2.0.0` - 策略结构重构

### 更新策略

#### 自动检测更新

```bash
# 检查是否有新版本的策略定义
omo-quota check-updates
```

#### 手动更新策略文件

```bash
# 重新生成策略文件
bun run src/generate-strategies.ts

# 验证更新后的配置
omo-quota validate-models -s balanced
```

#### 切换到更新后的策略

```bash
# 切换策略（会自动创建备份）
omo-quota switch balanced
```

## 配置验证

### 验证命令

```bash
# 验证特定策略
omo-quota validate-models -s balanced

# 验证当前策略
omo-quota validate-models

# 验证所有策略
omo-quota doctor
```

### 验证项目

- ✅ 策略文件存在性
- ✅ JSONC语法正确性
- ✅ providers回退链配置
- ✅ agents模型配置
- ✅ fallback_providers有效性
- ✅ primary_provider配置

## 备份与恢复

### 自动备份

切换策略时自动创建备份:
```bash
omo-quota switch balanced
# 自动备份到 ~/.config/opencode/oh-my-opencode.backup.jsonc
```

### 手动备份

```bash
# 备份当前配置
cp ~/.config/opencode/oh-my-opencode.jsonc ~/.config/opencode/backup-$(date +%Y%m%d).jsonc
```

### 恢复备份

```bash
# 恢复最近的备份
cp ~/.config/opencode/oh-my-opencode.backup.jsonc ~/.config/opencode/oh-my-opencode.jsonc
```

## 配置同步

### 同步到项目级配置

```bash
# 复制策略到项目目录
cp ~/.config/opencode/strategies/strategy-2-balanced.jsonc .opencode/oh-my-opencode.jsonc
```

### 项目级配置优先级

oh-my-opencode配置加载顺序:
1. `.opencode/oh-my-opencode.jsonc` (项目级，最高优先级)
2. `~/.config/opencode/oh-my-opencode.jsonc` (用户级)
3. 系统默认配置

## 故障排查

### 问题: 策略文件未生效

**解决方案**:
```bash
# 1. 检查文件是否存在
ls -la ~/.config/opencode/strategies/

# 2. 验证JSONC语法
cat ~/.config/opencode/strategies/strategy-2-balanced.jsonc | bun x jsonc-parser

# 3. 重新生成策略文件
bun run src/generate-strategies.ts
```

### 问题: 模型不可用

**解决方案**:
```bash
# 1. 检查provider认证状态
opencode auth list

# 2. 验证fallback链
omo-quota validate-models -s balanced

# 3. 查看可用模型
opencode models
```

## 参考资源

- [oh-my-opencode配置文档](https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/configurations.md)
- [oh-my-opencode安装指南](https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/guide/installation.md)
- [JSON Schema](https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json)
