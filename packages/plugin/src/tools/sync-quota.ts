/**
 * sync-quota tool
 *
 * Syncs usage records from oh-my-opencode message history.
 * Can either call the CLI sync command or parse messages directly.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { existsSync } from 'fs';
import { join } from 'path';

// Default message storage path for oh-my-opencode
const DEFAULT_STORAGE_PATH = `${process.env.HOME}/.local/share/opencode/storage/message`;
// Tracker data path
const TRACKER_PATH = `${process.env.HOME}/.omo-quota-tracker.json`;

interface MessageData {
  id: string;
  providerID: string;
  modelID: string;
  tokens: {
    input: number;
    output: number;
    reasoning?: number;
    cache?: {
      read: number;
      write: number;
    };
  };
  time: {
    created: number;
    completed?: number;
  };
}

interface TrackerData {
  providers: Record<string, {
    lastReset?: string;
    nextReset?: string;
    resetInterval?: string;
    usage?: number;
    used?: number;
    limit?: number;
    month?: string;
    balance?: string;
    currency?: string;
  }>;
  currentStrategy: string;
}

/**
 * Parse a single message file
 */
async function parseMessage(filePath: string): Promise<MessageData | null> {
  try {
    const file = Bun.file(filePath);
    const content = await file.json();

    if (content.role !== 'assistant' || !content.tokens) {
      return null;
    }

    return {
      id: content.id,
      providerID: content.providerID || 'unknown',
      modelID: content.modelID || 'unknown',
      tokens: {
        input: content.tokens.input || 0,
        output: content.tokens.output || 0,
        reasoning: content.tokens.reasoning,
        cache: content.tokens.cache
      },
      time: {
        created: content.time?.created || Date.now(),
        completed: content.time?.completed
      }
    };
  } catch {
    return null;
  }
}

/**
 * Scan a single session directory for messages
 */
async function scanSessionDirectory(sessionDir: string): Promise<MessageData[]> {
  const messages: MessageData[] = [];

  try {
    const glob = new Bun.Glob('msg_*.json');
    const files = Array.from(glob.scanSync(sessionDir));

    for (const file of files) {
      const fullPath = `${sessionDir}/${file}`;
      const data = await parseMessage(fullPath);
      if (data) {
        messages.push(data);
      }
    }
  } catch {
    // Session directory might not exist or be inaccessible
  }

  return messages;
}

/**
 * Scan all session directories
 */
async function scanAllSessions(storageDir: string): Promise<MessageData[]> {
  const allMessages: MessageData[] = [];

  if (!existsSync(storageDir)) {
    return allMessages;
  }

  try {
    const glob = new Bun.Glob('ses_*');
    const sessions = Array.from(glob.scanSync(storageDir));

    for (const session of sessions) {
      const sessionPath = `${storageDir}/${session}`;
      const messages = await scanSessionDirectory(sessionPath);
      allMessages.push(...messages);
    }
  } catch {
    // Storage directory might not exist or be inaccessible
  }

  return allMessages;
}

/**
 * Load tracker data from file
 */
async function loadTracker(): Promise<TrackerData> {
  if (!existsSync(TRACKER_PATH)) {
    return {
      providers: {},
      currentStrategy: 'balanced'
    };
  }

  try {
    const data = Bun.file(TRACKER_PATH);
    const content = await data.json();
    return content as TrackerData;
  } catch {
    return {
      providers: {},
      currentStrategy: 'balanced'
    };
  }
}

/**
 * Save tracker data to file
 */
function saveTracker(data: TrackerData): void {
  try {
    const dir = TRACKER_PATH.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) {
      Bun.write(`${dir}/.gitkeep`, '');
    }
    Bun.write(TRACKER_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Fail silently
  }
}

/**
 * Format a number with thousand separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Get the last sync time from tracker
 */
