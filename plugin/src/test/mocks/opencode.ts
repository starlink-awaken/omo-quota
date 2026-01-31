/**
 * Mock OpenCode Client
 *
 * 模拟OpenCode客户端和API，用于测试工具和钩子
 */

import type { ToolContext } from "@opencode-ai/plugin";

/**
 * Mock OpenCode Client接口
 */
export interface MockOpenCodeClient {
  app: {
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
  };
  config: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  };
  tools: {
    register: (tool: unknown) => void;
  };
  logs: string[];
  errors: string[];
  warnings: string[];
  reset(): void;
  getLogs(): string[];
  getErrors(): string[];
  getWarnings(): string[];
}

/**
 * Mock Tool Context
 */
export interface MockToolContext extends ToolContext {
  client: MockOpenCodeClient;
  $: MockShellExecutor;
}

/**
 * Mock Shell执行器
 */
export interface MockShellExecutor {
  stdout: string;
  stderr: string;
  exitCode: number;
  commands: string[];
  reset(): void;
  setOutput(stdout: string, stderr?: string, exitCode?: number): void;
}

/**
 * 创建Mock Shell执行器
 */
export function createMockShell(): MockShellExecutor {
  const mockShell: MockShellExecutor = {
    stdout: "",
    stderr: "",
    exitCode: 0,
    commands: [],

    reset() {
      this.stdout = "";
      this.stderr = "";
      this.exitCode = 0;
      this.commands = [];
    },

    setOutput(stdout: string, stderr: string = "", exitCode: number = 0) {
      this.stdout = stdout;
      this.stderr = stderr;
      this.exitCode = exitCode;
    },
  };

  return mockShell;
}

/**
 * 创建Mock OpenCode Client
 */
export function createMockClient(
  config?: Record<string, unknown>
): MockOpenCodeClient {
  const mockClient: MockOpenCodeClient = {
    logs: [],
    errors: [],
    warnings: [],

    app: {
      log: (message: string) => {
        mockClient.logs.push(message);
      },
      error: (message: string) => {
        mockClient.errors.push(message);
      },
      warn: (message: string) => {
        mockClient.warnings.push(message);
      },
    },

    config: {
      get: (key: string) => {
        return config?.[key];
      },
      set: (_key: string, _value: unknown) => {
        // 在测试中通常不需要实际设置
      },
    },

    tools: {
      register: (_tool: unknown) => {
        // 在测试中通常不需要实际注册
      },
    },

    reset() {
      this.logs = [];
      this.errors = [];
      this.warnings = [];
    },

    getLogs() {
      return [...this.logs];
    },

    getErrors() {
      return [...this.errors];
    },

    getWarnings() {
      return [...this.warnings];
    },
  };

  return mockClient;
}

/**
 * 创建Mock Tool Context
 * 注意：返回的是简化的上下文，只包含测试所需的属性
 */
export function createMockToolContext(
  clientConfig?: Record<string, unknown>
): Omit<MockToolContext, keyof ToolContext> & { client: MockOpenCodeClient; $: MockShellExecutor } {
  return {
    client: createMockClient(clientConfig),
    $: createMockShell(),
  };
}

/**
 * Mock Event对象
 */
export interface MockEvent {
  type: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

/**
 * 创建Mock Event
 */
export function createMockEvent(
  type: string,
  data?: Record<string, unknown>
): MockEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * 预定义的Mock Event工厂
 */
export const MockEventFactory = {
  /**
   * 创建session.start事件
   */
  sessionStart(): MockEvent {
    return createMockEvent("session.start", {
      sessionId: "test-session-" + Date.now(),
    });
  },

  /**
   * 创建session.update事件
   */
  sessionUpdate(): MockEvent {
    return createMockEvent("session.update", {
      sessionId: "test-session-" + Date.now(),
    });
  },

  /**
   * 创建session.idle事件
   */
  sessionIdle(): MockEvent {
    return createMockEvent("session.idle", {
      sessionId: "test-session-" + Date.now(),
    });
  },

  /**
   * 创建session.end事件
   */
  sessionEnd(): MockEvent {
    return createMockEvent("session.end", {
      sessionId: "test-session-" + Date.now(),
    });
  },

  /**
   * 创建自定义事件
   */
  custom(type: string, data?: Record<string, unknown>): MockEvent {
    return createMockEvent(type, data);
  },
};

/**
 * 断言辅助函数
 */
export const MockAssertions = {
  /**
   * 断言日志包含指定消息
   */
  assertLogContains(mockClient: MockOpenCodeClient, message: string): void {
    const hasMessage = mockClient.logs.some((log) => log.includes(message));
    if (!hasMessage) {
      throw new Error(
        `Expected logs to contain "${message}", but got:\n${mockClient.logs.join("\n")}`
      );
    }
  },

  /**
   * 断言错误包含指定消息
   */
  assertErrorContains(mockClient: MockOpenCodeClient, message: string): void {
    const hasMessage = mockClient.errors.some((err) => err.includes(message));
    if (!hasMessage) {
      throw new Error(
        `Expected errors to contain "${message}", but got:\n${mockClient.errors.join("\n")}`
      );
    }
  },

  /**
   * 断言警告包含指定消息
   */
  assertWarningContains(mockClient: MockOpenCodeClient, message: string): void {
    const hasMessage = mockClient.warnings.some((warn) => warn.includes(message));
    if (!hasMessage) {
      throw new Error(
        `Expected warnings to contain "${message}", but got:\n${mockClient.warnings.join("\n")}`
      );
    }
  },

  /**
   * 断言日志数量
   */
  assertLogCount(mockClient: MockOpenCodeClient, count: number): void {
    if (mockClient.logs.length !== count) {
      throw new Error(
        `Expected ${count} logs, but got ${mockClient.logs.length}`
      );
    }
  },

  /**
   * 断言Shell命令被执行
   */
  assertCommandExecuted(mockShell: MockShellExecutor, command: string): void {
    const hasCommand = mockShell.commands.some((cmd) =>
      cmd.includes(command)
    );
    if (!hasCommand) {
      throw new Error(
        `Expected shell to execute command containing "${command}", but got:\n${mockShell.commands.join("\n")}`
      );
    }
  },
};
