/**
 * Composite Event Hook
 *
 * 组合多个事件钩子为一个统一的event钩子
 * 允许在单个Hooks.event注册点运行多个钩子函数
 */

import type { Event } from "@opencode-ai/sdk";

/**
 * 事件钩子函数类型
 */
export type EventHook = (input: { event: Event }) => Promise<void>;

/**
 * 组合多个事件钩子为一个
 *
 * 所有钩子按顺序执行，任何一个钩子失败不会影响其他钩子
 */
export function createCompositeEventHook(...hooks: EventHook[]): EventHook {
  return async (input: { event: Event }): Promise<void> => {
    // 并行执行所有钩子
    await Promise.all(
      hooks.map(async (hook) => {
        try {
          await hook(input);
        } catch {
          // 静默失败，不影响其他钩子
        }
      })
    );
  };
}

/**
 * 创建条件执行的组合钩子
 *
 * 根据事件类型选择性地执行钩子
 */
export function createSelectiveEventHook(
  selectors: Partial<Record<string, EventHook>>
): EventHook {
  return async (input: { event: Event }): Promise<void> => {
    const eventType = input.event.type as string;
    const hook = selectors[eventType];

    if (hook) {
      try {
        await hook(input);
      } catch {
        // 静默失败
      }
    }
  };
}

export default createCompositeEventHook;
