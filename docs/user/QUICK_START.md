# 🚀 OMO-QUOTA Skills 快速上手指南

**最后更新**: 2026-01-30
**部署状态**: ✅ 双 Skill 已安装

---

## 📦 已安装的 Skills

### 1️⃣ quota-manager (Agent Skill)
**位置**: `~/.config/opencode/skills/quota-manager.md`  
**角色**: 🤖 AI 配额管理专家  
**触发**: 直接对话（无需特殊前缀）

### 2️⃣ @omo-quota (Documentation Skill)
**位置**: `.opencode/skill/omo-quota/SKILL.md`  
**角色**: 📚 工具使用手册  
**触发**: `@omo-quota` 引用

---

## 🎯 何时使用哪个 Skill？

| 你的需求 | 使用方式 | 触发的 Skill | AI 的行为 |
|---------|---------|-------------|-----------|
| 查看配额状态 | "我的配额状态怎么样？" | quota-manager | 读取数据 → 分析 → 报告 |
| 成本分析 | "这个月花了多少钱？" | quota-manager | 计算成本 → 明细 → 建议 |
| 策略推荐 | "我该用哪个策略？" | quota-manager | 分析模式 → 推荐 → 理由 |
| 命令用法 | `@omo-quota` 如何切换策略？ | @omo-quota | 查阅文档 → 返回命令说明 |
| 配置参考 | `@omo-quota` Balanced 策略详情 | @omo-quota | 查找文档 → 返回配置 |
| 故障排查 | `@omo-quota` 切换后模型不变？ | @omo-quota | 查阅故障 → 返回解决方案 |

---

## 💬 对话式查询（quota-manager）

**特点**: AI 主动执行工具、分析数据、提供建议

### 示例 1：查看配额状态
```
用户: "我的配额状态怎么样？"

AI 行为:
1. 执行: cat ~/.omo-quota-tracker.json
2. 解析: JSON 数据
3. 分析: 使用率、重置时间
4. 输出: 配额报告 + 优化建议

预期输出:
📊 配额概览：
Anthropic Claude: 已用 45/100,000 (4.5%)，下次重置 2026-01-30 15:00
ZhiPuAI Max: 已用 3,851/6,000 (64.2%)，每 5 小时重置
💡 建议: ZhiPuAI 使用率高，性价比好，建议继续使用
```

### 示例 2：成本分析
```
用户: "这个月花了多少钱？"

AI 行为:
1. 读取: 追踪数据和定价表
2. 计算: 各提供商成本
3. 汇总: 总成本和明细
4. 建议: 成本优化方案

预期输出:
💰 本月总成本: $229.00
明细:
  - Anthropic Claude: $69.00
  - ZhiPuAI Max: $60.00
  - DeepSeek: ¥300.00
💡 优化建议: 增加 ZhiPuAI 使用比例，减少 Claude 调用
```

### 示例 3：策略推荐
```
用户: "我该用哪个策略？"

AI 行为:
1. 分析: 使用模式和频率
2. 评估: 当前策略效果
3. 推荐: 最优策略
4. 说明: 推荐理由

预期输出:
🎯 推荐策略: balanced（均衡实用）
理由:
  - ZhiPuAI GLM 4.7 性能好，成本低
  - 当前使用已很平衡
  - 无需切换，保持习惯
```

---

## 📚 命令查询（@omo-quota）

**特点**: AI 查阅文档、返回参考信息

### 示例 1：命令用法
```
用户: "@omo-quota 如何切换策略？"

AI 行为:
1. 查阅: SKILL.md 中的命令参考
2. 提取: switch 命令说明
3. 返回: 命令用法 + 参数

预期输出:
切换策略使用 switch 命令：

基本用法:
  bun run src/index.ts switch <strategy>

参数:
  - performance: 极致性能（紧急任务）
  - balanced: 均衡实用（推荐日常）
  - economical: 经济节约（成本控制）

示例:
  bun run src/index.ts switch balanced
```

### 示例 2：配置详情
```
用户: "@omo-quota Balanced 策略使用什么模型？"

AI 行为:
1. 查阅: SKILL.md 中的策略详解
2. 定位: Balanced 策略章节
3. 提取: 模型配置信息

预期输出:
Balanced 策略模型配置：

主力模型:
  - Sisyphus: zhipuai/glm-4.7
  - Oracle: google/gemini-2.0-flash-thinking-exp:antigravity
  - Prometheus: zhipuai/glm-4.7
  - Librarian: google/gemini-2.0-flash-thinking-exp
  - Explore: github-copilot/gpt-4o（免费）

预估成本: ¥100-150/天（中轻度使用）
```

