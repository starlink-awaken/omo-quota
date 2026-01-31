/**
 * omo-quota Plugin Entry Point
 *
 * OpenCode plugin for intelligent AI quota management and strategy switching.
 * Monitors quota usage across providers and provides tools for quota management.
 *
 * @packageDocumentation
 */

import type { Plugin, Hooks } from "@opencode-ai/plugin";

// Import tools (they export ToolDefinition directly)
import { quotaStatusTool } from "./tools/quota-status";
import { switchStrategyTool } from "./tools/switch-strategy";
import { syncQuotaTool } from "./tools/sync-quota";
import { costReportTool } from "./tools/cost-report";

// Import hooks
import { sessionMonitorHook } from "./hooks/session-monitor";
import { notificationHook } from "./hooks/notification";
import { createCompositeEventHook } from "./hooks/composite-event";

/**
 * omo-quota plugin factory function
 *
 * This plugin provides:
 * - quota_status: Check current quota usage across providers
 * - switch_strategy: Change quota management strategy
 * - sync_quota: Manually sync quota from providers
 * - cost_report: Generate cost analysis report
 *
 * @param input - Plugin input context
 * @returns Hooks object with tools and event handlers
 */
const omoQuotaPlugin: Plugin = async ({ client, $ }): Promise<Hooks> => {
  console.log("[omo-quota] Plugin loading...");

  // Initialize plugin state
  const state = {
    client,
    shell: $,
  };

  console.log("[omo-quota] Plugin loaded successfully");

  return {
    // Register tools
    tool: {
      quota_status: quotaStatusTool,
      switch_strategy: switchStrategyTool,
      sync_quota: syncQuotaTool,
      cost_report: costReportTool,
    },

    // Register event hook - composite of session monitor and notification
    event: createCompositeEventHook(sessionMonitorHook, notificationHook),
  };
};

export default omoQuotaPlugin;

// Export types for external use
export * from "./types";
