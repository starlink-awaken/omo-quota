/**
 * Test Framework Example Tests
 *
 * 示例测试文件，展示测试框架的使用方式
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  getTestConfig,
  getCapturedLogs,
  clearCapturedLogs,
  TestHelper,
  TrackerDataFactory,
  FileTestHelpers,
  AsyncTestHelpers,
  SnapshotHelper,
  createMockClient,
  createMockToolContext,
  MockEventFactory,
  MockAssertions,
  MockFileSystem,
  FileSystemTestHelper,
} from "../index";

describe("Test Framework", () => {
  describe("setup.ts - 环境设置", () => {
    test("getTestConfig 返回默认配置", () => {
      const config = getTestConfig();
      expect(config).toBeDefined();
      expect(config.testDir).toBeDefined();
      expect(config.mockTrackerPath).toBeDefined();
      expect(config.mockConfigPath).toBeDefined();
    });

    test("环境变量正确设置", () => {
      setupTestEnvironment();
      expect(process.env.NODE_ENV).toBe("test");
      expect(process.env.OMO_QUOTA_TEST_MODE).toBe("true");
      cleanupTestEnvironment();
    });

    test("getCapturedLogs 捕获console输出", () => {
      setupTestEnvironment();
      clearCapturedLogs();

      console.log("Test log message");
      console.error("Test error message");
      console.warn("Test warning message");

      const logs = getCapturedLogs();
      expect(logs.log).toContain("Test log message");
      expect(logs.error).toContain("Test error message");
      expect(logs.warn).toContain("Test warning message");

      cleanupTestEnvironment();
    });
  });

  describe("helpers.ts - 测试辅助类", () => {
    let helper: TestHelper;

    beforeEach(async () => {
      helper = new TestHelper();
      await helper.init();
    });

    afterEach(async () => {
      await helper.cleanup();
    });

    test("TestHelper 写入和读取tracker数据", async () => {
      const trackerData = TrackerDataFactory.default();
      await helper.writeTracker(trackerData);

      const readData = await helper.readTracker();
      expect(readData).toEqual(trackerData);
    });

    test("TestHelper 创建临时目录", () => {
      const testDir = helper.getTestDir();
      expect(testDir).toBeDefined();
      expect(testDir).toContain("omo-quota-test");
    });

    test("TrackerDataFactory 创建空数据", () => {
      const empty = TrackerDataFactory.empty();
      expect(empty.providers).toEqual({});
      expect(empty.currentStrategy).toBe("balanced");
    });

    test("TrackerDataFactory 创建默认数据", () => {
      const data = TrackerDataFactory.default();
      expect(Object.keys(data.providers).length).toBeGreaterThan(0);
      expect(data.currentStrategy).toBe("balanced");
    });

    test("TrackerDataFactory 创建高使用率数据", () => {
      const data = TrackerDataFactory.highUsage();
      expect(data.providers.anthropic).toBeDefined();
      const anthropic = data.providers.anthropic as { usage?: number };
      expect(anthropic.usage).toBeGreaterThanOrEqual(80);
    });

    test("TrackerDataFactory 创建hourly provider", () => {
      const provider = TrackerDataFactory.hourlyProvider({ usage: 75 });
      expect(provider).toHaveProperty("lastReset");
      expect(provider).toHaveProperty("nextReset");
      expect(provider).toHaveProperty("resetInterval");
      expect(provider).toHaveProperty("usage");
      expect((provider as { usage: number }).usage).toBe(75);
    });

    test("TrackerDataFactory 创建monthly provider", () => {
      const provider = TrackerDataFactory.monthlyProvider({ used: 85, limit: 100 });
      expect(provider).toHaveProperty("month");
      expect(provider).toHaveProperty("used");
      expect(provider).toHaveProperty("limit");
      expect((provider as { used: number }).used).toBe(85);
    });

    test("TrackerDataFactory 创建balance provider", () => {
      const provider = TrackerDataFactory.balanceProvider({
        balance: "¥100.00",
        currency: "CNY",
      });
      expect(provider).toHaveProperty("balance");
      expect(provider).toHaveProperty("currency");
      expect((provider as { balance: string }).balance).toBe("¥100.00");
    });

    test("AsyncTestHelpers delay 函数", async () => {
      const start = Date.now();
      await AsyncTestHelpers.delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    test("SnapshotHelper 设置和获取快照", () => {
      const snapshot = new SnapshotHelper();
      snapshot.set("test-key", { data: "test-value" });

      const retrieved = snapshot.get("test-key");
      expect(retrieved).toEqual({ data: "test-value" });
    });

    test("SnapshotHelper 匹配快照", () => {
      const snapshot = new SnapshotHelper();
      snapshot.set("test-key", { data: "test-value" });

      const matches = snapshot.match("test-key", { data: "test-value" });
      expect(matches).toBe(true);

      const notMatches = snapshot.match("test-key", { data: "different" });
      expect(notMatches).toBe(false);
    });
  });

  describe("mocks/opencode.ts - OpenCode Mock", () => {
    test("createMockClient 创建模拟客户端", () => {
      const client = createMockClient({ testKey: "testValue" });

      expect(client).toBeDefined();
      expect(client.app).toBeDefined();
      expect(client.config).toBeDefined();
      expect(client.tools).toBeDefined();
      expect(client.logs).toEqual([]);
      expect(client.errors).toEqual([]);
    });

    test("MockClient app.log 捕获日志", () => {
      const client = createMockClient();
      client.app.log("Test message");

      expect(client.getLogs()).toEqual(["Test message"]);
    });

    test("MockClient app.error 捕获错误", () => {
      const client = createMockClient();
      client.app.error("Error message");

      expect(client.getErrors()).toEqual(["Error message"]);
    });

    test("MockClient app.warn 捕获警告", () => {
      const client = createMockClient();
      client.app.warn("Warning message");

      expect(client.getWarnings()).toEqual(["Warning message"]);
    });

    test("MockClient reset 清空所有日志", () => {
      const client = createMockClient();
      client.app.log("Test");
      client.app.error("Error");
      client.app.warn("Warning");

      client.reset();

      expect(client.getLogs()).toEqual([]);
      expect(client.getErrors()).toEqual([]);
      expect(client.getWarnings()).toEqual([]);
    });

    test("createMockToolContext 创建模拟上下文", () => {
      const context = createMockToolContext({ testKey: "testValue" });

      expect(context.client).toBeDefined();
      expect(context.$).toBeDefined();
    });

    test("MockEventFactory 创建各种事件", () => {
      const sessionStart = MockEventFactory.sessionStart();
      expect(sessionStart.type).toBe("session.start");

      const sessionUpdate = MockEventFactory.sessionUpdate();
      expect(sessionUpdate.type).toBe("session.update");

      const sessionIdle = MockEventFactory.sessionIdle();
      expect(sessionIdle.type).toBe("session.idle");

      const sessionEnd = MockEventFactory.sessionEnd();
      expect(sessionEnd.type).toBe("session.end");

      const custom = MockEventFactory.custom("custom.event", { key: "value" });
      expect(custom.type).toBe("custom.event");
      expect(custom.data).toEqual({ key: "value" });
    });

    test("MockAssertions 断言日志包含", () => {
      const client = createMockClient();
      client.app.log("Important test message here");

      // 应该不抛出错误
      MockAssertions.assertLogContains(client, "Important");

      expect(() => {
        MockAssertions.assertLogContains(client, "Not present");
      }).toThrow();
    });

    test("MockAssertions 断言日志数量", () => {
      const client = createMockClient();
      client.app.log("Message 1");
      client.app.log("Message 2");

      MockAssertions.assertLogCount(client, 2);

      expect(() => {
        MockAssertions.assertLogCount(client, 1);
      }).toThrow();
    });
  });

  describe("mocks/filesystem.ts - Mock FileSystem", () => {
    test("MockFileSystem 基本文件操作", () => {
      const fs = new MockFileSystem();

      fs.writeFile("/test/file.txt", "Hello, World!");
      expect(fs.readFile("/test/file.txt")).toBe("Hello, World!");
      expect(fs.exists("/test/file.txt")).toBe(true);
      expect(fs.isFile("/test/file.txt")).toBe(true);
    });

    test("MockFileSystem 读取不存在的文件返回null", () => {
      const fs = new MockFileSystem();
      expect(fs.readFile("/nonexistent.txt")).toBeNull();
    });

    test("MockFileSystem 读取JSON文件", () => {
      const fs = new MockFileSystem();
      fs.writeFile("/test/data.json", '{"key": "value"}');

      const data = fs.readJson<{ key: string }>("/test/data.json");
      expect(data).toEqual({ key: "value" });
    });

    test("MockFileSystem 删除文件", () => {
      const fs = new MockFileSystem();
      fs.writeFile("/test/file.txt", "content");

      expect(fs.unlink("/test/file.txt")).toBe(true);
      expect(fs.exists("/test/file.txt")).toBe(false);
    });

    test("MockFileSystem 创建目录", () => {
      const fs = new MockFileSystem();
      fs.mkdir("/test/dir", true);

      expect(fs.isDirectory("/test/dir")).toBe(true);
    });

    test("MockFileSystem 重置", () => {
      const fs = new MockFileSystem();
      fs.writeFile("/test/file.txt", "content");

      fs.reset();

      expect(fs.getFileCount()).toBe(0);
      expect(fs.isEmpty()).toBe(true);
    });

    test("MockFileSystem 导出和导入", () => {
      const fs1 = new MockFileSystem();
      fs1.writeFile("/test/file1.txt", "content1");
      fs1.writeFile("/test/file2.txt", "content2");

      const exported = fs1.export();

      const fs2 = new MockFileSystem();
      fs2.import(exported);

      expect(fs2.readFile("/test/file1.txt")).toBe("content1");
      expect(fs2.readFile("/test/file2.txt")).toBe("content2");
    });

    test("FileSystemTestHelper 辅助类", () => {
      const helper = new FileSystemTestHelper("/test-root");

      helper.createFile("subdir/file.txt", "Hello");

      expect(helper.exists("subdir/file.txt")).toBe(true);
      expect(helper.readFile("subdir/file.txt")).toBe("Hello");
    });

    test("FileSystemTestHelper 批量创建文件", () => {
      const helper = new FileSystemTestHelper("/test-root");

      helper.createFiles({
        "file1.txt": "content1",
        "file2.txt": "content2",
        "dir/file3.txt": "content3",
      });

      expect(helper.readFile("file1.txt")).toBe("content1");
      expect(helper.readFile("file2.txt")).toBe("content2");
      expect(helper.readFile("dir/file3.txt")).toBe("content3");
    });
  });
});
