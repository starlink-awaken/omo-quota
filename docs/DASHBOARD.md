# Web 仪表盘使用指南

## 概述

`omo-quota dashboard` 启动一个实时 Web 监控界面,让你可以:
- 🌐 在浏览器中查看配额状态
- 📊 实时监控各提供商使用情况
- 🎨 彩色可视化进度条
- ⚡ 自动刷新 (每 5 秒)
- 📱 支持移动设备

## 快速开始

### 启动仪表盘

```bash
cd ~/Workspace/Tools/omo-quota
node src/index.ts dashboard
```

**输出**:
```
🌐 OMO Quota Dashboard 已启动

访问地址:
  本地: http://localhost:3737
  网络: http://192.168.1.100:3737

按 Ctrl+C 停止服务器
```

### 自定义端口

```bash
# 使用自定义端口
node src/index.ts dashboard -p 8080
node src/index.ts dashboard --port 8080

# 访问 http://localhost:8080
```

### 访问仪表盘

1. 启动 dashboard 命令
2. 打开浏览器
3. 访问 `http://localhost:3737`
4. 仪表盘会自动每 5 秒刷新一次

## 界面功能

### 主界面布局

```
┌────────────────────────────────────────────────────────────┐
│                  OMO Quota Dashboard                        │
│                                                             │
│  当前策略: balanced                最后更新: 10:09:11       │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  📊 各提供商配额状态                                        │
│                                                             │
│  OpenAI                                                     │
│  ████████████░░░░░░░░ 45/200 美元 (22.5%)                 │
│  ✅ 配额充足                                                │
│                                                             │
│  Anthropic                                                  │
│  ██████████████████░░ 180/200 美元 (90%)                  │
│  ⚠️ 配额即将耗尽!                                           │
│  距离重置: 5 小时                                          │
│                                                             │
│  Google Gemini #1                                           │
│  ████████░░░░░░░░░░░░ 60/150 次 (40%)                     │
│  ✅ 配额正常                                                │
│  距离重置: 5 小时                                          │
│                                                             │
│  ZhiPuAI                                                    │
│  ██████████░░░░░░░░░░ 1200/6000 次 (20%)                  │
│  ✅ 配额充足                                                │
│  距离重置: 5 小时                                          │
│                                                             │
│  Github Copilot Premium                                     │
│  ███████████████████░ 285/300 次 (95%)                    │
│  🔴 配额严重不足!                                           │
│  月度配额,下月重置                                         │
│                                                             │
│  DeepSeek                                                   │
│  ██████████████████░░ ¥180/¥300 余额 (60%)                │
│  ✅ 余额充足                                                │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  💡 智能建议:                                               │
│  • Anthropic 配额即将耗尽,建议切换到 economical 模式      │
│  • Github Copilot Premium 仅剩 15 次,谨慎使用             │
│                                                             │
│  [🔄 立即刷新]  [⚙️ 切换策略]  [📊 查看报告]              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 配额状态颜色

| 使用率 | 颜色 | 状态 | 说明 |
|--------|------|------|------|
| 0-50% | 🟢 绿色 | 配额充足 | 可以正常使用 |
| 50-70% | 🟡 黄色 | 配额正常 | 建议关注使用 |
| 70-90% | 🟠 橙色 | 配额紧张 | 建议降级策略 |
| 90-100% | 🔴 红色 | 配额严重不足 | 立即降级或等待重置 |

### 实时更新

- **自动刷新**: 每 5 秒自动从服务器获取最新数据
- **手动刷新**: 点击 "立即刷新" 按钮
- **连接状态**: 左上角显示连接状态

```
🟢 已连接  - 正常运行
🟡 重新连接中 - 网络波动
🔴 连接断开 - 服务器停止
```

## 使用场景

### 场景 1: 一边开发一边监控

```bash
# 终端 1: 启动仪表盘
cd ~/Workspace/Tools/omo-quota
node src/index.ts dashboard

# 浏览器: 访问 http://localhost:3737

