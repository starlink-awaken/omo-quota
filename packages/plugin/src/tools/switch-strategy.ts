/**
 * switch-strategy Tool
 *
 * 切换 AI 配额管理策略工具
 *
 * 功能:
 * 1. 验证策略名称（performance/balanced/economical）
 * 2. 备份当前配置
 * 3. 复制策略文件到配置路径
 * 4. 更新tracker记录
 * 5. 显示变更摘要
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin";
import type { ToolContext } from "@opencode-ai/plugin";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ============================================================================
// 常量定义
// ============================================================================

// 策略文件映射
const STRATEGIES: Record<string, string> = {
  performance: "strategy-1-performance.jsonc",
  balanced: "strategy-2-balanced.jsonc",
  economical: "strategy-3-economical.jsonc",
};

// 策略显示名称
const STRATEGY_NAMES: Record<string, string> = {
  performance: "极致性能型",
  balanced: "均衡实用型",
  economical: "极致省钱型",
};

// Agent 显示名称映射（用于变更摘要）
const AGENT_NAMES: Record<string, string> = {
  Sisyphus: "Sisyphus",
  oracle: "Oracle",
  prometheus: "Prometheus",
  metis: "Metis",
  momus: "Momus",
  librarian: "Librarian",
  explore: "Explore",
  atlas: "Atlas",
  "multimodal-looker": "Multimodal-Looker",
};

// 路径配置
const getPaths = () => ({
  home: homedir(),
  configDir: join(homedir(), ".config", "opencode"),
  strategiesDir: join(homedir(), ".config", "opencode", "strategies"),
  configPath: join(homedir(), ".config", "opencode", "oh-my-opencode.jsonc"),
  backupPath: join(homedir(), ".config", "opencode", "oh-my-opencode.backup.jsonc"),
  trackerPath: join(homedir(), ".omo-quota-tracker.json"),
});

// ============================================================================
// 类型定义
// ============================================================================

interface AgentConfig {
  model: string;
  temperature?: number;
  primary_provider?: string;
  fallback_providers?: string[];
  variant?: string;
}

interface StrategyConfig {
  $schema?: string;
  description: string;
  providers?: Record<string, string[]>;
  agents: Record<string, AgentConfig>;
  categories?: Record<string, { model: string; temperature?: number; variant?: string }>;
  metadata?: {
    version?: string;
    created?: string;
    cost_level?: string;
    use_case?: string;
  };
}

interface TrackerData {
  currentStrategy: string;
  providers: Record<string, unknown>;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 验证策略名称是否有效
 */
function isValidStrategy(strategy: string): boolean {
  return strategy in STRATEGIES;
}

/**
 * 获取可用的策略列表
 */
function getAvailableStrategies(): string[] {
  const paths = getPaths();
  const available: string[] = [];

  for (const [name, filename] of Object.entries(STRATEGIES)) {
    const strategyPath = join(paths.strategiesDir, filename);
    if (existsSync(strategyPath)) {
      available.push(name);
    }
  }

  return available;
}

/**
 * 解析 JSONC 文件（支持注释）
 */
function parseJSONC(content: string): StrategyConfig | null {
  try {
    // 移除单行注释 // ...
    const withoutSingleLineComments = content.replace(/\/\/.*$/gm, "");
    // 移除多行注释 /* ... */
    const withoutMultiLineComments = withoutSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, "");
    return JSON.parse(withoutMultiLineComments) as StrategyConfig;
  } catch {
    return null;
  }
}

/**
 * 读取策略文件
 */
function readStrategyFile(strategyPath: string): StrategyConfig | null {
  try {
    const content = readFileSync(strategyPath, "utf-8");
    return parseJSONC(content);
  } catch {
    return null;
  }
}

/**
 * 读取当前配置文件
 */
function readCurrentConfig(configPath: string): StrategyConfig | null {
  try {
    if (!existsSync(configPath)) {
      return null;
    }
    const content = readFileSync(configPath, "utf-8");
    return parseJSONC(content);
  } catch {
    return null;
  }
}

/**
 * 读取 tracker 文件
 */
function readTracker(trackerPath: string): TrackerData | null {
  try {
    if (!existsSync(trackerPath)) {
      return null;
    }
    const content = readFileSync(trackerPath, "utf-8");
    return JSON.parse(content) as TrackerData;
  } catch {
    return null;
  }
}

/**
 * 保存 tracker 文件
 */