async function getLastSyncTime(): Promise<Date | null> {
  try {
    const lastSyncFile = `${TRACKER_PATH}.last-sync`;
    if (existsSync(lastSyncFile)) {
      const content = Bun.file(lastSyncFile);
      const timestamp = parseInt(await content.text());
      return new Date(timestamp);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Update the last sync time
 */
function updateLastSyncTime(): void {
  try {
    const lastSyncFile = `${TRACKER_PATH}.last-sync`;
    Bun.write(lastSyncFile, Date.now().toString());
  } catch {
    // Ignore errors
  }
}

/**
 * Check if sync should run (avoid too frequent syncs)
 */
async function shouldSync(force?: boolean): Promise<boolean> {
  if (force) {
    return true;
  }

  const lastSync = await getLastSyncTime();
  if (!lastSync) {
    return true;
  }

  // Only sync if last sync was more than 5 minutes ago
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - lastSync.getTime() > fiveMinutes;
}

/**
 * Calculate provider name for display
 */
function formatProviderName(providerID: string): string {
  // Map common provider IDs to readable names
  const nameMap: Record<string, string> = {
    'anthropic': 'Anthropic Claude',
    'openai': 'OpenAI',
    'google': 'Google Gemini',
    'zhipuai': 'ZhiPuAI',
    'github-copilot': 'GitHub Copilot',
    'deepseek': 'DeepSeek'
  };

  const key = providerID.toLowerCase().split('-')[0];
  return nameMap[key] || providerID;
}

/**
 * Main sync function
 */
async function syncQuotaInternal(force?: boolean): Promise<string> {
  // Check if sync is needed
  if (!(await shouldSync(force))) {
    const lastSync = await getLastSyncTime();
    const timeAgo = Math.floor((Date.now() - lastSync!.getTime()) / 60000);
    return `最近已在 ${timeAgo} 分钟前同步过。使用 force: true 强制重新同步。`;
  }

  const startTime = Date.now();

  // Scan all sessions
  const messages = await scanAllSessions(DEFAULT_STORAGE_PATH);

  if (messages.length === 0) {
    return `未找到消息记录。请确保 oh-my-opencode 已被使用。\n扫描路径: ${DEFAULT_STORAGE_PATH}`;
  }

  // Aggregate by provider
  const providerUsage = new Map<string, { tokens: number; messages: number }>();

  for (const msg of messages) {
    const totalTokens = msg.tokens.input + msg.tokens.output;
    const current = providerUsage.get(msg.providerID);
    if (current) {
      current.tokens += totalTokens;
      current.messages += 1;
    } else {
      providerUsage.set(msg.providerID, { tokens: totalTokens, messages: 1 });
    }
  }

  // Load and update tracker
  const tracker = await loadTracker();

  const lines: string[] = [];
  lines.push('📊 配额同步完成\n');
  lines.push(`找到 ${formatNumber(messages.length)} 条助手消息\n`);
  lines.push('提供商使用情况:\n');

  for (const [provider, data] of providerUsage.entries()) {
    const name = formatProviderName(provider);

    if (!tracker.providers[provider]) {
      tracker.providers[provider] = {};
    }

    tracker.providers[provider].usage = data.tokens;

    lines.push(`  • ${name}:`);
    lines.push(`    ${formatNumber(data.tokens)} tokens (${data.messages} 条消息)`);
  }

  // Save tracker
  saveTracker(tracker);
  updateLastSyncTime();

  const elapsed = Date.now() - startTime;

  lines.push(`\n✓ 同步完成 (耗时 ${elapsed}ms)`);
  lines.push(`  已更新: ${TRACKER_PATH}`);

  return lines.join('\n');
}

/**
 * Export the tool
 */
export const syncQuotaTool: ToolDefinition = tool({
  description: 'Sync usage records from oh-my-opencode message history to update quota tracker data',
  args: {
    force: tool.schema.boolean().optional().describe('Force sync even if recently synced (within last 5 minutes)')
  },
  async execute(args, context): Promise<string> {
    try {
      return await syncQuotaInternal(args.force);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return `❌ 同步失败: ${errorMsg}`;
    }
  }
});
