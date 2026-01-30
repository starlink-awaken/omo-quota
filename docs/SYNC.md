# 自动同步使用量指南

## 概述

`omo-quota sync` 命令从 oh-my-opencode 的消息历史自动提取 API 使用量,并更新配额追踪文件。这是最准确的配额追踪方式,因为它直接读取实际的 AI 对话记录。

## 工作原理

### 数据源

oh-my-opencode 将所有 AI 对话保存在:
```
~/.local/share/opencode/storage/message/
├── ses_xxx/               # 会话目录
│   ├── msg_001.json       # 消息文件
│   ├── msg_002.json
│   └── ...
└── ses_yyy/
    └── ...
```

每个消息文件包含:
- `provider` - 提供商名称 (openai, anthropic, google 等)
- `model` - 使用的模型名称
- `usage` - Token 使用量统计
  - `promptTokens` - 输入 Token 数
  - `completionTokens` - 输出 Token 数
  - `cacheReadTokens` - 缓存读取 Token (可选)
  - `cacheWriteTokens` - 缓存写入 Token (可选)

### 扫描流程

```
1. 扫描 ~/.local/share/opencode/storage/message/
   ↓
2. 遍历所有会话目录 (ses_*)
   ↓
3. 读取每个消息文件 (msg_*.json)
   ↓
4. 提取 provider, model, usage 信息
   ↓
5. 根据定价表计算成本
   ↓
6. 按提供商聚合数据
   ↓
7. 更新 ~/.omo-quota-tracker.json
```

### 定价计算

内置定价表 (`src/pricing.ts`) 包含:

| 提供商 | 模型示例 | 输入价格 | 输出价格 |
|--------|---------|---------|---------|
| OpenAI | gpt-4 | $0.03/1K tokens | $0.06/1K tokens |
| OpenAI | gpt-4o | $0.0025/1K tokens | $0.01/1K tokens |
| Anthropic | claude-opus-4.5 | $0.015/1K tokens | $0.075/1K tokens |
| Anthropic | claude-sonnet-4.5 | $0.003/1K tokens | $0.015/1K tokens |
| Google | gemini-2.0-flash | $0.001/1K tokens | $0.002/1K tokens |
| ZhiPuAI | glm-4.7 | ¥0.05/1K tokens | ¥0.05/1K tokens |
| DeepSeek | deepseek-chat | ¥0.001/1K tokens | ¥0.002/1K tokens |

**缓存定价** (支持 Anthropic, Google):
- `cacheReadTokens` - 读缓存价格 (通常是输入价格的 10%)
- `cacheWriteTokens` - 写缓存价格 (通常是输入价格的 125%)

## 使用方法

### 基本用法

```bash
cd ~/Workspace/Tools/omo-quota
node src/index.ts sync
```

### 输出示例

```
🔍 正在扫描 oh-my-opencode 消息历史...

扫描路径: /Users/username/.local/share/opencode/storage/message/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
扫描结果:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
会话数:     15
消息数:     342
总 Token:   1,234,567
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 各提供商使用量:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
提供商        输入 Tokens    输出 Tokens    总成本
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OpenAI        345,678        123,456        $12.50
Anthropic     456,789        89,012         $18.30
Google        234,567        45,678         $3.20
ZhiPuAI       123,456        23,456         ¥45.60
DeepSeek      67,890         12,345         ¥2.10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 已更新追踪文件: ~/.omo-quota-tracker.json
```

### 结合其他命令

```bash
# 同步后查看状态
node src/index.ts sync && node src/index.ts status

# 同步后生成成本报告
node src/index.ts sync && node src/index.ts report daily

# 每日工作流
node src/index.ts sync && node src/index.ts status && node src/index.ts report daily
```

## 建议使用频率

### 推荐频率

| 场景 | 频率 | 原因 |
|------|------|------|
| **日常开发** | 每天早上一次 | 确保配额数据是最新的 |
| **成本分析前** | 每次运行 report 前 | 保证报告数据准确 |
| **配额异常** | 发现配额不符时 | 手动同步排查问题 |
| **月初/月末** | 每周 2-3 次 | 密切关注配额消耗 |

### 自动化建议

**方式一: 每日自动同步 (Cron)**

```bash
# 编辑 crontab
crontab -e

# 添加每天早上 9 点自动同步
0 9 * * * cd ~/Workspace/Tools/omo-quota && node src/index.ts sync >> /tmp/omo-quota-sync.log 2>&1
```

**方式二: Shell 启动时同步**

```fish
# Fish shell (~/.config/fish/config.fish)
function omo-morning
    cd ~/Workspace/Tools/omo-quota
    node src/index.ts sync
    node src/index.ts status
end

# 每天早上运行: omo-morning
```

```bash
# Bash/Zsh (~/.bashrc 或 ~/.zshrc)
alias omo-morning='cd ~/Workspace/Tools/omo-quota && node src/index.ts sync && node src/index.ts status'
```

