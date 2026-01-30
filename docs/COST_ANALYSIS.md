# 成本分析报告指南

## 概述

`omo-quota report` 命令生成详细的成本分析报告,帮助你:
- 📈 追踪每日/每月成本趋势
- 💰 识别高成本操作
- 💡 发现优化机会
- 📊 对比不同提供商的性价比

## 报告类型

### 1. 每日成本趋势 (`daily`)

显示最近 7 天的成本变化:

```bash
cd ~/omo-quota
node src/index.ts report daily
```

**输出示例**:

```
📊 每日成本趋势 (最近 7 天)

  $45.00 ┤        ╭──
  $40.00 ┤      ╭─╯  
  $35.00 ┤    ╭─╯    
  $30.00 ┤  ╭─╯      
  $25.00 ┤╭─╯        
  $20.00 ┼───────────
         └────────────
         1/24  →  1/30

📈 趋势分析:
- 平均日成本: $35.20
- 最高: $44.50 (1/30)
- 最低: $22.10 (1/24)
- 增长趋势: +101% (本周)

💰 各提供商成本占比:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OpenAI       $156.70 ████████████░░░░░░░░ 45%
Anthropic    $132.50 ██████████░░░░░░░░░░ 38%
Google       $34.20  ██░░░░░░░░░░░░░░░░░░ 10%
ZhiPuAI      ¥89.40  ██░░░░░░░░░░░░░░░░░░  7%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: $323.40 + ¥89.40
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 优化建议:

1. ⚠️ OpenAI 成本过高 ($22.50/天)
   建议: 将常规任务切换到 Claude Sonnet (节省 ~40%)

2. 📈 成本增长趋势显著 (+101%)
   建议: 考虑切换到 economical 策略

3. 🎯 按当前速度,本月预计总成本 $1,234
   建议: 如需控制预算,立即降级策略
```

### 2. 每月成本汇总 (`monthly`)

显示当月详细成本分解:

```bash
cd ~/omo-quota
node src/index.ts report monthly
```

**输出示例**:

```
📊 2026年1月成本汇总

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
提供商         总成本        调用次数      平均成本      占比
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OpenAI         $456.70       12,345        $0.037        42%
Anthropic      $387.50       8,234         $0.047        35%
Google         $123.40       45,678        $0.003        11%
ZhiPuAI        ¥234.60       23,456        ¥0.010        8%
DeepSeek       ¥89.30        67,890        ¥0.001        4%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计           $967.60 + ¥323.90
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔝 最贵的 5 个模型:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
模型                    总成本        调用次数      占比
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
gpt-4                   $234.50       1,234         24.2%
claude-opus-4.5         $198.30       2,456         20.5%
claude-sonnet-4.5       $189.20       5,678         19.6%
gpt-4o                  $178.40       6,789         18.4%
glm-4.7                 ¥145.60       15,678        (中国市场)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 按任务类型分类 (基于 agent):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent           总成本        调用次数      主要模型
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sisyphus        $456.20       45,678        claude-sonnet-4.5, glm-4.7
oracle          $198.30       2,345         claude-opus-4.5, gpt-4
prometheus      $123.40       12,345        glm-4.7
librarian       $89.70        23,456        gemini-2.0-flash
explore         $100.00       34,567        github-copilot/gpt-4o
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 优化建议:

1. 🎯 gpt-4 使用过于频繁
   - 当前: 1,234 次调用 ($234.50)
   - 建议: 切换到 claude-sonnet-4.5 (质量相当,成本降低 60%)
   - 预计节省: ~$140/月

2. ⚠️ oracle agent 使用昂贵模型
   - 当前使用: claude-opus-4.5 ($198.30)
   - 建议: 仅在关键决策时使用,常规调试用 claude-sonnet-4.5
   - 预计节省: ~$120/月

3. 📈 本月成本已达预算 80% (目标 $1,200)
   - 剩余预算: $232.40
   - 剩余天数: 8 天
   - 建议: 切换到 economical 策略至月底
```