### 示例 3：故障排查
```
用户: "@omo-quota 切换后模型仍然使用旧配置？"

AI 行为:
1. 查阅: SKILL.md 故障排查章节
2. 定位: 相关问题
3. 返回: 解决方案

预期输出:
问题: 切换后模型仍然使用旧配置

解决方案:
1. 验证策略文件是否正确复制:
   cat ~/.config/opencode/oh-my-opencode.jsonc | grep -A5 '"build"'

2. 重启 OpenCode 或重新加载配置

3. 检查是否有项目级配置覆盖:
   ls -la <project>/.opencode/

4. 查看当前生效的策略:
   bun run src/index.ts status
```

---

## 🔄 混合使用场景

AI 会自动结合两个 skills 处理复杂问题

### 示例：综合查询
```
用户: "我想切换到经济模式，但不知道命令是什么，也想了解当前配额情况"

AI 综合使用:
1. quota-manager: 分析当前配额状态
   → "您的 Claude Pro 已用 45%，ZhiPuAI 用了 64.2%"

2. @omo-quota: 查询 switch 命令用法
   → "切换到经济模式使用: bun run src/index.ts switch economical"

3. quota-manager: 评估切换必要性
   → "当前配额充足，可考虑月底前切换以控制成本"

预期输出:
📊 当前配额状态:
  - Claude Pro: 45% 已用，配额充足
  - ZhiPuAI: 64.2% 已用，接近上限

🔧 切换到经济模式:
  命令: bun run src/index.ts switch economical
  效果: 使用免费模型（github-copilot-free）为主，大幅降低成本

💡 建议:
  - 当前配额尚可，可以等月底再切换
  - 经济模式适合预算受限或非关键任务
  - 切换后主力模型: github-copilot-free/gpt-4o
```

---

## 🧪 快速测试

### 测试 1：对话式查询（直接问）
```bash
# 在 OpenCode 中输入
"我的配额状态怎么样？"
```
**预期**: AI 执行工具，生成详细的配额报告

---

### 测试 2：命令查询（使用前缀）
```bash
# 在 OpenCode 中输入
@omo-quota 如何切换策略？
```
**预期**: AI 返回 switch 命令的使用说明

---

### 测试 3：运行验证脚本
```bash
cd /Volumes/Model/Workspace/Skills/omo-quota
./.opencode/skill/omo-quota/test-skill.sh
```
**预期**: 所有核心功能测试通过

---

## 📊 实际命令参考

### 查看配额状态
```bash
bun run src/index.ts status
```

### 切换策略
```bash
bun run src/index.ts switch balanced
bun run src/index.ts switch performance
bun run src/index.ts switch economical
```

### 同步历史记录
```bash
bun run src/index.ts sync
```

### 生成成本报告
```bash
bun run src/index.ts report daily
bun run src/index.ts report monthly
```

### 健康检查
```bash
bun run src/index.ts doctor
```

---

## 🎯 使用技巧

### 1. 优先使用对话式（quota-manager）
对于数据分析类问题，直接对话更高效：
- ✅ "我的配额怎么样？"
- ✅ "这个月花了多少钱？"
- ✅ "我该用哪个策略？"

### 2. 命令和配置查询用 @omo-quota
技术细节和命令用法，使用 @omo-quota：
- ✅ `@omo-quota` 如何切换策略？
- ✅ `@omo-quota` Balanced 策略详情
- ✅ `@omo-quota` 回退链配置

### 3. 复杂问题让 AI 自动组合
不确定用哪个？直接问，AI 会智能组合：
- ✅ "我想优化成本，该怎么做？"
- ✅ "帮我分析一下使用模式并推荐策略"

### 4. 定期维护
建议每周运行：
```bash
# 同步使用记录
bun run src/index.ts sync

# 查看状态
bun run src/index.ts status

# 检查健康
bun run src/index.ts doctor
```

---

## 📚 相关文档

| 文档 | 路径 | 用途 |
|------|------|------|
| 快速上手 | `QUICK_START.md` | 本文档 |
| Agent Skill | `~/.config/opencode/skills/quota-manager.md` | AI 配额管理专家定义 |
| Documentation Skill | `.opencode/skill/omo-quota/SKILL.md` | 详细的工具手册 |
| 对比分析 | `SKILL_COMPARISON.md` | 两个 skill 的详细对比 |
| 安装报告 | `INSTALLATION_SUMMARY.md` | 完整的安装验证 |
| 项目 README | `README.md` | 完整项目说明 |

---

## 🎉 总结

**双 Skill 协同优势**:
- 💬 对话式查询（quota-manager）→ AI 主动分析和建议
- 📚 命令查询（@omo-quota）→ 快速查阅参考文档
- 🔄 自动组合 → 复杂问题智能处理

**开始使用**:
1. 直接问 AI 配额相关问题（触发 quota-manager）
2. 使用 `@omo-quota` 查询命令用法
3. 运行测试脚本验证功能

**需要帮助？**
- 查看 `SKILL_COMPARISON.md` 了解详细对比
- 运行 `test-skill.sh` 验证安装
- 阅读 `SKILL.md` 查看完整文档

---

**文档版本**: 1.0  
**最后更新**: 2026-01-30  
**维护状态**: ✅ 活跃维护
