# OMO QUOTA - Oh-My-OpenCode 配额管理 CLI 工具

专为 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) 用户设计的智能配额追踪、策略切换和成本分析工具。

## 功能概述

- 🔄 **策略切换**: 在三种预设策略间快速切换（极致性能、均衡实用、经济节约）
- 📊 **配额追踪**: 实时追踪所有 AI 资源的使用量
- 🔄 **自动同步**: 从 oh-my-opencode 消息历史自动同步使用记录
- 📈 **成本分析**: 生成每日/每月成本报告，识别优化机会
- 🌐 **Web 仪表盘**: 实时配额监控界面
- ✅ **健康检查**: 验证配置文件有效性
- 🎯 **模型验证**: 验证策略文件中的模型配置和回退链

## 核心命令

| 命令 | 功能 | 说明 |
|------|------|------|
| `omo-quota init` | 初始化配额追踪文件 |
| `omo-quota status` | 显示所有资源的当前状态 |
| `omo-quota list` | 列出所有可用的配置策略 |
| `omo-quota switch <strategy>` | 切换配置策略 |
| `omo-quota reset <provider>` | 手动标记资源已重置 |
| `omo-quota update <provider> <usage>` | 更新资源用量 |
| `omo-quota sync` | 同步 oh-my-opencode 使用记录到配额追踪器 |
| `omo-quota report <period>` | 生成成本分析报告（daily/monthly） |
| `omo-quota dashboard` | 启动 Web 仪表盘 |
| `omo-quota watch` | 监控配额状态并自动预警 |
| `omo-quota doctor` | 验证配置文件和策略 |
| `omo-quota validate-models [command] [strategy]` | 验证模型配置和回退链 |

## 快速开始

```bash
# 安装依赖
cd ~/Workspace/Tools/omo-quota
bun install

# 初始化配额追踪
bun run src/index.ts init

# 查看当前状态
bun run src/index.ts status

# 切换到推荐策略（均衡实用）
bun run src/index.ts switch balanced

# 验证配置
bun run src/index.ts doctor

# 查看策略回退链
bun run src/index.ts list
```

## 策略说明

### Strategy 1: Performance（极致性能）

**适用场景**:
- 🚨 生产环境紧急修复
- 🏗️ 关键功能开发
- 🎯 客户演示准备

**模型分配**:
- Sisyphus: `antigravity/claude-opus-4.5`（主协调器，思考模式）
- Oracle: `openai/gpt-4.1`（调式专家）
- Prometheus: `antigravity/claude-opus-4.5`（规划器，深度思考）
- Librarian: `anthropic/claude-sonnet-4.5`（文档搜索）
- Explore: `anthropic/claude-sonnet-4.5`（代码探索）
- 其他代理使用顶级模型

**预估成本**: ¥200-300/天（中度使用）
- ⚠️ Claude Pro 配额消耗快（约1小时/100次调用）

### Strategy 2: Balanced（均衡实用）⭐ **推荐**

**适用场景**:
- 💼 **日常开发工作**（80%+ 场景）
- 🔧 **中等复杂度项目**
- 🔄 **持续迭代开发**（长期项目，需要平衡成本和效率）
- 🎨 **学习探索**（新技术，需要多次试错）

**模型分配**:
- Sisyphus: `zhipuai/glm-4.7`（主力，60% 用量）
- Oracle: `google/gemini-2.0-flash-thinking-exp:antigravity`（调式专家，仅关键决策）
- Prometheus: `zhipuai/glm-4.7`（规划器）
- Librarian: `google/gemini-2.0-flash-thinking-exp`（文档搜索，Gemini 长信息检索）
- Explore: `github-copilot/gpt-4o`（免费，高频轻量）
- 其他代理使用高性价比资源

**预估成本**: ¥100-150/天（中轻度使用）
- ✅ 高性价比，性能优秀

### Strategy 3: Economical（经济节约）

**适用场景**:
- 🧑‍🎓 **个人学习项目**
- 🧪 **实验性开发**（尝试新技术）
- 💰 **预算受限**（严格控制 AI 支出）
- 🆓 **非关键任务**（质量要求不高）

