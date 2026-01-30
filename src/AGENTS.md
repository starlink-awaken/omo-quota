# SOURCE CODE KNOWLEDGE BASE

**Generated:** 2026-01-30
**Parent:** ./AGENTS.md

## CONVENTIONS

### 导入模式
- 命令导入工具: `import { readTracker } from '../utils/tracker'`
- 类型导入: `import { ProviderStatus, TRACKER_PATH } from '../types'`
- 路径导入: `import { TRACKER_PATH, CONFIG_PATH, STRATEGIES } from '../types'`

### 命令文件结构
每个命令文件导出单个函数：
```typescript
export function status() { /* 实现 */ }
export function switchStrategy(strategy: string) { /* 实现 */ }
export function reset(provider: string) { /* 实现 */ }
```

### CLI 选项处理
- 全局选项在 index.ts 处理（--verbose, --log, --silent）
- 命令选项在各命令文件中处理
- 使用 hook('preAction') 设置日志级别

### 策略文件编号
硬编码在 types.ts：
- performance → strategy-1-performance.jsonc
- balanced → strategy-2-balanced.jsonc
- economical → strategy-3-economical.jsonc

**重要**: 修改策略文件名需同步更新 types.ts:25-29

### Web 仪表盘
- 使用 `Bun.serve()` 启动服务器（默认端口 3737）
- 静态文件从 dashboard/index.html 提供
- API 端点: `/api/tracker` 返回配额数据

## ANTI-PATTERNS (THIS PROJECT)

### 废弃文件（应删除）
- ❌ **src/tracker.ts** - 未被任何代码引用，导入不存在的类型
- ❌ **src/config.ts** - 未被使用，与 types.ts 重复
- ❌ **src/utils.ts** - 未被使用