### 3. 导出为 Markdown (`--export`)

将报告导出为 Markdown 文件:

```bash
node src/index.ts report daily --export
node src/index.ts report monthly --export
```

**生成文件**:
- `omo-quota-daily-report-2026-01-30.md`
- `omo-quota-monthly-report-2026-01.md`

**文件内容** (示例):

````markdown
# OMO Quota Daily Report - 2026-01-30

## Daily Cost Trend (Last 7 Days)

```
  $45.00 ┤        ╭──
  $40.00 ┤      ╭─╯  
  ...
```

## Provider Cost Breakdown

| Provider | Total Cost | Percentage |
|----------|------------|------------|
| OpenAI | $156.70 | 45% |
| Anthropic | $132.50 | 38% |
| ... | ... | ... |

## Optimization Recommendations

1. **High OpenAI Cost Alert**
   - Current: $22.50/day
   - Recommendation: Switch to Claude Sonnet
   - Expected Savings: ~40%

...
````

## 如何使用报告

### 工作流 1: 每日成本监控

```bash
# 早上同步数据
cd ~/omo-quota
node src/index.ts sync

# 查看每日趋势
node src/index.ts report daily

# 根据报告调整策略
# 如成本过高 → economical
# 如成本正常 → balanced
# 如配额充足 → performance
```

### 工作流 2: 每周成本审查

```bash
# 周一早上生成报告
cd ~/omo-quota
node src/index.ts sync
node src/index.ts report daily --export

# 分析趋势
cat omo-quota-daily-report-*.md

# 制定本周策略
# 高成本周 → 降级
# 低成本周 → 保持或升级
```

### 工作流 3: 月度预算管理

```bash
# 月初设定预算目标
# 假设: $1,200/月

# 每周检查
cd ~/omo-quota
node src/index.ts sync
node src/index.ts report monthly

# 计算剩余预算
# 总预算 - 当前成本 = 剩余
# $1,200 - $967.60 = $232.40

# 评估是否需要调整
# 如果按当前速度会超支 → 立即降级
# 如果远低于预算 → 可以升级
```

## 成本优化策略

### 策略 1: 模型降级

**场景**: OpenAI GPT-4 成本过高

**优化**:
```
当前: GPT-4 ($0.03 输入 + $0.06 输出)
替换为: Claude Sonnet 4.5 ($0.003 输入 + $0.015 输出)
节省: ~75% 成本,质量相当
```

**实施**:
1. 切换到 `balanced` 或 `economical` 策略
2. 这些策略已配置为优先使用 Claude Sonnet

### 策略 2: Agent 优化

**场景**: Oracle agent 使用昂贵模型

**优化**:
```
当前: 所有调试都用 Claude Opus 4.5
替换为: 
  - 常规调试 → Claude Sonnet 4.5
  - 关键决策 → Claude Opus 4.5 (保留)
节省: ~60% Oracle 成本
```

**实施**:
1. 编辑策略配置
2. 修改 `agents.oracle.model` 为 `claude-sonnet-4.5`
3. 仅在关键任务时手动切换到 `performance`

### 策略 3: 任务分流

**场景**: 大量简单任务使用昂贵模型

**优化**:
```
简单任务: Github Copilot Free (GPT-4o) - 免费
中等任务: ZhiPuAI GLM 4.7 - 便宜
复杂任务: Claude Sonnet 4.5 - 中等
关键任务: Claude Opus 4.5 - 昂贵
```

**实施**:
1. 默认使用 `balanced` 策略 (自动分流)
2. 关键项目时手动切换到 `performance`
3. 实验项目使用 `economical`

### 策略 4: 缓存优化

**场景**: 大量重复上下文 (Anthropic, Google 支持缓存)

**优化**:
```
未优化: 每次请求都传完整上下文
优化后: 使用缓存,读缓存仅 10% 成本

示例:
- 输入: 10K tokens × $0.003 = $0.03
- 缓存读: 10K tokens × $0.0003 = $0.003
节省: 90% 输入成本
```

