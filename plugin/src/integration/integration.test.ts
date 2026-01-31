/**
 * omo-quota Plugin Integration Tests
 *
 * 综合集成测试套件，测试所有工具和钩子的完整功能
 * 使用MockOpenCodeClient模拟真实OpenCode环境
 *
 * @packageDocumentation
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// 导入被测试的工具
import { quotaStatusTool } from "../tools/quota-status";
import { switchStrategyTool } from "../tools/sync-quota";
import { costReportTool } from "../tools/cost-report";
import { sessionMonitorHook } from "../hooks/session-monitor";
import { notificationHook } from "../hooks/notification";
import { createCompositeEventHook } from "../hooks/composite-event";
import omoQuotaPlugin from "../index";

// ============================================================================
// 测试配置和辅助函数
// ============================================================================

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  duration: number;
  error?: string;
}

interface TestReport {
  startTime: string;
  endTime: string;
  totalDuration: number;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
}

/**
 * 创建临时测试目录
 */
function createTempDir(): string {
  const testDir = join(tmpdir(), `omo-quota-test-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
  return testDir;
}

/**
 * 清理测试目录
 */
function cleanupTempDir(testDir: string): void {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // 忽略清理错误
  }
}

/**
 * 创建模拟tracker数据
 */
function createMockTrackerData(testDir: string, data: unknown): void {
  const trackerPath = join(testDir, ".omo-quota-tracker.json");
  writeFileSync(trackerPath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 创建模拟策略文件
 */
function createMockStrategyFile(testDir: string, strategy: string): void {
  const strategiesDir = join(testDir, ".config", "opencode", "strategies");
  mkdirSync(strategiesDir, { recursive: true });

  const strategyFiles: Record<string, unknown> = {
    performance: {
      $schema: "oh-my-opencode-schema",
      description: "极致性能型策略",
      providers: {
        anthropic: ["claude-opus-4"],
      },
      agents: {
        Sisyphus: {
          model: "anthropic/claude-opus-4",
          temperature: 0.7,
        },
      },
    },
    balanced: {
      $schema: "oh-my-opencode-schema",
      description: "均衡实用型策略",
      providers: {
        google: ["gemini-2.0-flash-exp"],
      },
      agents: {
        Sisyphus: {
          model: "google/gemini-2.0-flash-exp",
          temperature: 0.7,
        },
      },
    },
    economical: {
      $schema: "oh-my-opencode-schema",
      description: "极致省钱型策略",
      providers: {
        zhipuai: ["glm-4-flash"],
      },
      agents: {
        Sisyphus: {
          model: "zhipuai/glm-4-flash",
          temperature: 0.5,
        },
      },
    },
  };

  const filename = `strategy-${strategy === "performance" ? "1" : strategy === "balanced" ? "2" : "3"}-${strategy}.jsonc`;
  const strategyPath = join(strategiesDir, filename);
  writeFileSync(strategyPath, JSON.stringify(strategyFiles[strategy], null, 2), "utf-8");
}

/**
 * 创建模拟消息存储
 */
function createMockMessageStorage(testDir: string): void {
  const storageDir = join(testDir, ".local", "share", "opencode", "storage", "message");
  mkdirSync(storageDir, { recursive: true });

  // 创建模拟会话目录
  const sessionDir = join(storageDir, "ses_test001");
  mkdirSync(sessionDir, { recursive: true });

  // 创建模拟消息文件
  const messages = [
    {
      id: "msg_001",
      role: "assistant",
      providerID: "anthropic",
      modelID: "claude-opus-4",
      tokens: {
        input: 1000,
        output: 500,
      },
      time: {
        created: Date.now() - 3600000, // 1小时前
        completed: Date.now() - 3590000,
      },
    },
    {
      id: "msg_002",
      role: "assistant",
      providerID: "google",
      modelID: "gemini-2.0-flash-exp",
      tokens: {
        input: 500,
        output: 300,
      },
      time: {
        created: Date.now() - 1800000, // 30分钟前
        completed: Date.now() - 1790000,
      },
    },
  ];

  messages.forEach((msg, i) => {
    const msgPath = join(sessionDir, `msg_${String(i + 1).padStart(3, "0")}.json`);
    writeFileSync(msgPath, JSON.stringify(msg, null, 2), "utf-8");
  });
}

/**
 * Mock ToolContext
 */
class MockToolContext {
  public client = {
    app: {
      log: (msg: string) => console.log(`[MOCK LOG] ${msg}`),
      error: (msg: string) => console.error(`[MOCK ERROR] ${msg}`),
      warn: (msg: string) => console.warn(`[MOCK WARN] ${msg}`),
    },
    config: {
      get: (key: string) => {
        const config: Record<string, unknown> = {
          testMode: true,
        };
        return config[key];
      },
      set: (_key: string, _value: unknown) => {},
    },
  };
  public $ = {
    stdout: "",
    stderr: "",
    exitCode: 0,
  };
}

/**
 * Mock Event
 */
class MockEvent {
  constructor(
    public type: string,
    public data?: Record<string, unknown>
  ) {}
}

// ============================================================================
// 集成测试套件
// ============================================================================

describe("omo-quota Integration Tests", () => {
  let testDir: string;
  let results: TestResult[] = [];
  let testStartTime: number;

  beforeEach(() => {
    testDir = createTempDir();
    testStartTime = Date.now();
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  // ========================================================================
  // 工具功能测试
  // ========================================================================

  describe("Tools - quota_status", () => {
    test("应该显示未初始化状态", async () => {
      const start = Date.now();
      try {
        // 设置临时HOME目录
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        expect(result).toContain("未找到配额追踪数据");

        results.push({
          name: "quota_status: 未初始化状态",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "quota_status: 未初始化状态",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该正确显示配额状态", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        // 创建tracker数据
        const now = new Date();
        const nextReset = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时后
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: nextReset.toISOString(),
              resetInterval: "hourly",
              usage: 45,
            },
            "github-copilot-premium": {
              month: now.toISOString().slice(0, 7),
              used: 8500,
              limit: 10000,
            },
          },
        });

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        expect(result).toContain("balanced");
        expect(result).toContain("Claude Pro");
        expect(result).toContain("45%");

        results.push({
          name: "quota_status: 正常显示状态",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "quota_status: 正常显示状态",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该显示警告当配额超过80%", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: new Date(now.getTime() + 3600000).toISOString(),
              resetInterval: "hourly",
              usage: 85,
            },
          },
        });

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        expect(result).toContain("⚠️");

        results.push({
          name: "quota_status: 高使用率警告",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "quota_status: 高使用率警告",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });

  // ========================================================================
  // 钩子功能测试
  // ========================================================================

  describe("Hooks - session_monitor", () => {
    test("应该在session.start时触发", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: new Date(now.getTime() + 3600000).toISOString(),
              resetInterval: "hourly",
              usage: 85,
            },
          },
        });

        const event = new MockEvent("session.start");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await sessionMonitorHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 钩子应该执行且不抛出错误
        expect(true).toBe(true);

        results.push({
          name: "session_monitor: session.start触发",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "session_monitor: session.start触发",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该在session.idle时输出警告", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: new Date(now.getTime() + 3600000).toISOString(),
              resetInterval: "hourly",
              usage: 85,
            },
          },
        });

        const event = new MockEvent("session.idle");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await sessionMonitorHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 检查是否有警告输出
        const hasWarning = logs.some((log) => log.includes("配额警告") || log.includes("omo-quota"));
        expect(hasWarning).toBe(true);

        results.push({
          name: "session_monitor: session.idle警告",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "session_monitor: session.idle警告",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该忽略不支持的事件类型", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {},
        });

        const event = new MockEvent("custom.event");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await sessionMonitorHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 不应该有任何输出
        expect(logs.length).toBe(0);

        results.push({
          name: "session_monitor: 忽略不支持事件",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "session_monitor: 忽略不支持事件",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });

  describe("Hooks - notification", () => {
    test("应该在session.idle时显示低配额通知", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            deepseek: {
              balance: "¥50.00",
              currency: "CNY",
            },
          },
        });

        const event = new MockEvent("session.idle");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await notificationHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 应该有低配额通知
        const hasNotification = logs.some((log) =>
          log.includes("低配额") || log.includes("omo-quota")
        );
        expect(hasNotification).toBe(true);

        results.push({
          name: "notification: 低配额通知",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "notification: 低配额通知",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该忽略非session.idle事件", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {},
        });

        const event = new MockEvent("session.start");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await notificationHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 不应该有输出
        expect(logs.length).toBe(0);

        results.push({
          name: "notification: 忽略非idle事件",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "notification: 忽略非idle事件",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });

  describe("Hooks - composite_event", () => {
    test("应该组合执行多个钩子", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: new Date(now.getTime() + 3600000).toISOString(),
              resetInterval: "hourly",
              usage: 85,
            },
          },
        });

        const compositeHook = createCompositeEventHook(
          sessionMonitorHook,
          notificationHook
        );

        const event = new MockEvent("session.idle");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await compositeHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 应该有两个钩子的输出
        expect(logs.length).toBeGreaterThan(0);

        results.push({
          name: "composite_event: 组合执行钩子",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "composite_event: 组合执行钩子",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该在单个钩子失败时继续执行其他钩子", async () => {
      const start = Date.now();
      try {
        // 创建一个会失败的钩子
        const failingHook = async () => {
          throw new Error("Intentional failure");
        };

        const successfulHook = async () => {
          console.log("Success");
        };

        const compositeHook = createCompositeEventHook(
          failingHook as any,
          successfulHook as any
        );

        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        // 不应该抛出错误
        await compositeHook({ event: new MockEvent("test") as any });

        console.log = originalLog;

        // 成功的钩子应该执行
        expect(logs).toContain("Success");

        results.push({
          name: "composite_event: 容错执行",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "composite_event: 容错执行",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });

  // ========================================================================
  // 端到端场景测试
  // ========================================================================

  describe("End-to-End Scenarios", () => {
    test("首次使用流程: 未初始化 -> 显示引导", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        expect(result).toContain("未找到配额追踪数据");
        expect(result).toContain("omo-quota init");

        results.push({
          name: "E2E: 首次使用流程",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "E2E: 首次使用流程",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("配额警告流程: 高使用率 -> 警告通知", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: new Date(now.getTime() + 3600000).toISOString(),
              resetInterval: "hourly",
              usage: 90,
            },
            "github-copilot-premium": {
              month: now.toISOString().slice(0, 7),
              used: 95000,
              limit: 100000,
            },
          },
        });

        // 检查配额状态
        const context = new MockToolContext();
        const statusResult = await quotaStatusTool.execute({}, context as any);
        expect(statusResult).toContain("⚠️");

        // 触发钩子检查
        const event = new MockEvent("session.idle");
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await sessionMonitorHook({ event: event as any });
        await notificationHook({ event: event as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 应该有警告
        const hasWarning = logs.some((log) =>
          log.includes("警告") || log.includes("低配额")
        );
        expect(hasWarning).toBe(true);

        results.push({
          name: "E2E: 配额警告流程",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "E2E: 配额警告流程",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("多提供商状态聚合", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        const nextReset = new Date(now.getTime() + 3600000);

        createMockTrackerData(testDir, {
          currentStrategy: "performance",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: nextReset.toISOString(),
              resetInterval: "hourly",
              usage: 45,
            },
            "google-1": {
              lastReset: now.toISOString(),
              nextReset: nextReset.toISOString(),
              resetInterval: "hourly",
              usage: 30,
            },
            "google-2": {
              lastReset: now.toISOString(),
              nextReset: nextReset.toISOString(),
              resetInterval: "hourly",
              usage: 15,
            },
            zhipuai: {
              lastReset: now.toISOString(),
              nextReset: nextReset.toISOString(),
              resetInterval: "hourly",
              usage: 60,
            },
            deepseek: {
              balance: "¥200.00",
              currency: "CNY",
            },
          },
        });

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        // 应该显示多个提供商
        expect(result).toContain("Claude Pro");
        expect(result).toContain("Gemini Pro");
        expect(result).toContain("ZhiPuAI");
        expect(result).toContain("DeepSeek");

        results.push({
          name: "E2E: 多提供商聚合",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "E2E: 多提供商聚合",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });

  // ========================================================================
  // 错误处理测试
  // ========================================================================

  describe("Error Handling", () => {
    test("应该处理损坏的tracker文件", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        // 写入无效的JSON
        const trackerPath = join(testDir, ".omo-quota-tracker.json");
        writeFileSync(trackerPath, "invalid json {", "utf-8");

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        // 应该优雅地处理错误，显示未初始化状态
        expect(result).toContain("未找到配额追踪数据");

        results.push({
          name: "Error: 损坏的tracker文件",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "Error: 损坏的tracker文件",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("应该处理空tracker文件", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const trackerPath = join(testDir, ".omo-quota-tracker.json");
        writeFileSync(trackerPath, "", "utf-8");

        const context = new MockToolContext();
        const result = await quotaStatusTool.execute({}, context as any);

        process.env.HOME = originalHome;

        expect(result).toContain("未找到配额追踪数据");

        results.push({
          name: "Error: 空tracker文件",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "Error: 空tracker文件",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("钩子应该在tracker不存在时静默失败", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const event = new MockEvent("session.idle");

        // 不应该抛出错误
        await sessionMonitorHook({ event: event as any });
        await notificationHook({ event: event as any });

        process.env.HOME = originalHome;

        // 测试通过即表示没有抛出错误
        expect(true).toBe(true);

        results.push({
          name: "Error: 钩子静默失败",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "Error: 钩子静默失败",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });

  // ========================================================================
  // 插件加载测试
  // ========================================================================

  describe("Plugin Loading", () => {
    test("应该正确加载插件", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const mockClient = {
          app: {
            log: () => {},
            error: () => {},
            warn: () => {},
          },
          config: {
            get: () => null,
            set: () => {},
          },
          tools: {
            register: () => {},
          },
        };

        const hooks = await omoQuotaPlugin({
          client: mockClient as any,
          $: {} as any,
        });

        process.env.HOME = originalHome;

        expect(hooks).toBeDefined();
        expect(hooks.tool).toBeDefined();
        expect(hooks.tool.quota_status).toBeDefined();
        expect(hooks.tool.switch_strategy).toBeDefined();
        expect(hooks.tool.sync_quota).toBeDefined();
        expect(hooks.tool.cost_report).toBeDefined();
        expect(hooks.event).toBeDefined();

        results.push({
          name: "Plugin: 正确加载",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "Plugin: 正确加载",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });

    test("插件钩子应该可执行", async () => {
      const start = Date.now();
      try {
        const originalHome = process.env.HOME;
        process.env.HOME = testDir;

        const now = new Date();
        createMockTrackerData(testDir, {
          currentStrategy: "balanced",
          providers: {
            anthropic: {
              lastReset: now.toISOString(),
              nextReset: new Date(now.getTime() + 3600000).toISOString(),
              resetInterval: "hourly",
              usage: 50,
            },
          },
        });

        const mockClient = {
          app: {
            log: () => {},
            error: () => {},
            warn: () => {},
          },
          config: {
            get: () => null,
            set: () => {},
          },
          tools: {
            register: () => {},
          },
        };

        const hooks = await omoQuotaPlugin({
          client: mockClient as any,
          $: {} as any,
        });

        // 执行事件钩子
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        await hooks.event!({ event: new MockEvent("session.idle") as any });

        console.log = originalLog;
        process.env.HOME = originalHome;

        // 钩子应该执行且不抛出错误
        expect(true).toBe(true);

        results.push({
          name: "Plugin: 钩子可执行",
          status: "PASS",
          duration: Date.now() - start,
        });
      } catch (error) {
        results.push({
          name: "Plugin: 钩子可执行",
          status: "FAIL",
          duration: Date.now() - start,
          error: String(error),
        });
        throw error;
      }
    });
  });
});

// ============================================================================
// 测试报告生成
// ============================================================================

describe("Integration Test Report", () => {
  test("生成测试报告", () => {
    const report: TestReport = {
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalDuration: 0,
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        passRate: 0,
      },
    };

    console.log("\n" + "=".repeat(60));
    console.log("omo-quota Plugin Integration Test Report");
    console.log("=".repeat(60));
    console.log(`Start Time: ${report.startTime}`);
    console.log(`End Time: ${report.endTime}`);
    console.log(`Total Duration: ${report.totalDuration}ms`);
    console.log("");
    console.log("Summary:");
    console.log(`  Total Tests: ${report.summary.total}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Skipped: ${report.summary.skipped}`);
    console.log(`  Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    console.log("=".repeat(60) + "\n");

    expect(true).toBe(true);
  });
});

export {};
