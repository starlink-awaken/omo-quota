# Status 状态获取方案设计

## 当前实现(纯手动追踪)

优点:
- ✅ 简单可靠
- ✅ 不依赖外部 API
- ✅ 适用于所有提供商

缺点:
- ❌ 需要手动更新
- ❌ 可能与实际使用不同步

## 改进方案(混合追踪)

### 方案 A: oh-my-opencode 自动同步(推荐)

**原理**: oh-my-opencode 本身会记录每次 API 调用

**实现步骤**:
1. 读取 oh-my-opencode 的调用日志
2. 解析每次 API 调用的模型和 token 使用量
3. 自动更新 `~/.omo-quota-tracker.json`

**技术路径**:
```typescript
// 监听 oh-my-opencode 日志文件
const logPath = '~/.opencode-supermemory.log';

// 解析日志中的 API 调用记录
// 格式类似: [2026-01-30] anthropic/claude-sonnet-4.5: 1500 tokens

// 定期更新追踪文件
async function syncFromLogs() {
  const logs = await parseOmoLogs(logPath);
  const tracker = await loadTracker();
  
  for (const log of logs) {
    tracker.providers[log.provider].usage += log.tokens;
  }
  
  await saveTracker(tracker);
}
```

优点:
- ✅ 自动同步,无需手动
- ✅ 基于实际使用数据
- ✅ 不依赖外部 API

缺点:
- ⚠️ 需要解析日志格式
- ⚠️ 可能有解析错误

---

### 方案 B: Gemini 响应头追踪(部分自动)

**原理**: Gemini API 每次调用都返回配额信息

**实现**:
```typescript
// 创建 Gemini API wrapper
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiWithQuotaTracking {
  async generateContent(prompt: string) {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    
    // 提取配额信息
    const remainingRequests = response.headers.get('X-Goog-RateLimit-Remaining-Requests');
    const remainingTokens = response.headers.get('X-Goog-RateLimit-Remaining-Tokens');
    
    // 更新追踪文件
    await updateQuota('gemini-pro', {
      remainingRequests: parseInt(remainingRequests),
      remainingTokens: parseInt(remainingTokens)
    });
    
    return response.json();
  }
}
```

优点:
- ✅ 实时准确
- ✅ 官方数据
- ✅ 自动同步

缺点:
- ⚠️ 仅限 Gemini
- ⚠️ 需要 hook API 调用

---

### 方案 C: 定期提醒手动同步(最简单)

**实现**:
```bash
# 添加到 omo-quota status 命令
omo-quota status

# 输出末尾添加提示
┌─────────────────────────────────────────────┐
│ 💡 配额同步提醒                             │
├─────────────────────────────────────────────┤
│ Claude Pro 最后更新: 2小时前                │
│ 建议手动检查并更新:                         │
│   • 访问 https://console.anthropic.com      │
│   • 查看实际使用量                          │
│   • 运行: omo-quota update claude-pro <num> │
└─────────────────────────────────────────────┘
```

优点:
- ✅ 简单可靠
- ✅ 无技术复杂度
- ✅ 提醒用户同步

缺点:
- ❌ 仍需手动操作

---

## 推荐实施路线

### 阶段 1: 当前保持(完成 ✅)
- 手动追踪系统已完成
- 通过 `update` 命令手动更新

### 阶段 2: 添加自动提醒(可选)
```typescript
// 在 status 命令中添加
function showSyncReminder() {
  const tracker = loadTracker();
  const now = Date.now();
  
  // 检查上次更新时间
  for (const [provider, data] of Object.entries(tracker.providers)) {
    const lastUpdate = new Date(data.lastUpdate || 0);
    const hoursSinceUpdate = (now - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24) {
      console.log(chalk.yellow(`⚠️ ${provider} 已 ${hoursSinceUpdate}h 未更新,建议手动同步`));
    }
  }
}
```

### 阶段 3: oh-my-opencode 日志同步(高级)
- 解析 `~/.opencode-supermemory.log`
- 自动累计使用量
- 定期自动同步

---

## 当前最佳实践

### 每日工作流
```bash
# 1. 早上开始工作
omo-quota status

# 2. 发现配额接近上限
omo-quota switch economical

# 3. 配额重置后
omo-quota reset claude-pro

# 4. 定期手动同步(每周一次)
# 访问各平台官网查看实际使用量
omo-quota update claude-pro 85
omo-quota update zhipuai-max 2500
```

### 自动化提醒(可选)
```bash
# 添加到 crontab
# 每天上午9点提醒检查配额
0 9 * * * cd ~/Workspace/Tools/omo-quota && bun run src/index.ts status

# Fish shell: 每次打开终端时自动显示
# ~/.config/fish/conf.d/quota-reminder.fish
function check_quota --on-event fish_prompt
    if test (date +%H) -eq 9  # 只在早上9点提醒
        cd ~/Workspace/Tools/omo-quota && bun run src/index.ts status
    end
end
```

---

## 结论

**当前推荐**: 保持手动追踪,添加定期提醒

**原因**:
1. 个人账户无 Admin API 权限
2. 手动追踪简单可靠
3. 定期提醒确保同步
4. 避免过度工程化

**未来扩展**: 如果切换到企业账户,可以启用自动 API 查询
