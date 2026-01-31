/**
 * Test Framework Index
 *
 * 导出所有测试工具、mock和辅助函数
 * 统一的测试入口点
 */

// 全局设置
export * from "./setup";

// 测试辅助函数
export * from "./helpers";

// Mock对象
export * from "./mocks/opencode";
export * from "./mocks/filesystem";

// 重新导出常用类型和工具
export type {
  TestConfig,
} from "./setup";

export type {
  TrackerData,
  ProviderData,
  HourlyResetProvider,
  MonthlyResetProvider,
  BalanceProvider,
  ConfigData,
} from "./helpers";

export type {
  MockOpenCodeClient,
  MockToolContext,
  MockShellExecutor,
  MockEvent,
} from "./mocks/opencode";

export type {
  FileSystemOptions,
} from "./mocks/filesystem";

// 导出工厂函数
export {
  TestHelper,
  TrackerDataFactory,
  StrategyDataFactory,
  FileTestHelpers,
  AsyncTestHelpers,
  SnapshotHelper,
} from "./helpers";

export {
  createMockClient,
  createMockToolContext,
  createMockShell,
  createMockEvent,
  MockEventFactory,
  MockAssertions,
} from "./mocks/opencode";

export {
  MockFileSystem,
  createMockFileSystem,
  FileSystemTestHelper,
} from "./mocks/filesystem";

// 导出设置函数
export {
  setupTestEnvironment,
  cleanupTestEnvironment,
  getTestConfig,
  setTestConfig,
  mockConsoleMethods,
  restoreConsoleMethods,
  getCapturedLogs,
  clearCapturedLogs,
  withTestSetup,
  createIsolatedTestDir,
} from "./setup";
