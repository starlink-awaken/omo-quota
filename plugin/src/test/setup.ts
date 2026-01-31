/**
 * Test Setup Configuration
 *
 * 全局测试设置，包括环境变量配置、测试目录创建和测试工具初始化
 */

import { mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * 测试配置
 */
export interface TestConfig {
  /** 测试临时目录 */
  testDir: string;
  /** 测试数据目录 */
  testDataDir: string;
  /** 模拟tracker文件路径 */
  mockTrackerPath: string;
  /** 模拟配置文件路径 */
  mockConfigPath: string;
  /** 是否启用详细日志 */
  verbose: boolean;
}

/**
 * 默认测试配置
 */
const DEFAULT_TEST_CONFIG: TestConfig = {
  testDir: join(tmpdir(), "omo-quota-tests"),
  testDataDir: join(tmpdir(), "omo-quota-tests", "data"),
  mockTrackerPath: join(tmpdir(), "omo-quota-tests", ".omo-quota-tracker.json"),
  mockConfigPath: join(tmpdir(), "omo-quota-tests", ".omo-quota-config.json"),
  verbose: process.env.TEST_VERBOSE === "true",
};

/**
 * 当前测试配置
 */
let currentConfig: TestConfig = { ...DEFAULT_TEST_CONFIG };

/**
 * 获取测试配置
 */
export function getTestConfig(): TestConfig {
  return { ...currentConfig };
}

/**
 * 设置测试配置
 */
export function setTestConfig(config: Partial<TestConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 初始化测试环境
 * - 创建测试目录
 * - 设置环境变量
 * - 配置全局状态
 */
export function setupTestEnvironment(config?: Partial<TestConfig>): TestConfig {
  if (config) {
    setTestConfig(config);
  }

  const { testDir, testDataDir, verbose } = currentConfig;

  // 创建测试目录
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  if (!existsSync(testDataDir)) {
    mkdirSync(testDataDir, { recursive: true });
  }

  // 设置测试环境变量
  process.env.NODE_ENV = "test";
  process.env.OMO_QUOTA_TEST_MODE = "true";

  // 禁用生产环境配置
  process.env.OMO_QUOTA_TRACKER_PATH = currentConfig.mockTrackerPath;

  // 配置日志级别
  if (!verbose) {
    // 在测试中静默日志（除非开启详细模式）
    mockConsoleMethods();
  }

  return currentConfig;
}

/**
 * 清理测试环境
 * - 删除临时文件
 * - 重置mock状态
 */
export function cleanupTestEnvironment(): void {
  restoreConsoleMethods();

  // 清理环境变量
  delete process.env.OMO_QUOTA_TEST_MODE;
}

/**
 * Console方法备份（用于restore）
 */
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

/**
 * 捕获的日志记录
 */
interface CapturedLogs {
  log: string[];
  error: string[];
  warn: string[];
  info: string[];
  debug: string[];
}

/**
 * Mock console方法（捕获输出而不显示）
 */
const capturedLogs: CapturedLogs = {
  log: [],
  error: [],
  warn: [],
  info: [],
  debug: [],
};

/**
 * Mock console方法（静默模式）
 */
export function mockConsoleMethods(): void {
  const capture = (type: keyof CapturedLogs) => {
    return (...args: unknown[]) => {
      const message = args.map(String).join(" ");
      const logs = capturedLogs[type] as string[];
      logs.push(message);
      if (currentConfig.verbose) {
        const fn = originalConsole[type as keyof typeof originalConsole];
        fn(...args);
      }
    };
  };

  console.log = capture("log");
  console.error = capture("error");
  console.warn = capture("warn");
  console.info = capture("info");
  console.debug = capture("debug");
}

/**
 * 恢复原始console方法
 */
export function restoreConsoleMethods(): void {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

/**
 * 获取捕获的日志
 */
export function getCapturedLogs(): typeof capturedLogs {
  return capturedLogs;
}

/**
 * 清空捕获的日志
 */
export function clearCapturedLogs(): void {
  capturedLogs.log = [];
  capturedLogs.error = [];
  capturedLogs.warn = [];
  capturedLogs.info = [];
  capturedLogs.debug = [];
}

/**
 * 测试工具函数 - 在测试前后自动调用
 */
export function withTestSetup<T>(
  fn: () => T,
  config?: Partial<TestConfig>
): T {
  setupTestEnvironment(config);
  try {
    return fn();
  } finally {
    cleanupTestEnvironment();
  }
}

/**
 * 设置测试隔离环境
 * - 每个测试使用独立的临时目录
 */
export function createIsolatedTestDir(name: string): string {
  const isolatedDir = join(currentConfig.testDir, name, Date.now().toString());
  mkdirSync(isolatedDir, { recursive: true });
  return isolatedDir;
}

// 自动初始化（当此文件被导入时）
setupTestEnvironment();
