/**
 * Configuration module
 *
 * Provides path constants and configuration loading functions.
 */

import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// ============================================================================
// PATHS
// ============================================================================

/**
 * Get base path for omo-quota
 */
export function getBasePath(): string {
  return process.env.OMO_QUOTA_HOME || join(homedir(), 'omo-quota');
}

/**
 * Path constants
 */
export const PATHS = {
  tracker: join(homedir(), '.omo-quota-tracker.json'),
  opencodeConfig: join(homedir(), '.config', 'opencode'),
  strategiesDir: join(homedir(), '.config', 'opencode', 'strategies'),
  currentConfig: join(homedir(), '.config', 'opencode', 'oh-my-opencode.jsonc'),
  backupConfig: join(homedir(), '.config', 'opencode', 'oh-my-opencode.backup.jsonc'),
} as const;

/**
 * Message storage path for oh-my-opencode
 */
export const MESSAGE_STORAGE_PATH = join(homedir(), '.local', 'share', 'opencode', 'storage', 'message');

// ============================================================================
// STRATEGY PATHS
// ============================================================================

/**
 * Get strategy number from name
 */
function getStrategyNumber(strategy: string): number {
  const numbers: Record<string, number> = {
    performance: 1,
    balanced: 2,
    economical: 3,
  };
  return numbers[strategy] || 0;
}

/**
 * Get strategy file path
 */
export function getStrategyPath(strategy: string): string {
  return join(PATHS.strategiesDir, `strategy-${getStrategyNumber(strategy)}-${strategy}.jsonc`);
}

/**
 * Get all strategy file paths
 */
export function getAllStrategyPaths(): Record<string, string> {
  return {
    performance: getStrategyPath('performance'),
    balanced: getStrategyPath('balanced'),
    economical: getStrategyPath('economical'),
  };
}

// ============================================================================
// CONFIG LOADING
// ============================================================================

/**
 * Parse JSONC file (with comments)
 */
export function parseJsonc(content: string): unknown {
  // Remove comments (both // and /* */)
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
  return JSON.parse(withoutComments);
}

/**
 * Load strategy config file
 */
export function loadStrategyConfig(strategy: string): unknown | null {
  const path = getStrategyPath(strategy);

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return parseJsonc(content);
  } catch (error) {
    console.error(`读取策略文件失败 (${strategy}):`, error);
    return null;
  }
}

/**
 * Load current oh-my-opencode config
 */
export function loadCurrentConfig(): unknown | null {
  if (!existsSync(PATHS.currentConfig)) {
    return null;
  }

  try {
    const content = readFileSync(PATHS.currentConfig, 'utf-8');
    return parseJsonc(content);
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return null;
  }
}

/**
 * Check if config exists
 */
export function hasConfig(): boolean {
  return existsSync(PATHS.currentConfig);
}

/**
 * Check if tracker exists
 */
export function hasTracker(): boolean {
  return existsSync(PATHS.tracker);
}

/**
 * Check if strategies directory exists
 */
export function hasStrategies(): boolean {
  return existsSync(PATHS.strategiesDir);
}