function saveTracker(trackerPath: string, data: TrackerData): boolean {
  try {
    writeFileSync(trackerPath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * 提取模型显示名称（去掉 provider 前缀）
 */
function extractModelName(model: string): string {
  // 格式: provider/model 或 just model
  const parts = model.split("/");
  return parts.length > 1 ? parts[1] : model;
}

/**
 * 比较两个策略的差异，生成变更摘要
 */
function compareStrategies(
  oldConfig: StrategyConfig | null,
  newConfig: StrategyConfig
): string[] {
  const changes: string[] = [];

  if (!oldConfig) {
    changes.push("初始化配置");
    return changes;
  }

  const oldAgents = oldConfig.agents || {};
  const newAgents = newConfig.agents || {};

  // 获取所有 agent 名称（去重）
  const allAgentNames = new Set([
    ...Object.keys(oldAgents),
    ...Object.keys(newAgents),
  ]);

  // 比较每个 agent 的模型配置
  for (const agentName of allAgentNames) {
    const oldAgent = oldAgents[agentName];
    const newAgent = newAgents[agentName];

    if (!oldAgent) {
      const displayName = AGENT_NAMES[agentName] || agentName;
      const modelName = extractModelName(newAgent.model);
      changes.push(`${displayName}: 新增 → ${modelName}`);
    } else if (!newAgent) {
      const displayName = AGENT_NAMES[agentName] || agentName;
      changes.push(`${displayName}: 已移除`);
    } else if (oldAgent.model !== newAgent.model) {
      const displayName = AGENT_NAMES[agentName] || agentName;
      const oldModel = extractModelName(oldAgent.model);
      const newModel = extractModelName(newAgent.model);
      changes.push(`${displayName}: ${oldModel} → ${newModel}`);
    }
  }

  return changes;
}

/**
 * 格式化变更摘要
 */
function formatChanges(changes: string[]): string {
  if (changes.length === 0) {
    return "  (无变更)";
  }

  return "  " + changes.join("\n  ");
}

// ============================================================================
// 主工具实现
// ============================================================================

/**
 * switch-strategy 工具
 *
 * 切换配额管理策略
 */
export const switchStrategyTool: ToolDefinition = tool({
  description: "Switch between quota management strategies (performance/balanced/economical)",
  args: {
    strategy: tool.schema
      .enum(["performance", "balanced", "economical"])
      .describe("The strategy to switch to: performance (极致性能), balanced (均衡实用), economical (极致省钱)"),
  },
  async execute(
    args: { strategy: string },
    _context: ToolContext
  ): Promise<string> {
    const { strategy } = args;
    const paths = getPaths();

    // ========================================================================
    // 1. 验证策略名称
    // ========================================================================

    if (!isValidStrategy(strategy)) {
      const available = getAvailableStrategies();
      return `✗ 无效的策略名称: "${strategy}"

💡 可用策略:
  ${available.map(s => `• ${s} - ${STRATEGY_NAMES[s]}`).join("\n  ")}

使用命令: switch-strategy {strategy}
`;
    }

    // ========================================================================
    // 2. 检查策略文件是否存在
    // ========================================================================

    const strategyFilename = STRATEGIES[strategy];
    const strategyPath = join(paths.strategiesDir, strategyFilename);

    if (!existsSync(strategyPath)) {
      return `✗ 策略文件不存在: ${strategyPath}

💡 可能的解决方案:

  1. 运行初始化生成策略模板:
     omo-quota init

  2. 验证策略文件状态:
     omo-quota doctor

  3. 查看所有可用策略:
     omo-quota list

💡 提示: 策略文件应位于 ~/.config/opencode/strategies/ 目录
`;
    }

    // ========================================================================
    // 3. 读取策略配置
    // ========================================================================

    const newStrategy = readStrategyFile(strategyPath);
    if (!newStrategy) {
      return `✗ 无法解析策略文件: ${strategyPath}

请检查文件格式是否正确，或运行:
  omo-quota doctor
`;
    }

    // ========================================================================
    // 4. 备份当前配置
    // ========================================================================

    const currentConfig = readCurrentConfig(paths.configPath);
    if (existsSync(paths.configPath)) {
      try {
        copyFileSync(paths.configPath, paths.backupPath);
      } catch (error) {
        return `✗ 备份配置失败: ${error}

操作已取消，未做任何修改。
`;
      }
    }

    // ========================================================================
    // 5. 应用新策略
    // ========================================================================

    try {
      // 读取原始策略文件内容（保留注释和格式）
      const strategyContent = readFileSync(strategyPath, "utf-8");
      writeFileSync(paths.configPath, strategyContent, "utf-8");
    } catch (error) {
      // 尝试恢复备份
      if (existsSync(paths.backupPath)) {
        try {
          copyFileSync(paths.backupPath, paths.configPath);
        } catch {
          // 恢复失败，但继续报告错误
        }
      }
      return `✗ 应用策略失败: ${error}

已尝试恢复之前的配置。
`;
    }

    // ========================================================================
    // 6. 更新 tracker 记录
    // ========================================================================

    let tracker = readTracker(paths.trackerPath);
    if (!tracker) {
      tracker = {
        currentStrategy: strategy,
        providers: {},
      };
    } else {
      tracker.currentStrategy = strategy;
    }

    if (!saveTracker(paths.trackerPath, tracker)) {
      // Tracker 更新失败不影响策略切换，仅记录警告
      console.warn("[omo-quota] 警告: 无法更新 tracker 文件");
    }

    // ========================================================================
    // 7. 生成变更摘要
    // ========================================================================

    const changes = compareStrategies(currentConfig, newStrategy);
    const changesText = formatChanges(changes);

    // ========================================================================
    // 8. 返回成功消息
    // ========================================================================

    const strategyDisplayName = STRATEGY_NAMES[strategy] || strategy;

    let output = `✅ 已切换到 ${strategy} (${strategyDisplayName})

`;

    if (changes.length > 0) {
      output += `变更:
${changesText}

`;
    }

    output += `💡 配置将在下次 OpenCode 会话生效

文件位置:
  • 配置: ${paths.configPath}
  • 备份: ${paths.backupPath}
  • 策略: ${strategyPath}
`;

    return output;
  },
});

// 默认导出
export default switchStrategyTool;