**模型分配**:
- Sisyphus: `github-copilot-free/gpt-4o`（免费主力，无限额）
- Oracle: `zhipuai/glm-4.7`（不使用顶级模型）
- Prometheus: `github-copilot-free/gpt-5-mini`（免费模型）
- Librarian: `github-copilot-free/gpt-4o`（免费，高质量）
- Explore: `github-copilot-free/gpt-4o`（免费）

**预估成本**: ¥5-20/天（轻度使用）
- ✅ 成本极低，质量足够

## Oh-My-OpenCode Fallback 机制

oh-my-opencode 内置了完整的 fallback 机制，当主模型不可用时，系统会按顺序尝试备用提供商。

**回退链示例**（Balanced 策略）:

```
Sisyphus 主模型: zhipuai/glm-4.7 不可用 → 
  ↓ 尝试: openai/gpt-4o
  ↓ 尝试: github-copilot/gpt-4o
  ↓ 尝试: antigravity/claude-sonnet-4.5
  ↓ 失败: 报错
```

降级顺序由策略文件中的 `providers` 配置控制。

**新增功能**: `omo-quota validate-models [command] [strategy]`

验证策略文件中的模型配置：
- ✅ 检查所有 agent 的模型配置
- ✅ 验证 providers 回退链是否完整
- ✅ 验证 fallback_providers 是否在 providers 列表中
- ✅ 验证 primary_provider 是否有效
- ✅ 预览完整的 fallback 路径

**使用示例**:
```bash
# 验证 balanced 策略
omo-quota validate-models -s balanced

# 查看完整的模型层级和回退链
omo-quota list
```

## 配额文件路径

| 文件 | 路径 |
|------|------|------|
| `~/.omo-quota-tracker.json` | 配额追踪数据 |
| `~/.config/opencode/oh-my-opencode.jsonc` | 当前生效的配置 |
| `~/.config/opencode/oh-my-opencode.backup.jsonc` | 配置备份 |
| `~/.config/opencode/strategies/strategy-1-performance.jsonc` | 性能策略 |
| `~/.config/opencode/strategies/strategy-2-balanced.jsonc` | 均衡策略 ⭐ |
| `~/.config/opencode/strategies/strategy-3-economical.jsonc` | 经济策略 |

## 最佳实践

### 1. 定期监控配额

```bash
# 每天工作开始前
omo-quota sync    # 同步最新使用记录
omo-quota status    # 查看当前状态
```

### 2. 智能策略调整

```bash
# 月初: 使用 balanced 策略
omo-quota switch balanced

# 遇到月底: 切换到 economical（避免超支）
omo-quota reset claude-pro    # 重置 Claude 配额后
omo-quota switch balanced    # 恢复
```

### 3. 关键项目用性能模式

```bash
# 紧急任务期间
omo-quota switch performance

# 完成后恢复
omo-quota switch balanced
```

### 4. 项目级配置

对于特定重要项目，可创建项目级配置：

```bash
# 在项目根目录
mkdir -p .opencode

# 使用性能模式（不影响全局配置）
cp ~/.config/opencode/strategies/strategy-1-performance.jsonc .opencode/oh-my-opencode.jsonc
```

## 故障排查

### 问题: 切换后模型仍然使用旧配置

**解决方案**:
```bash
# 重启 OpenCode 或重新加载配置
# 查看当前策略
omo-quota status
```

### 问题: 某个模型频繁失败

**排查步骤**:
1. 查看 oh-my-opencode 日志
   ```bash
   tail -f ~/.opencode/logs/*.log
   ```

2. 使用 doctor 命令检查配置
   ```bash
   omo-quota doctor --verbose
   ```

## 技术支持

**Bun 运行时**:
- 支持 TypeScript 直接执行（无需编译）
- 支持 .env 环境变量自动加载

**配置格式**:
- oh-my-opencode 支持 JSONC 格式（带注释）

**更多信息**:
- [oh-my-opencode 文档](https://github.com/code-yeongyu/oh-my-opencode)
- [omo-quota 源码](https://github.com/xiamingxing/omo-quota)

## 许可证

MIT License

---

**快速开始**
```bash
cd ~/Workspace/Tools/omo-quota
bun install
bun run src/index.ts init
bun run src/index.ts status
```