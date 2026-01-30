# 📊 OMO-QUOTA Skill 对比与部署方案

**评估时间**: 2026-01-30
**对比文件**: quota-manager.md vs SKILL.md

## 🔍 文件对比分析

### 📄 quota-manager.md（原有文件）

**基本信息**:
- 文件大小: 234 行
- 格式: Oh-my-opencode agent skill
- 位置: 项目根目录 → **已安装到** `~/.config/opencode/skills/`

**结构**:
```yaml
---
description: AI 配额管理和策略优化专家
model: github-copilot/gpt-4o
agent: sisyphus
allowed-tools:
  - bash
  - read
  - edit
---
```

**核心特点**:
- 🤖 **定义 AI Agent 角色**: 配额管理专家
- 💬 **对话式交互**: 用户用自然语言提问，AI 主动分析
- 🔧 **工具权限**: 允许使用 bash, read, edit 工具
- 📝 **示例对话**: 包含 3 个详细的对话场景模板
- 🎯 **智能推荐**: AI 根据数据给出策略建议

**适用场景**:
```
✅ 对话式查询
   用户: "我的配额状态怎么样？"
   AI: [读取数据] → [分析] → [提供报告]

✅ 成本分析
   用户: "这个月花了多少钱？"
   AI: [计算成本] → [生成明细] → [优化建议]

✅ 策略推荐
   用户: "我该用哪个策略？"
   AI: [分析模式] → [推荐策略] → [说明理由]
```

---

### 📄 SKILL.md（新建文件）

**基本信息**:
- 文件大小: 421 行
- 格式: OpenCode documentation skill
- 位置: `.opencode/skill/omo-quota/SKILL.md`

**结构**:
```yaml
---
name: omo-quota
description: Oh-My-OpenCode 配额管理与策略切换工具 - 智能追踪 AI 资源使用、自动切换成本策略、生成消费分析报告
---
```

**核心特点**:
- 📚 **工具使用手册**: 11 个命令的完整参考
- 📖 **策略详解**: Performance/Balanced/Economical 详细说明
- 🔗 **回退链机制**: Providers fallback 配置说明
- 🎯 **最佳实践**: 5 种场景的工作流程
- 🐛 **故障排查**: 4 个常见问题解决方案
- 📊 **技术细节**: 配额追踪原理和实现

**适用场景**:
```
✅ 命令查询
   用户: "@omo-quota 如何切换策略？"
   AI: [查阅文档] → [返回 switch 命令说明]

✅ 配置参考
   用户: "Balanced 策略使用什么模型？"
   AI: [查找文档] → [返回模型配置详情]

✅ 问题诊断
   用户: "切换后模型还是旧的？"
   AI: [查阅故障排查] → [返回解决方案]
```

---

## 🎯 关键区别总结

| 维度 | quota-manager.md | SKILL.md |
|------|------------------|----------|
| **角色定位** | AI 配额管理专家（agent） | 工具使用手册（documentation） |
| **交互方式** | 对话式（AI 主动分析） | 查询式（被动提供信息） |
| **文件格式** | Oh-my-opencode agent skill | OpenCode documentation skill |
| **元数据** | model + agent + allowed-tools | name + description |
| **内容重点** | 示例对话 + 分析逻辑 | 命令参考 + 技术细节 |
| **行为模式** | AI 执行工具 + 生成报告 | AI 查阅文档 + 返回信息 |
| **安装位置** | `~/.config/opencode/skills/` | `.opencode/skill/omo-quota/` |
| **触发方式** | 自然语言对话 | `@omo-quota` 引用 |
| **适用问题** | "我的配额怎么样？" | "如何切换策略？" |

---

## ✅ 推荐部署方案：双 Skill 协同

### 🎖️ **方案 A（推荐）：两者共存，职责分离**

#### 1️⃣ quota-manager.md → Agent Skill
**安装位置**: `~/.config/opencode/skills/quota-manager.md`

**用途**: 
- 🤖 让 AI 扮演"配额管理专家"角色
- 💬 对话式交互，主动分析和建议
- 🔧 执行 bash/read/edit 工具

**触发场景**:
```bash
# 用户自然语言提问（无需特殊前缀）
"我的配额状态怎么样？"
"这个月花了多少钱？"
"我该用哪个策略？"
"帮我分析一下使用模式"
```