**方式三: Git Hook (适合团队)**

```bash
# .git/hooks/post-merge (每次 git pull 后同步)
#!/bin/bash
cd ~/Workspace/Tools/omo-quota && node src/index.ts sync > /dev/null 2>&1
```

## 数据准确性

### 优势

✅ **100% 准确**: 直接读取实际 API 调用记录  
✅ **包含所有提供商**: 自动识别所有 oh-my-opencode 支持的提供商  
✅ **成本计算精确**: 基于最新定价表 (包括缓存定价)  
✅ **无需手动输入**: 完全自动化,减少人为错误  

### 限制

⚠️ **依赖消息历史**: 如果消息文件被删除,无法恢复数据  
⚠️ **定价表滞后**: 需要手动更新 `src/pricing.ts` 以反映最新价格  
⚠️ **不包含非 oh-my-opencode 使用**: 只追踪通过 oh-my-opencode 的调用  

### 与手动更新对比

| 方式 | 准确性 | 便捷性 | 适用场景 |
|------|--------|--------|---------|
| `sync` (自动) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 所有场景 (推荐) |
| `update` (手动) | ⭐⭐⭐ | ⭐⭐ | 补充调整、异常修正 |

## 故障排查

### 问题 1: "消息目录不存在"

```
❌ 错误: ~/.local/share/opencode/storage/message/ 不存在
```

**原因**: oh-my-opencode 未正确安装或未运行过任何会话

**解决方案**:
```bash
# 检查 oh-my-opencode 安装
ls ~/.local/share/opencode/

# 如果目录不存在,运行一次 oh-my-opencode
# 然后重新执行 sync
```

### 问题 2: "扫描到 0 个会话"

```
✅ 成功同步使用量
扫描结果:
- 会话数: 0
- 消息数: 0
```

**原因**: 消息历史已被清理或从未使用过 oh-my-opencode

**解决方案**:
- 正常情况: 继续使用 oh-my-opencode,下次 sync 会有数据
- 恢复历史: 如有备份,恢复 `~/.local/share/opencode/storage/message/`

### 问题 3: "定价表缺少模型"

```
⚠️ 警告: 模型 'new-model-v2' 未找到定价信息,使用默认价格
```

**原因**: 新模型发布但 `src/pricing.ts` 未更新

**解决方案**:
```bash
# 1. 编辑 src/pricing.ts
# 2. 添加新模型定价
# 3. 重新运行 sync
```

### 问题 4: 成本计算异常高

```
OpenAI: $9999.00
```

**排查步骤**:
1. 检查定价表是否正确 (`src/pricing.ts`)
2. 检查 Token 数是否异常 (`cat ~/.omo-quota-tracker.json`)
3. 验证消息文件格式 (`cat ~/.local/share/opencode/storage/message/ses_xxx/msg_001.json`)

**临时解决**:
```bash
# 手动修正追踪文件
vim ~/.omo-quota-tracker.json

# 或重新初始化
omo-quota init
omo-quota sync
```

## 高级用法

### 自定义数据源路径

如果 oh-my-opencode 安装在非标准路径:

```bash
export OMO_QUOTA_HOME="/custom/path/to/opencode"
node src/index.ts sync
```

### 仅同步特定提供商

当前版本不支持,但可以手动过滤:

```bash
# 同步后手动编辑追踪文件
node src/index.ts sync
vim ~/.omo-quota-tracker.json  # 手动删除不需要的提供商
```

### 同步到外部系统

将追踪数据导出到其他系统:

```bash
# JSON 格式
cat ~/.omo-quota-tracker.json | jq '.providers'

# CSV 格式 (需要 jq)
cat ~/.omo-quota-tracker.json | jq -r '.providers | to_entries[] | [.key, .value.usage, .value.cost] | @csv'
```

## 相关命令

| 命令 | 说明 | 关系 |
|------|------|------|
| `sync` | 自动同步使用量 | 数据源 |
| `status` | 查看配额状态 | 数据展示 |
| `report` | 生成成本报告 | 数据分析 (建议先 sync) |
| `update` | 手动更新使用量 | 手动补充 (sync 后的微调) |
| `dashboard` | Web 仪表盘 | 实时监控 (自动读取 sync 数据) |

## 最佳实践

1. **每天第一件事**: `omo-quota sync` (确保数据最新)
2. **成本分析前**: 先 `sync` 再 `report` (保证报告准确)
3. **策略决策前**: 先 `sync` 再 `status` (基于真实数据决策)
4. **定期备份**: 备份 `~/.omo-quota-tracker.json` (防止数据丢失)
5. **更新定价表**: 每季度检查 `src/pricing.ts` (反映最新价格)

---

**下一步**: 学习如何使用成本报告功能 → [COST_ANALYSIS.md](COST_ANALYSIS.md)