# 终端 2: 正常使用 oh-my-opencode
# 仪表盘会实时显示配额变化
```

### 场景 2: 第二屏幕显示

如果你有多个屏幕:

1. 主屏幕: VSCode / 开发环境
2. 副屏幕: 浏览器显示 omo-quota dashboard
3. 实时观察 AI 使用情况

### 场景 3: 远程监控 (局域网)

```bash
# 服务器上启动
cd ~/Workspace/Tools/omo-quota
node src/index.ts dashboard

# 输出显示网络地址
网络: http://192.168.1.100:3737

# 局域网内其他设备访问该地址
# 手机、平板、其他电脑都可以查看
```

### 场景 4: 团队协作

如果团队共享 AI 配额:

```bash
# 团队服务器上启动
cd ~/Workspace/Tools/omo-quota
node src/index.ts dashboard -p 8080

# 团队成员访问
http://team-server:8080

# 所有人都能看到实时配额状态
```

## 高级功能

### API 端点

仪表盘提供 JSON API,可以集成到其他工具:

```bash
# 获取配额状态 (JSON)
curl http://localhost:3737/api/status

# 输出示例
{
  "currentStrategy": "balanced",
  "providers": {
    "openai": {
      "used": 45,
      "limit": 200,
      "percentage": 22.5,
      "status": "healthy"
    },
    "anthropic": {
      "used": 180,
      "limit": 200,
      "percentage": 90,
      "status": "critical"
    }
  },
  "lastUpdated": "2026-01-30T10:09:11Z"
}
```

### 集成到其他工具

**Alfred Workflow** (macOS):

```applescript
-- 显示配额状态
do shell script "curl -s http://localhost:3737/api/status | jq '.providers.openai.percentage'"
```

**Raycast Script** (macOS):

```bash
#!/bin/bash
# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Show Quota
# @raycast.mode inline

curl -s http://localhost:3737/api/status | jq -r '.providers | to_entries[] | "\(.key): \(.value.percentage)%"'
```

**tmux 状态栏**:

```bash
# ~/.tmux.conf
set -g status-right '#(curl -s http://localhost:3737/api/status | jq -r ".providers.openai.percentage")% quota'
```

### 数据导出

从 API 导出数据:

```bash
# 导出为 JSON
curl -s http://localhost:3737/api/status > quota-snapshot.json

# 导出为 CSV
curl -s http://localhost:3737/api/status | jq -r '.providers | to_entries[] | [.key, .value.used, .value.limit, .value.percentage] | @csv' > quota.csv
```

## 浏览器兼容性

### 支持的浏览器

| 浏览器 | 版本 | 支持 |
|--------|------|------|
| Chrome | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |
| Opera | 76+ | ✅ 完全支持 |

### 移动设备

| 设备 | 支持 | 说明 |
|------|------|------|
| iOS Safari | ✅ | 响应式设计,自动适配 |
| Android Chrome | ✅ | 完全支持 |
| 平板 | ✅ | 优化布局 |

## 安全注意事项

### 仅本地访问

默认情况下,仪表盘只监听 `localhost`:

```
✅ 安全: http://localhost:3737 (仅本机访问)
⚠️ 风险: http://0.0.0.0:3737 (所有网络接口)
```

### 局域网访问

如需局域网访问,确保:

1. ✅ 局域网是可信网络 (家庭 / 公司)
2. ✅ 配额数据不含敏感信息
3. ⚠️ 不要暴露到公网

### 防火墙规则

```bash
# macOS: 允许特定端口
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add ~/Workspace/Tools/omo-quota

# Linux: iptables 规则
sudo iptables -A INPUT -p tcp --dport 3737 -s 192.168.1.0/24 -j ACCEPT
```

## 故障排查

### 问题 1: "端口已被占用"

```
❌ 错误: Error: EADDRINUSE: address already in use :::3737
```

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :3737

# 杀死该进程
kill -9 <PID>

# 或使用其他端口
node src/index.ts dashboard -p 8080
```

### 问题 2: "无法访问仪表盘"

```
浏览器显示: ERR_CONNECTION_REFUSED
```

**排查步骤**:

```bash
# 1. 确认服务器正在运行
ps aux | grep "node.*dashboard"

# 2. 确认端口监听
lsof -i :3737

# 3. 测试连接
curl http://localhost:3737

# 4. 检查防火墙
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Linux
sudo iptables -L
```

### 问题 3: "数据不刷新"