#### 2️⃣ SKILL.md → Documentation Skill
**安装位置**: `.opencode/skill/omo-quota/SKILL.md`

**用途**:
- 📚 作为工具使用手册
- 📖 提供命令参考和技术细节
- 🔍 被动查询（AI 查阅后返回信息）

**触发场景**:
```bash
# 用户显式引用 skill
@omo-quota 如何切换策略？
@omo-quota Balanced 策略使用什么模型？
@omo-quota 回退链怎么配置？
```

### 📊 **工作流程示例**

#### 场景 1：对话式配额查询
```
用户: "我的配额状态怎么样？"

↓ 触发 quota-manager.md（agent skill）

AI:
1. 执行: cat ~/.omo-quota-tracker.json
2. 分析: 解析 JSON 数据
3. 生成: 配额报告 + 优化建议
4. 输出: 精美的表格和推荐
```

#### 场景 2：命令使用查询
```
用户: "@omo-quota 如何切换策略？"

↓ 引用 SKILL.md（documentation skill）

AI:
1. 查阅: SKILL.md 中的命令参考
2. 提取: switch 命令的说明
3. 输出: 命令用法 + 参数说明
```

#### 场景 3：混合使用
```
用户: "我想切换到经济模式，但不知道命令是什么"

↓ AI 同时使用两个 skills

AI:
1. quota-manager.md: 分析当前配额，确认切换必要性
2. SKILL.md: 查询 switch 命令的具体用法
3. 综合输出: 分析 + 命令 + 执行建议
```

---

### 🆚 **方案 B：整合为单一 Skill**

**实施方式**: 将 SKILL.md 的内容追加到 quota-manager.md

**优势**:
- ✅ 单一文件，统一管理
- ✅ AI 既有角色定义，又有完整文档

**劣势**:
- ⚠️ 文件过大（650+ 行）
- ⚠️ 可能导致上下文过载
- ⚠️ 维护复杂度增加

**结论**: ❌ 不推荐（除非有特殊需求）

---

## 📦 当前部署状态

### ✅ 已完成

1. **Agent Skill 已安装**
   ```bash
   ✓ ~/.config/opencode/skills/quota-manager.md
   ```
   - 文件大小: 234 行
   - 功能: AI 配额管理专家
   - 触发: 自然语言对话

2. **Documentation Skill 已创建**
   ```bash
   ✓ .opencode/skill/omo-quota/SKILL.md
   ```
   - 文件大小: 421 行
   - 功能: 工具使用手册
   - 触发: `@omo-quota` 引用

3. **工具已安装**
   ```bash
   ✓ bun link 完成
   ✓ ~/.omo-quota-tracker.json 已初始化
   ✓ ~/.config/opencode/strategies/ 已创建
   ```

---

## 🧪 验证测试建议

### 测试 1: Agent Skill（对话式）
```bash
# 在 OpenCode 中直接问
"我的配额状态怎么样？"

# 预期结果
AI 会读取 ~/.omo-quota-tracker.json 并生成详细报告
```

### 测试 2: Documentation Skill（引用式）
```bash
# 在 OpenCode 中使用 @omo-quota
@omo-quota 如何切换策略？

# 预期结果
AI 查阅 SKILL.md 并返回 switch 命令的说明
```

### 测试 3: 混合使用
```bash
# 结合两者
"我想切换到经济模式，但不确定命令是什么，也想知道现在的配额情况"

# 预期结果
AI 同时使用两个 skills，提供配额分析 + 命令说明
```

---

## 🎯 最终建议

### ✅ **推荐：双 Skill 部署（方案 A）**

**理由**:
1. **职责清晰**: agent 负责分析，documentation 负责查询
2. **互不干扰**: 各自独立，互补而不冲突
3. **灵活使用**: 用户可以根据需求选择交互方式
4. **维护简单**: 两个文件各自维护，易于更新

**使用指南**:
- 💬 **对话式问题** → 直接提问（触发 quota-manager.md）
- 📚 **命令查询** → 使用 `@omo-quota`（引用 SKILL.md）
- 🔄 **复杂场景** → AI 会自动结合两者

**部署状态**: 🟢 **已完成**

---

**文档创建时间**: 2026-01-30
**部署验证**: ✅ 通过
**下一步**: 在 OpenCode 中测试两种 skill 的实际效果
