# Draft: omo-quota 降级策略实现

## 用户原始需求

"实现降级策略，当切换后的 oh-my-opencode 配置中某个 agent 的模型不可用时，能有相应的降级方案"

## 当前实现分析

### omo-quota 现状

1. **switch.ts (src/commands/switch.ts:6-62)**
   - 仅执行文件复制：`copyFileSync(strategyPath, CONFIG_PATH)`
   - 在复制前不做任何模型可用性检查
   - 有备份机制，但没有预检测

2. **doctor.ts (src/commands/doctor.ts:6-63)**
   - 只检查文件存在性和 JSONC 语法（parseJSONC）
   - 不验证模型是否真的可用
   - 不检查 provider chain

3. **策略文件结构**
   - 使用 `agents.<agent>.model` 指定主模型
   - 使用 `categories.<category>.model` 作为类别级配置
   - **没有 provider chain 的显式字段**

### oh-my-opencode 的 fallback 机制（已知信息）

1. **3-Step Resolution Flow**：
   - User Override → Provider Priority Fallback → System Default

2. **Provider Chains**：
   - 每个 agent 有预定义的 provider 优先级顺序
   - 例如：Sisyphus: anthropic → github-copilot → opencode → antigravity → google

3. **Fallback Logic**：
   - 按顺序尝试每个 provider
   - 检查模型是否可用
   - 返回第一个匹配的

### 关键发现

1. **omo-quota 没有可用性检测**：
   - 代码库中没有任何 API 调用来检查模型可用性
   - 没有与 oh-my-opencode 的 provider chain 集成

2. **策略文件缺少 provider chain**：
   - 当前的 3 个策略文件（performance/balanced/economical）都没有定义 provider chain
   - 模型是硬编码的，没有回退选项

3. **无测试基础设施**：
   - 项目中没有 `.test.ts` 文件
   - CI 工作流不包含测试

## 设计决策（待确认）

### 问题 1: Provider Chain 的存储位置

**选项 A**: 在策略文件中为每个 agent 定义 provider chain
```jsonc
"agents": {
  "sisyphus": {
    "model": "zhipuai-coding-plan/glm-4.7",
    "providerChain": [
      "zhipuai-coding-plan",
      "github-copilot",
      "google",
      "anthropic"
    ]
  }
}
```

**选项 B**: 使用 oh-my-opencode 的默认 provider chain（无需在策略文件中定义）
- 依赖 oh-my-opencode 的内部回退机制
- omo-quota 只做可用性预检查，不修改 provider chain

**选项 C**: 在 omo-quota 内部维护 provider chain 配置
- 新建 `src/providers/chains.ts` 定义每个 agent 的优先级
- 在切换时自动选择第一个可用的 provider

### 问题 2: 模型可用性检测方式

**选项 A**: 使用 provider 的模型列表 API
- OpenAI: `GET https://api.openai.com/v1/models`
- Anthropic: models list endpoint
- Google: models list endpoint
- 优点：准确、轻量
- 缺点：不是所有 provider 都支持

**选项 B**: 发起探测性请求
- 发送一个极短的测试请求
- 根据返回码判断（200=可用，401/403/404=不可用，5xx/timeout=暂时不可用）
- 优点：通用，适用于所有 provider
- 缺点：消耗 token、可能被限流

**选项 C**: 混合方式
- 优先使用 models list API（如果有）
- 否则使用探测性请求
- 缓存结果减少重复检测

### 问题 3: 降级触发时机

**选项 A**: 仅在 `switch` 命令执行时检查
- 用户执行 `omo-quota switch <strategy>` 时检测
- 如果主模型不可用，自动选择下一个可用的
- 或阻止切换并提供建议

**选项 B**: 持续监控（类似 watch 命令）
- 后台定期检查所有 provider 的可用性
- 在模型不可用时自动切换到下一个
- 需要 daemon 进程

**选项 C**: 结合方式
- `switch` 时强制检查
- 提供 `check` 或 `validate` 命令手动检查
- 可选的持续监控

### 问题 4: 失败处理策略

**选项 A**: 阻止切换 + 详细报告
- 如果目标策略的核心模型都不可用
- 阻止切换，显示详细原因和建议
- 用户需手动选择其他策略

**选项 B**: 自动降级 + 记录日志
- 如果主模型不可用，自动选择下一个可用的 provider
- 修改策略文件或临时的配置文件
- 记录降级日志到 tracker

**选项 C**: 询问用户
- 检测到主模型不可用时
- 显示可用性状态和降级选项
- 让用户选择：降级/取消/尝试其他策略

### 问题 5: 新增命令需求

**建议的新命令**：

1. `omo-quota check [strategy]` - 检查策略中所有模型的可用性
2. `omo-quota simulate <strategy>` - 模拟如果主模型失败会降级到哪个
3. 扩展 `doctor` - 添加 `--runtime` 或 `--check-availability` 选项
4. 扩展 `switch` - 添加 `--dry-run` 选项预演切换

**是否都需要？还是只需要部分？**

### 问题 6: 测试策略

**选项 A**: 先实现，后续补测试
- 快速实现核心功能
- 手动验证
- 后续再添加单元/集成测试

**选项 B**: TDD，先写测试
- 先写测试框架和 mock
- 测试驱动开发
- 确保质量

**选项 C**: 基础测试 + 手动验证
- 为可用性检测写基本测试（mock provider APIs）
- 切换逻辑进行手动验证
- CI 中包含测试步骤

## 需要明确的技术细节

1. **超时设置**: 模型可用性检测的超时时间（建议 2000-5000ms）
2. **缓存策略**: 检测结果的缓存 TTL（建议 60s）
3. **并发限制**: 检测时的并发请求数（建议 3-5）
4. **Tracker 扩展**: 是否需要在 tracker 中记录可用性状态？

## 初步实现路线图（草案）

### Phase 1: 基础设施
1. 新建 `src/utils/availability.ts` - 可用性检测核心
2. 新建 `src/providers/` - provider adapters
3. 扩展 `src/types.ts` - 添加相关类型定义

### Phase 2: switch 增强
1. 修改 `src/commands/switch.ts` - 在复制前添加可用性检查
2. 根据检查结果决定是否切换或降级

### Phase 3: doctor 增强
1. 修改 `src/commands/doctor.ts` - 添加可用性检查选项
2. 显示模型可用性状态

### Phase 4: 新命令（可选）
1. 新建 `src/commands/check.ts` - 可用性检查命令
2. 新建 `src/commands/simulate.ts` - 降级模拟命令

### Phase 5: 测试
1. 新建 `tests/` 目录
2. 添加单元测试和集成测试
3. 更新 CI 工作流

## 待确认事项

- [ ] Provider chain 存储位置（选项 A/B/C）
- [ ] 可用性检测方式（选项 A/B/C）
- [ ] 降级触发时机（选项 A/B/C）
- [ ] 失败处理策略（选项 A/B/C）
- [ ] 需要哪些新增命令
- [ ] 测试策略（选项 A/B/C）
- [ ] 其他特殊需求或约束