```
仪表盘显示: 最后更新: 10 分钟前
```

**原因**:
- 服务器停止响应
- 浏览器 JavaScript 错误
- 网络连接问题

**解决方案**:

```bash
# 1. 手动刷新浏览器 (Ctrl+F5)

# 2. 查看浏览器控制台错误
# F12 → Console

# 3. 重启仪表盘
# Ctrl+C 停止
cd ~/Workspace/Tools/omo-quota && node src/index.ts dashboard
```

### 问题 4: "移动设备无法访问"

```
手机浏览器: 无法连接到 http://192.168.1.100:3737
```

**解决方案**:

```bash
# 1. 确认设备在同一局域网
ping 192.168.1.100

# 2. 确认服务器监听所有接口
# 查看启动日志,确保显示 "网络: http://192.168.x.x:3737"

# 3. 检查防火墙规则
# 可能需要临时关闭防火墙测试
```

## 性能优化

### 减少刷新频率

默认 5 秒刷新,如需减少服务器负载:

**修改 `dashboard/index.html`**:

```javascript
// 当前: 5000ms (5秒)
setInterval(fetchStatus, 5000);

// 修改为: 10000ms (10秒)
setInterval(fetchStatus, 10000);
```

### 禁用自动刷新

如果只需要手动刷新:

```javascript
// 注释掉自动刷新
// setInterval(fetchStatus, 5000);

// 仅保留手动刷新按钮
```

### 缓存优化

服务器端缓存 (未来功能):

```typescript
// TODO: 实现缓存
let cachedStatus = null;
let cacheTime = 0;

function getStatus() {
  const now = Date.now();
  if (cachedStatus && (now - cacheTime) < 3000) {
    return cachedStatus;
  }
  
  // 重新读取数据
  cachedStatus = readQuotaStatus();
  cacheTime = now;
  return cachedStatus;
}
```

## 技术实现

### 架构

```
浏览器                     服务器
  │                          │
  ├─── GET / ─────────────→ 返回 HTML
  │                          │
  ├─── GET /api/status ───→ 读取追踪文件
  │                          │
  │   ← JSON 数据 ──────────┤
  │                          │
  └─── (每 5秒重复)          │
```

### 技术栈

- **后端**: Bun.serve() (内置 HTTP 服务器)
- **前端**: 原生 HTML + CSS + JavaScript (无依赖)
- **数据格式**: JSON
- **刷新机制**: setInterval + fetch API

### 文件结构

```
dashboard/
└── index.html         # 单文件应用
    ├── HTML 结构
    ├── CSS 样式
    └── JavaScript 逻辑
```

## 未来功能 (TODO)

### 计划中的功能

1. **历史图表**: 显示配额使用趋势图
2. **策略切换**: 直接在界面切换策略
3. **成本预估**: 实时显示本月预计成本
4. **告警通知**: 浏览器通知 (Notification API)
5. **暗色模式**: 支持深色主题
6. **WebSocket**: 真正的实时推送 (替代轮询)
7. **多用户**: 团队配额分配显示

### 社区贡献

欢迎提交 PR 实现以上功能!

```bash
# Fork 项目
git clone https://github.com/your-username/omo-quota.git

# 编辑 dashboard/index.html 或 src/commands/dashboard.ts

# 提交 PR
```

## 相关命令

| 命令 | 说明 | 关系 |
|------|------|------|
| `dashboard` | Web 仪表盘 | 可视化展示 |
| `status` | 终端查看配额 | 命令行版本 |
| `sync` | 同步数据 | 数据源 |
| `report` | 成本报告 | 详细分析 |

## 最佳实践

1. **开发时常驻**: 开发时保持 dashboard 运行,随时监控
2. **多屏显示**: 如有多屏,专门一屏显示仪表盘
3. **局域网共享**: 团队协作时共享仪表盘地址
4. **移动监控**: 用平板显示仪表盘,放在桌面
5. **集成 API**: 将配额数据集成到其他工具 (Alfred, Raycast 等)

---

**下一步**: 
- 返回主文档 → [README.md](../README.md)
- 学习自动同步 → [SYNC.md](SYNC.md)
- 学习成本分析 → [COST_ANALYSIS.md](COST_ANALYSIS.md)
