/**
 * Developer Configuration & Debugging CLI Tool
 * 
 * This provides utilities for developers to:
 * - Configure API endpoints and environment
 * - Debug API communication
 * - View request logs
 * - Test connectivity
 * - Manage source materials from CLI
 */

import { apiClient } from "@/lib/api-client";

export interface DevToolsConfig {
  debug: boolean;
  logRequests: boolean;
  apiUrl: string;
  timeout: number;
}

class DeveloperTools {
  private config: DevToolsConfig = {
    debug: false,
    logRequests: false,
    apiUrl: "",
    timeout: 30000,
  };

  /**
   * Initialize dev tools with configuration
   */
  init(config: Partial<DevToolsConfig>) {
    this.config = { ...this.config, ...config };
    if (this.config.debug) {
      console.log("[DevTools] Initialized with config:", this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DevToolsConfig {
    return { ...this.config };
  }

  /**
   * Enable debug logging
   */
  enableDebug() {
    this.config.debug = true;
    console.log("[DevTools] Debug enabled");
  }

  /**
   * Disable debug logging
   */
  disableDebug() {
    this.config.debug = false;
  }

  /**
   * Get all API request logs
   */
  getRequestLogs() {
    return apiClient.getRequestLog();
  }

  /**
   * Clear request logs
   */
  clearRequestLogs() {
    apiClient.clearRequestLog();
    console.log("[DevTools] Request logs cleared");
  }

  /**
   * Print formatted request logs
   */
  printRequestLogs() {
    const logs = this.getRequestLogs();
    if (logs.length === 0) {
      console.log("[DevTools] No request logs");
      return;
    }

    console.log("[DevTools] Recent API Requests:");
    console.log("─".repeat(80));
    logs.forEach((log, i) => {
      const statusColor = log.status ? (log.status >= 400 ? "🔴" : "🟢") : "⚠️";
      const timeStr = new Date(log.timestamp).toLocaleTimeString();
      console.log(
        `${i + 1}. ${timeStr} ${statusColor} ${log.method} ${log.endpoint}`,
      );
      if (log.status) console.log(`   Status: ${log.status}`);
      if (log.duration) console.log(`   Duration: ${log.duration}ms`);
    });
    console.log("─".repeat(80));
  }

  /**
   * Test API connectivity
   */
  async testConnectivity(): Promise<{
    success: boolean;
    message: string;
    duration: number;
  }> {
    const startTime = Date.now();
    try {
      console.log("[DevTools] Testing API connectivity...");
      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        method: "GET",
        timeout: this.config.timeout,
      });

      const duration = Date.now() - startTime;
      if (response.ok) {
        return {
          success: true,
          message: `✅ API is reachable (${duration}ms)`,
          duration,
        };
      } else {
        return {
          success: false,
          message: `❌ API returned status ${response.status}`,
          duration,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `❌ API is unreachable: ${
          error instanceof Error ? error.message : String(error)
        }`,
        duration,
      };
    }
  }

  /**
   * Get system status and health information
   */
  async getSystemStatus(): Promise<{
    apiStatus: "online" | "offline";
    dbStatus: "connected" | "disconnected";
    modelStatus: "available" | "unavailable";
    responseTime: number;
  }> {
    try {
      const response = await apiClient.json("/api/debug/health");
      return response;
    } catch (error) {
      return {
        apiStatus: "offline",
        dbStatus: "disconnected",
        modelStatus: "unavailable",
        responseTime: 0,
      };
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironment(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API URL
    if (!this.config.apiUrl) {
      errors.push("API URL not configured");
    }

    // Check connectivity
    const connectivity = await this.testConnectivity();
    if (!connectivity.success) {
      errors.push(`API connectivity: ${connectivity.message}`);
    }

    // Check for common issues
    if (this.config.timeout < 5000) {
      warnings.push("API timeout is very short (<5s)");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Print system status
   */
  async printSystemStatus() {
    console.log("[DevTools] Fetching system status...");
    const status = await this.getSystemStatus();
    console.log("─".repeat(80));
    console.log("API Status:  ", status.apiStatus === "online" ? "✅" : "❌");
    console.log("DB Status:   ", status.dbStatus === "connected" ? "✅" : "❌");
    console.log("Model Status:", status.modelStatus === "available" ? "✅" : "❌");
    console.log(`Response Time: ${status.responseTime}ms`);
    console.log("─".repeat(80));
  }

  /**
   * Print environment validation report
   */
  async printEnvironmentReport() {
    console.log("[DevTools] Validating environment...");
    const result = await this.validateEnvironment();
    console.log("─".repeat(80));
    console.log("Environment Validation:", result.valid ? "✅ VALID" : "❌ INVALID");

    if (result.errors.length > 0) {
      console.log("\nErrors:");
      result.errors.forEach((err) => console.log(`  ❌ ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log("\nWarnings:");
      result.warnings.forEach((warn) => console.log(`  ⚠️  ${warn}`));
    }

    console.log("─".repeat(80));
  }
}

// Export singleton instance
export const devTools = new DeveloperTools();

// Expose to global scope in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__DEVTOOLS__ = devTools;
  console.log(
    "%c🛠️  Developer Tools Available",
    "color: blue; font-weight: bold",
  );
  console.log(
    "%cAccess via: window.__DEVTOOLS__\nAvailable methods:\n• enableDebug()\n• printRequestLogs()\n• printSystemStatus()\n• testConnectivity()\n• validateEnvironment()",
    "color: gray",
  );
}