**实施**:
- Claude 和 Gemini 已自动启用缓存
- 无需手动配置

## 成本预警阈值

### 建议阈值

| 警告级别 | 每日成本 | 每月成本 | 行动 |
|---------|---------|---------|------|
| 🟢 正常 | < $30 | < $900 | 保持当前策略 |
| 🟡 注意 | $30-50 | $900-1500 | 考虑降级 |
| 🟠 警告 | $50-80 | $1500-2400 | 建议降级 |
| 🔴 严重 | > $80 | > $2400 | 立即降级 |

### 自动预警 (未来功能)

```bash
# TODO: 实现自动预警
omo-quota report daily | grep "超出预算"
# 如超出 → 发送通知
# 如严重超出 → 自动切换到 economical
```

## 报告数据来源

### 数据流

```
oh-my-opencode 消息历史
         ↓
  omo-quota sync (解析 + 计算成本)
         ↓
  ~/.omo-quota-tracker.json (存储)
         ↓
  omo-quota report (读取 + 分析)
         ↓
  终端输出 / Markdown 文件
```

### 数据准确性

✅ **依赖 sync**: 报告数据来自追踪文件,建议先运行 `sync`  
✅ **实时定价**: 基于 `src/pricing.ts` 中的最新定价表  
⚠️ **定价更新**: 需要手动更新定价表以反映最新价格  

## 故障排查

### 问题 1: "追踪文件为空"

```
❌ 错误: ~/.omo-quota-tracker.json 不存在或为空
```

**解决方案**:
```bash
cd ~/omo-quota
node src/index.ts init      # 初始化
node src/index.ts sync      # 同步数据
node src/index.ts report daily
```

### 问题 2: "图表显示异常"

```
  $0.00 ┤─────────────
```

**原因**: 数据不足 (少于 2 天)

**解决方案**:
- 等待积累更多数据 (建议至少 3 天)
- 或查看 `monthly` 报告

### 问题 3: "成本为 $0"

```
总计: $0.00
```

**原因**: 
1. 未运行过 `sync`
2. 消息历史为空
3. 定价表缺少模型

**解决方案**:
```bash
# 检查是否有消息历史
ls ~/.local/share/opencode/storage/message/

# 运行同步
cd ~/omo-quota
node src/index.ts sync

# 重新生成报告
node src/index.ts report daily
```

## 高级用法

### 自定义时间范围

当前版本固定为:
- `daily`: 最近 7 天
- `monthly`: 当前月

**未来功能** (TODO):
```bash
# 自定义日期范围
omo-quota report --from 2026-01-01 --to 2026-01-15

# 对比两个月
omo-quota report --month 2026-01 --compare 2025-12
```

### 导出到其他格式

当前支持 Markdown,未来可扩展:

```bash
# CSV 格式 (TODO)
omo-quota report daily --format csv > report.csv

# JSON 格式 (TODO)
omo-quota report monthly --format json > report.json

# HTML 格式 (TODO)
omo-quota report daily --format html > report.html
```

## 相关命令

| 命令 | 说明 | 关系 |
|------|------|------|
| `sync` | 同步使用量 | 数据源 (必须先运行) |
| `report` | 成本分析 | 数据分析 |
| `status` | 查看配额 | 实时状态 |
| `dashboard` | Web 监控 | 可视化展示 |
| `switch` | 切换策略 | 根据报告调整策略 |

## 最佳实践

1. **每天早上**: `sync` → `report daily` (了解昨日成本)
2. **每周一**: `sync` → `report daily --export` (审查本周趋势)
3. **每月末**: `sync` → `report monthly --export` (生成月度报告)
4. **成本异常**: 立即运行 `report daily` 分析原因
5. **策略调整**: 参考报告建议,不要盲目切换

---

**下一步**: 学习如何使用 Web 仪表盘 → [DASHBOARD.md](DASHBOARD.md)
