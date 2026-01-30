# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-30
**Commit:** N/A
**Branch:** main

## OVERVIEW
AI 配额管理 CLI 工具，使用 TypeScript + Bun，为 oh-my-opencode 用户提供配额追踪、策略切换和成本分析功能。

## STRUCTURE
```
omo-quota/
├── src/                    # 核心 TypeScript 源码
│   ├── index.ts            # CLI 入口（带 shebang）
│   ├── types.ts            # 类型定义 + 路径常量
│   ├── pricing.ts          # AI 模型定价表
│   ├── commands/           # 11 个 CLI 命令实现
│   └── utils/             # 工具函数（tracker, parser, calculator）
├── dashboard/              # Web 仪表盘（Bun.serve 静态服务）
├── docs/                  # 文档（SYNC, COST_ANALYSIS, DASHBOARD）
├── dist/                  # 构建输出（Bun 编译）
└── CLAUDE.md             # Bun 特定开发规范
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| CLI 入口 | src/index.ts | Commander.js 程序，11 个命令路由 |
| 命令实现 | src/commands/*.ts | 每个命令一个文件，单一职责 |
| 配额追踪 | src/utils/tracker.ts | 读取/写入 ~/.omo-quota-tracker.json |
| 类型定义 | src/types.ts | ProviderStatus, TrackerData, STRATEGIES |
| 模型定价 | src/pricing.ts | 所有 AI 模型的单价表 |
| Web 界面 | dashboard/index.html | 静态 HTML，Bun.serve 提供 |

## CODE MAP

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| program | Variable | src/index.ts:25 | 12+ | Commander CLI 实例 |
| logger | Object | src/index.ts:32 | 11 | 日志工具（debug/info/warn/error） |
| status | Function | src/commands/status.ts | 1 | 显示所有资源配额状态 |
| switchStrategy | Function | src/commands/switch.ts | 1 | 切换策略（performance/balanced/economical） |
| readTracker | Function | src/utils/tracker.ts | 8 | 读取追踪文件 |
| writeTracker | Function | src/utils/tracker.ts | 6 | 写入追踪文件 |
| STRATEGIES | Constant | src/types.ts:25 | 6 | 策略文件名映射（1/2/3） |
| TRACKER_PATH | Constant | src/types.ts:19 | 2 | ~/.omo-quota-tracker.json |
| CONFIG_PATH | Constant | src/types.ts:20 | 3 | ~/.config/opencode/oh-my-opencode.jsonc |

## CONVENTIONS

### Bun 特定规范（强制）
- **运行时**: 必须使用 `bun` 而非 `node`
  - `bun <file>` 代替 `node <file>`
  - `bun test` 代替 `jest`/`vitest`
  - `bun build` 代替 `webpack`/`esbuild`
  - `bun install` 代替 `npm install`
  - `bunx <package>` 代替 `npx <package>`
- **Web 服务器**: 使用 `Bun.serve()`（禁用 express）
- **数据库**: 使用 `bun:sqlite`（禁用 better-sqlite3）
- **文件操作**: 优先 `Bun.file`（禁用 node:fs）

### TypeScript 配置
- **模块系统**: ESM (`"type": "module"`)
- **编译目标**: ES2022
- **严格模式**: 开启 (`strict: true`)
- **输出目录**: dist/

### 项目架构
- **CLI 入口**: src/index.ts 带有 shebang `#!/usr/bin/env bun`
- **命令组织**: 每个 CLI 命令一个文件（src/commands/*.ts）
- **类型集中**: 所有类型定义在 src/types.ts
- **路径常量**: TRACKER_PATH, CONFIG_PATH, STRATEGIES_DIR 在 types.ts

### 文件命名
- 测试文件: `*.test.ts` 格式（使用 bun test）
- 命令文件: `<command>.ts` 在 src/commands/

### CI/CD
- **触发**: 仅标签推送 `v*` 和手动触发 `workflow_dispatch`
- **构建**: `bun build src/index.ts --outdir dist --target bun`
- **验证**: 检查 dist/index.js 存在性
- **类型检查**: `bunx tsc --noEmit`（允许失败）

## ANTI-PATTERNS (THIS PROJECT)

### 禁止使用的依赖
- ❌ **express** - 使用 `Bun.serve()` 代替
- ❌ **vite** - Bun 内置 HTML imports
- ❌ **better-sqlite3** - 使用 `bun:sqlite`
- ❌ **ioredis** - 使用 `Bun.redis`
- ❌ **ws** - 使用内置 `WebSocket`
- ❌ **execa** - 使用 `Bun.$\`ls\``

### 禁止的配置
- ❌ **ts-node** - Bun 直接执行 TypeScript
- ❌ **dotenv** - Bun 自动加载 .env

### 文件组织反模式
- ❌ **废弃文件未清理** - src/tracker.ts 和 src/config.ts 存在但未使用
- ❌ **配置路径重复** - types.ts 和 config.ts 定义相同路径（config.ts 未被使用）

### 🆕 Providers 回退链支持（新增）
**说明**: 策略文件现在支持 `providers` 字段，配置提供商回退链（与 oh-my-opencode 对齐）

**使用方式**: 
```bash
# 在策略文件中添加 providers 配置
"providers": {
  "anthropic": ["antigravity", "github-copilot"],
  "openai": ["anthropic", "google"],
  "google": ["openai", "anthropic"],
  "zhipuai-coding-plan": ["openai", "github-copilot"],
  "github-copilot": ["anthropic", "google"]
}
```

**验证命令**: `omo-quota validate-models -s <strategy>`

**降级机制**: oh-my-opencode 会按 providers 数组顺序尝试提供商，直到找到可用的模型

## COMMANDS

```bash
# 开发
bun run src/index.ts              # 运行 CLI
bun build src/index.ts            # 编译到 dist/

# 核心命令
omo-quota status                 # 显示配额状态
omo-quota switch <strategy>       # 切换策略
omo-quota reset <provider>        # 标记配额重置
omo-quota update <provider> <n>  # 更新使用量
omo-quota sync                   # 同步 oh-my-opencode 历史记录
omo-quota report daily            # 每日成本报告
omo-quota dashboard               # 启动 Web 仪表盘
omo-quota watch                  # 监控并预警
omo-quota doctor                 # 健康检查
omo-quota init                   # 初始化追踪文件
omo-quota list                   # 列出策略

# 测试（预期）
bun test                        # 运行测试（尚未实现）
```

## NOTES

### Bun 特性
- 支持 TypeScript 直接执行（无需编译）
- 自动加载 .env 环境变量
- 内置服务器、SQLite、Redis、WebSocket APIs
- 快速启动和低内存占用

### 项目状态
- ⚠️ **无测试文件** - 文档说明了 bun test 使用方式，但未实现任何测试
- ⚠️ **废弃文件** - src/tracker.ts 和 src/config.ts 应删除
- ⚠️ **CI 不包含测试** - 工作流仅进行类型检查和构建验证

### 配置文件路径
- 当前配置: `~/.config/opencode/oh-my-opencode.jsonc`
- 策略目录: `~/.config/opencode/strategies/`
- 配额追踪: `~/.omo-quota-tracker.json`
- 备份配置: `~/.config/opencode/oh-my-opencode.backup.jsonc`

### 策略文件编号硬编码
- performance → strategy-1-performance.jsonc
- balanced → strategy-2-balanced.jsonc
- economical → strategy-3-economical.jsonc
- **修改策略文件名需同步更新 src/types.ts**

### 🆕 Providers 回退链支持（新增）

**说明**: oh-my-opencode 内置了完整的 fallback 机制，当主模型不可用时，系统会自动尝试备用提供商。

**工作机制**:
```
1. 用户指定模型 → 跳过所有回退逻辑，直接使用
2. providers 回退链 → 按配置的 `providers` 数组顺序尝试提供商
3. 系统默认 → 所有提供商尝试完毕后回退到默认模型
```

**配置方式**: 在策略文件中添加 `providers` 字段：

```jsonc
{
  "providers": {
    "anthropic": ["antigravity", "github-copilot"],
    "openai": ["anthropic", "google"],
    "google": ["openai", "anthropic"],
    "zhipuai-coding-plan": ["openai", "github-copilot"],
    "github-copilot": ["anthropic", "google"]
  }
}
```

**验证命令**: `omo-quota validate-models -s balanced`

**显示内容**:
- 模型层级结构和主模型配置
- Providers 回退链（如果配置了）
- 模型可用性检查（验证 providers 配置）
- Fallback 路径预览（显示降级顺序）

**注意**: 
- omo-quota 无法验证模型实际可用性（需要 oh-my-opencode doctor --verbose 查看）
- 降级是 oh-my-opencode 的内部机制，不是 omo-quota 的功能
- 建议定期运行 `omo-quota doctor` 检查配置有效性
