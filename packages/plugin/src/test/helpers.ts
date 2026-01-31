/**
 * Test Helpers
 *
 * 测试辅助函数和工厂，用于创建mock数据和临时测试环境
 */

import { writeFile, readFile, unlink, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { TestConfig } from "./setup";

/**
 * 小时重置类型Provider数据
 */
export interface HourlyResetProvider {
  lastReset: string;
  nextReset: string;
  resetInterval: string;
  usage?: number;
}

/**
 * 月度重置类型Provider数据
 */
export interface MonthlyResetProvider {
  month: string;
  used: number;
  limit: number;
}

/**
 * 余额类型Provider数据
 */
export interface BalanceProvider {
  balance: string;
  currency: string;
}

/**
 * Provider数据类型
 */
export type ProviderData = HourlyResetProvider | MonthlyResetProvider | BalanceProvider;

/**
 * Tracker数据结构
 */
export interface TrackerData {
  providers: Record<string, ProviderData>;
  currentStrategy: string;
}

/**
 * 配置数据结构
 */
export interface ConfigData {
  enabled?: boolean;
  autoSync?: boolean;
  warningThreshold?: number;
  notifyOnLowQuota?: boolean;
  syncInterval?: number;
}

/**
 * 测试辅助类
 */
export class TestHelper {
  private testDir: string;
  private createdFiles: string[] = [];

  constructor(testDir?: string) {
    this.testDir = testDir || join(process.env.TMPDIR || "/tmp", "omo-quota-test-" + Date.now());
  }

  /**
   * 初始化测试目录
   */
  async init(): Promise<void> {
    if (!existsSync(this.testDir)) {
      await mkdir(this.testDir, { recursive: true });
    }
  }

  /**
   * 获取测试目录路径
   */
  getTestDir(): string {
    return this.testDir;
  }

  /**
   * 获取tracker文件路径
   */
  getTrackerPath(): string {
    return join(this.testDir, ".omo-quota-tracker.json");
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return join(this.testDir, ".omo-quota-config.json");
  }

  /**
   * 写入tracker文件
   */
  async writeTracker(data: TrackerData): Promise<void> {
    const path = this.getTrackerPath();
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
    this.createdFiles.push(path);
  }

  /**
   * 读取tracker文件
   */
  async readTracker(): Promise<TrackerData | null> {
    const path = this.getTrackerPath();
    if (!existsSync(path)) {
      return null;
    }
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as TrackerData;
  }

  /**
   * 写入配置文件
   */
  async writeConfig(data: ConfigData): Promise<void> {
    const path = this.getConfigPath();
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
    this.createdFiles.push(path);
  }

  /**
   * 读取配置文件
   */
  async readConfig(): Promise<ConfigData | null> {
    const path = this.getConfigPath();
    if (!existsSync(path)) {
      return null;
    }
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as ConfigData;
  }

  /**
   * 创建任意文件
   */
  async writeFile(filename: string, content: string): Promise<void> {
    const path = join(this.testDir, filename);
    await writeFile(path, content, "utf-8");
    this.createdFiles.push(path);
  }

  /**
   * 清理所有创建的文件和目录
   */
  async cleanup(): Promise<void> {
    for (const file of this.createdFiles) {
      try {
        await unlink(file);
      } catch {
        // 忽略不存在的文件
      }
    }
    this.createdFiles = [];
  }

  /**
   * 删除测试目录
   */
  async cleanTestDir(): Promise<void> {
    await this.cleanup();
    // 注意: 不删除测试目录本身，因为可能有其他测试正在使用
  }
}

/**
 * Tracker数据工厂
 */
export class TrackerDataFactory {
  /**
   * 创建空tracker数据
   */
  static empty(): TrackerData {
    return {
      providers: {},
      currentStrategy: "balanced",
    };
  }

  /**
   * 创建默认tracker数据
   */
  static default(): TrackerData {
    return {
      providers: {
        anthropic: {
          lastReset: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextReset: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          resetInterval: "5h",
          usage: 40,
        },
        "google-1": {
          lastReset: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          nextReset: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          resetInterval: "5h",
          usage: 20,
        },
        "github-copilot-premium": {
          month: new Date().toISOString().slice(0, 7),
          used: 85,
          limit: 100,
        },
        deepseek: {
          balance: "¥450.50",
          currency: "CNY",
        },
      },
      currentStrategy: "balanced",
    };
  }

  /**
   * 创建高使用率tracker数据（用于测试警告）
   */
  static highUsage(): TrackerData {
    const now = Date.now();
    return {
      providers: {
        anthropic: {
          lastReset: new Date(now - 4.5 * 60 * 60 * 1000).toISOString(),
          nextReset: new Date(now + 0.5 * 60 * 60 * 1000).toISOString(),
          resetInterval: "5h",
          usage: 90,
        },
        "github-copilot-premium": {
          month: new Date().toISOString().slice(0, 7),
          used: 95,
          limit: 100,
        },
      },
      currentStrategy: "performance",
    };
  }

  /**
   * 创建已过期的tracker数据
   */
  static expired(): TrackerData {
    const now = Date.now();
    return {
      providers: {
        anthropic: {
          lastReset: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
          nextReset: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
          resetInterval: "5h",
          usage: 100,
        },
      },
      currentStrategy: "economical",
    };
  }

  /**
   * 创建自定义tracker数据
   */
  static custom(
    providers: Record<string, ProviderData>,
    strategy: string = "balanced"
  ): TrackerData {
    return {
      providers,
      currentStrategy: strategy,
    };
  }

  /**
   * 创建小时重置类型provider
   */
  static hourlyProvider(
    options: Partial<HourlyResetProvider> = {}
  ): HourlyResetProvider {
    const now = Date.now();
    return {
      lastReset: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      nextReset: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
      resetInterval: "5h",
      usage: 50,
      ...options,
    };
  }

  /**
   * 创建月度重置类型provider
   */
  static monthlyProvider(
    options: Partial<MonthlyResetProvider> = {}
  ): MonthlyResetProvider {
    return {
      month: new Date().toISOString().slice(0, 7),
      used: 50,
      limit: 100,
      ...options,
    };
  }

  /**
   * 创建余额类型provider
   */
  static balanceProvider(
    options: Partial<BalanceProvider> = {}
  ): BalanceProvider {
    return {
      balance: "¥50.00",
      currency: "CNY",
      ...options,
    };
  }
}

/**
 * 策略数据工厂
 */
export class StrategyDataFactory {
  /**
   * 所有可用策略
   */
  static allStrategies(): Array<{ type: string; name: string; description: string }> {
    return [
      {
        type: "performance",
        name: "极致性能型",
        description: "优先使用最高质量的模型，不计成本",
      },
      {
        type: "balanced",
        name: "均衡实用型",
        description: "在性能和成本之间取得平衡",
      },
      {
        type: "economical",
        name: "极致省钱型",
        description: "优先使用免费或低成本模型",
      },
    ];
  }

  /**
   * 获取策略配置
   */
  static getStrategy(type: string): { type: string; name: string; description: string } {
    const strategy = this.allStrategies().find((s) => s.type === type);
    if (!strategy) {
      throw new Error(`Unknown strategy type: ${type}`);
    }
    return strategy;
  }
}

/**
 * 文件操作辅助函数
 */
export const FileTestHelpers = {
  /**
   * 等待文件出现
   */
  async waitForFile(
    path: string,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (existsSync(path)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return false;
  },

  /**
   * 等待文件消失
   */
  async waitForFileGone(
    path: string,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (!existsSync(path)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return false;
  },

  /**
   * 读取JSON文件
   */
  async readJson<T = unknown>(path: string): Promise<T | null> {
    if (!existsSync(path)) {
      return null;
    }
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  },

  /**
   * 写入JSON文件
   */
  async writeJson<T>(path: string, data: T): Promise<void> {
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  },

  /**
   * 文件是否存在
   */
  exists(path: string): boolean {
    return existsSync(path);
  },
};

/**
 * 异步辅助函数
 */
export const AsyncTestHelpers = {
  /**
   * 延迟指定毫秒
   */
  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * 带超时的Promise
   */
  withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string = "Operation timed out"): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  },

  /**
   * 重试函数
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError || new Error("Retry failed");
  },
};

/**
 * 快照测试辅助函数
 */
export class SnapshotHelper {
  private snapshots: Map<string, unknown> = new Map();

  /**
   * 设置快照
   */
  set(name: string, value: unknown): void {
    this.snapshots.set(name, value);
  }

  /**
   * 获取快照
   */
  get(name: string): unknown | undefined {
    return this.snapshots.get(name);
  }

  /**
   * 匹配快照
   */
  match(name: string, value: unknown): boolean {
    const snapshot = this.snapshots.get(name);
    return JSON.stringify(snapshot) === JSON.stringify(value);
  }

  /**
   * 清除所有快照
   */
  clear(): void {
    this.snapshots.clear();
  }
}
