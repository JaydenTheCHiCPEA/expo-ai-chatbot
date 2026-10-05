import { getApiUrl } from "@/lib/apiUrl";

export type ApiErrorType = "network" | "client" | "server" | "auth" | "unknown";

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public statusCode?: number,
    public details?: Record<string, any>,
  ) {
    super(`API Error [${type}]: ${statusCode || "unknown"}`);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  chatId?: string;
  body?: any;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000;

/**
 * Enhanced API client with comprehensive error handling, logging, and debugging
 */
export class ApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private requestLog: Array<{
    timestamp: number;
    method: string;
    endpoint: string;
    status?: number;
    duration: number;
  }> = [];

  constructor(timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = getApiUrl();
    this.requestTimeout = timeout;
  }

  /**
   * Get request log for debugging
   */
  getRequestLog() {
    return this.requestLog;
  }

  /**
   * Clear request log
   */
  clearRequestLog() {
    this.requestLog = [];
  }

  /**
   * Log API request/response for debugging
   */
  private logRequest(
    method: string,
    endpoint: string,
    status?: number,
    duration?: number,
  ) {
    const log = {
      timestamp: Date.now(),
      method,
      endpoint,
      status,
      duration: duration || 0,
    };

    this.requestLog.push(log);

    // Keep only last 50 requests
    if (this.requestLog.length > 50) {
      this.requestLog.shift();
    }

    const statusStr = status ? ` (${status})` : "";
    const durationStr = duration ? ` - ${duration}ms` : "";
    console.log(`[API] ${method} ${endpoint}${statusStr}${durationStr}`);
  }

  /**
   * Make an API request with comprehensive error handling
   */
  async fetch(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<Response> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${
      endpoint.startsWith("/") ? endpoint : `/api/${endpoint}`
    }`;
    const method = options.method || "GET";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...(options.body && { body: JSON.stringify(options.body) }),
        ...(options.chatId && !options.body && {
          body: JSON.stringify({ chatId: options.chatId }),
        }),
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      this.logRequest(method, endpoint, response.status, duration);

      if (!response.ok) {
        let errorDetails: Record<string, any> | undefined;

        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            errorDetails = await response.json();
          }
        } catch {
          // If JSON parsing fails, that's ok
        }

        const errorType: ApiErrorType =
          response.status === 401 || response.status === 403
            ? "auth"
            : response.status >= 500
              ? "server"
              : "client";

        throw new ApiError(errorType, response.status, errorDetails);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        this.logRequest(method, endpoint, error.statusCode, duration);
        throw error;
      }

      if (error instanceof TypeError) {
        // Network error
        this.logRequest(method, endpoint, undefined, duration);
        console.error(`[API] Network Error: ${error.message}`);
        throw new ApiError("network", undefined, {
          originalError: error.message,
        });
      }

      // Abort/timeout error
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        this.logRequest(method, endpoint, undefined, duration);
        console.error(`[API] Request Timeout: ${this.requestTimeout}ms`);
        throw new ApiError("unknown", undefined, {
          originalError: "Request timeout",
          timeout: this.requestTimeout,
        });
      }

      this.logRequest(method, endpoint, undefined, duration);
      console.error(`[API] Unknown Error:`, error);
      throw new ApiError("unknown", undefined, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Make an API request and parse JSON response
   */
  async json<T = any>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const response = await this.fetch(endpoint, options);
    return response.json();
  }
}

export const apiClient = new ApiClient();

/**
 * Legacy function for backwards compatibility
 */
export async function fetchApi(
  endpoint: string,
  options: { chatId?: string; method?: string; body?: any } = {},
) {
  const response = await apiClient.fetch(endpoint, options);
  return response.json();
}

/**
 * Get chat history
 */
export async function getChatsByUserId() {
  try {
    return await apiClient.json("/api/history");
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

/**
 * Get chat by ID
 */
export async function getChatById({ chatId }: { chatId: string }) {
  try {
    return await apiClient.json("/api/chat", { chatId });
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw error;
  }
}