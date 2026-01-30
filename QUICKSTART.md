# omo-quota 快速开始

## 一分钟上手

```bash
# 1. 初始化追踪文件
bun run ~/Workspace/Tools/omo-quota/src/index.ts init

# 2. 查看资源状态
bun run ~/Workspace/Tools/omo-quota/src/index.ts status

# 3. 切换策略（可选）
bun run ~/Workspace/Tools/omo-quota/src/index.ts switch balanced
```

## 常用命令速查

### 查看帮助
```bash
bun run ~/Workspace/Tools/omo-quota/src/index.ts --help
bun run ~/Workspace/Tools/omo-quota/src/index.ts status --help
```

### 管理配额重置
```bash
# 标记单个资源已重置
bun run ~/Workspace/Tools/omo-quota/src/index.ts reset anthropic

# 标记所有 5 小时资源已重置
bun run ~/Workspace/Tools/omo-quota/src/index.ts reset all
```

### 更新月度用量
```bash
# 更新 Github Copilot Premium 用量
bun run ~/Workspace/Tools/omo-quota/src/index.ts update github-copilot-premium 150
```

### 切换策略
```bash
# 性能优先（成本较高）
bun run ~/Workspace/Tools/omo-quota/src/index.ts switch performance

# 均衡模式（推荐）
bun run ~/Workspace/Tools/omo-quota/src/index.ts switch balanced

# 省钱模式（性能一般）
bun run ~/Workspace/Tools/omo-quota/src/index.ts switch economical
```

### 验证配置
```bash
# 检查所有配置文件
bun run ~/Workspace/Tools/omo-quota/src/index.ts doctor
```

## 创建别名（可选）

为了简化命令，可以在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
alias oq='bun run ~/Workspace/Tools/omo-quota/src/index.ts'
```

然后就可以这样使用：

```bash
oq status
oq switch balanced
oq reset all
```

## 自动化场景

### 定期检查资源状态

创建一个简单的脚本 `~/check-quota.sh`:

```bash
#!/bin/bash
bun run ~/Workspace/Tools/omo-quota/src/index.ts status
```

添加到 cron 或 launchd 定时执行。

### 工作流集成

```bash
# 在启动开发环境前检查配额
bun run ~/Workspace/Tools/omo-quota/src/index.ts status && code .

# 切换到省钱模式后再长时间任务
bun run ~/Workspace/Tools/omo-quota/src/index.ts switch economical && npm run build
```

## 故障排查

### 问题：追踪文件不存在

```bash
# 解决：重新初始化
bun run ~/Workspace/Tools/omo-quota/src/index.ts init
```

### 问题：策略文件找不到

```bash
# 解决：运行 doctor 检查
bun run ~/Workspace/Tools/omo-quota/src/index.ts doctor
```

### 问题：时间显示不准确

追踪文件中的时间是手动管理的，需要在资源重置后运行：

```bash
bun run ~/Workspace/Tools/omo-quota/src/index.ts reset <provider>
```

## 进阶使用

### 查看原始追踪数据

```bash
cat ~/.omo-quota-tracker.json | jq
```

### 备份追踪文件

```bash
cp ~/.omo-quota-tracker.json ~/.omo-quota-tracker.backup.json
```

### 手动编辑追踪文件

```bash
# 使用你喜欢的编辑器
vim ~/.omo-quota-tracker.json
code ~/.omo-quota-tracker.json
```

编辑后验证格式：

```bash
cat ~/.omo-quota-tracker.json | jq . > /dev/null && echo "格式正确"
```

## 提供者 ID 参考

### 5 小时重置资源
- `anthropic` - Claude Pro
- `google-1` - Gemini Pro #1
- `google-2` - Gemini Pro #2
- `zhipuai` - ZhiPuAI Max

### 月度资源
- `github-copilot-premium` - Github Copilot Premium

### 余额资源
- `deepseek` - DeepSeek
- `siliconflow` - 硅基流动
- `openrouter` - Openrouter

## 策略说明

### performance（极致性能型）
- 优先使用最强大的模型
- 成本较高
- 适合：复杂任务、生产环境

### balanced（均衡实用型，推荐）
- 性能和成本平衡
- 大多数场景适用
- 适合：日常开发

### economical（极致省钱型）
- 优先使用免费/便宜的模型
- 成本最低
- 适合：简单任务、学习测试
