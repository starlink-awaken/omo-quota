/**
 * 策略迁移和版本管理系统
 *
 * 负责处理策略版本更新和配置迁移
 */

import type {
  StrategyConfig,
  MigrationRule,
  StrategyVersion,
} from '../types/strategy.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';

/**
 * 当前支持的 schema 版本
 */
const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * 策略版本历史
 */
const VERSION_HISTORY: Record<string, string> = {
  '1.0.0': '初始版本，支持完整的 agent、categories、providers 配置',
};

/**
 * 已知的迁移规则
 */
const MIGRATION_RULES: MigrationRule[] = [
  // 未来可以添加迁移规则，例如：
  // {
  //   fromVersion: '0.9.0',
  //   toVersion: '1.0.0',
  //   migrate: (config) => { ... }
  // },
];

/**
 * 策略迁移管理器
 */
export class StrategyMigrationManager {
  private rules: MigrationRule[];

  constructor(customRules?: MigrationRule[]) {
    this.rules = customRules || MIGRATION_RULES;
  }

  /**
   * 检测策略版本
   */
  detectVersion(filePath: string): string | null {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const config = parseJSONC(content) as StrategyConfig;

      // 检查 _metadata.version
      if (config._metadata?.version) {
        const v = config._metadata.version;
        return `${v.major}.${v.minor}.${v.patch}`;
      }

      // 检查 $schema 版本
      if (config.$schema) {
        const match = config.$schema.match(/(\d+\.\d+\.\d+)/);
        if (match) {
          return match[1];
        }
      }

      // 默认版本
      return '1.0.0';
    } catch {
      return null;
    }
  }

  /**
   * 验证版本兼容性
   */
  isCompatible(version: string): boolean {
    const parts = version.split('.').map(Number);
    const current = CURRENT_SCHEMA_VERSION.split('.').map(Number);

    // 主版本号必须匹配
    return parts[0] === current[0];
  }

  /**
   * 检查是否需要迁移
   */
  needsMigration(filePath: string): boolean {
    const version = this.detectVersion(filePath);
    if (!version) return false;

    return !this.isCompatible(version) || version !== CURRENT_SCHEMA_VERSION;
  }

  /**
   * 查找适用的迁移规则
   */
  findMigrationRules(fromVersion: string): MigrationRule[] {
    const rules: MigrationRule[] = [];

    for (const rule of this.rules) {
      if (rule.fromVersion === fromVersion) {
        rules.push(rule);
      }
    }

    return rules;
  }

  /**
   * 执行迁移
   */
  migrate(filePath: string, backup = true): StrategyConfig | null {
    const version = this.detectVersion(filePath);

    if (!version) {
      throw new Error('无法检测策略版本');
    }

    if (!this.needsMigration(filePath)) {
      // 无需迁移，直接读取
      const content = readFileSync(filePath, 'utf-8');
      return parseJSONC(content) as StrategyConfig;
    }

    // 备份原文件
    if (backup) {
      this.backupFile(filePath);
    }

    // 查找并应用迁移规则
    let config: StrategyConfig | null = null;
    let currentVersion = version;

    while (currentVersion !== CURRENT_SCHEMA_VERSION) {
      const rules = this.findMigrationRules(currentVersion);

      if (rules.length === 0) {
        throw new Error(`没有从版本 ${currentVersion} 的迁移规则`);
      }

      // 读取当前配置
      const content = readFileSync(filePath, 'utf-8');
      config = parseJSONC(content) as StrategyConfig;

      // 应用迁移
      for (const rule of rules) {
        config = rule.migrate(config);
        currentVersion = rule.toVersion;
      }
    }

    // 更新版本信息
    if (config && config._metadata) {
      config._metadata.version = this.parseVersion(CURRENT_SCHEMA_VERSION);
      config._metadata.updatedAt = new Date().toISOString();

      // 保存迁移后的配置
      this.saveMigratedConfig(filePath, config);
    }

    return config;
  }

  /**
   * 备份文件
   */
  private backupFile(filePath: string): void {
    const content = readFileSync(filePath, 'utf-8');
    const backupPath = `${filePath}.backup.${Date.now()}`;
    writeFileSync(backupPath, content, 'utf-8');
  }

  /**
   * 保存迁移后的配置
   */
  private saveMigratedConfig(filePath: string, config: StrategyConfig): void {
    const content = JSON.stringify(config, null, 2);
    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * 解析版本字符串
   */
  private parseVersion(version: string): StrategyVersion {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 1,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      schema: version,
    };
  }

  /**
   * 批量迁移目录中的所有策略文件
   */
  migrateDirectory(directory: string, backup = true): {
    success: string[];
    failed: { file: string; error: string }[];
    skipped: string[];
  } {
    const { readdirSync } = require('fs');
    const { join } = require('path');

    const results = {
      success: [] as string[],
      failed: [] as { file: string; error: string }[],
      skipped: [] as string[],
    };

    const files = readdirSync(directory);

    for (const file of files) {
      if (!file.endsWith('.jsonc') && !file.endsWith('.json')) {
        continue;
      }

      const filePath = join(directory, file);

      try {
        if (!this.needsMigration(filePath)) {
          results.skipped.push(file);
          continue;
        }

        this.migrate(filePath, backup);
        results.success.push(file);
      } catch (error) {
        results.failed.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * 添加自定义迁移规则
   */
  addMigrationRule(rule: MigrationRule): void {
    this.rules.push(rule);
  }

  /**
   * 获取版本历史
   */
  getVersionHistory(): Record<string, string> {
    return { ...VERSION_HISTORY };
  }

  /**
   * 获取当前 schema 版本
   */
  getCurrentSchemaVersion(): string {
    return CURRENT_SCHEMA_VERSION;
  }
}

/**
 * 创建迁移管理器实例
 */
export function createMigrationManager(customRules?: MigrationRule[]): StrategyMigrationManager {
  return new StrategyMigrationManager(customRules);
}

/**
 * 快捷函数：检查并迁移策略文件
 */
export function ensureLatestVersion(filePath: string): StrategyConfig | null {
  const manager = new StrategyMigrationManager();

  if (!manager.needsMigration(filePath)) {
    const content = readFileSync(filePath, 'utf-8');
    return parseJSONC(content) as StrategyConfig;
  }

  return manager.migrate(filePath);
}

/**
 * 策略版本比较器
 */
export class StrategyVersionComparator {
  /**
   * 比较两个版本
   * 返回: -1 (v1 < v2), 0 (v1 == v2), 1 (v1 > v2)
   */
  static compare(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }

    return 0;
  }

  /**
   * 检查版本是否过时
   */
  static isOutdated(version: string, latest = CURRENT_SCHEMA_VERSION): boolean {
    return this.compare(version, latest) < 0;
  }

  /**
   * 获取版本差异
   */
  static getDiff(from: string, to: string): 'major' | 'minor' | 'patch' | 'none' {
    const parts1 = from.split('.').map(Number);
    const parts2 = to.split('.').map(Number);

    if (parts2[0] > parts1[0]) return 'major';
    if (parts2[1] > parts1[1]) return 'minor';
    if (parts2[2] > parts1[2]) return 'patch';
    return 'none';
  }
}
