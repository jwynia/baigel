/**
 * Base Provider Adapter
 * Provides common functionality for all model provider adapters
 */

import type { ModelProviderType } from '@/lib/types/connections';
import type { 
  IProviderAdapter, 
  ProviderConfig,
  ModelInfo,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderTestResult,
  ModelCapabilities
} from '@/lib/types/providers';
import type { ConnectionStatus } from '@/lib/types/connections';

// Provider error types
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ProviderAuthError extends ProviderError {
  constructor(message: string, originalError?: Error) {
    super(message, 'AUTH_ERROR', 401, originalError);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'ProviderRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ProviderConnectionError extends ProviderError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CONNECTION_ERROR', undefined, originalError);
    this.name = 'ProviderConnectionError';
  }
}

// HTTP client interface for dependency injection
export interface HttpClient {
  get<T = unknown>(url: string, config?: RequestInit): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: RequestInit): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: RequestInit): Promise<T>;
  delete<T = unknown>(url: string, config?: RequestInit): Promise<T>;
  stream(url: string, data?: unknown, config?: RequestInit): AsyncIterable<unknown>;
}

// Default fetch-based HTTP client
export class FetchHttpClient implements HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(baseURL: string, headers: Record<string, string> = {}, timeout = 30000) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = headers;
    this.timeout = timeout;
  }

  private async request<T>(
    method: string, 
    endpoint: string, 
    data?: unknown, 
    config?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...config,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `HTTP ${response.status}: ${errorText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      // Handle empty responses
      const responseText = await response.text();
      if (!responseText) return {} as T;

      try {
        return JSON.parse(responseText);
      } catch {
        throw new ProviderError(
          'Invalid JSON response',
          'PARSE_ERROR',
          response.status
        );
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ProviderError) throw error;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ProviderConnectionError('Request timeout');
        }
        throw new ProviderConnectionError(error.message, error);
      }
      
      throw new ProviderConnectionError('Unknown error occurred');
    }
  }

  async get<T = unknown>(endpoint: string, config?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T = unknown>(endpoint: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T = unknown>(endpoint: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async delete<T = unknown>(endpoint: string, config?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  async* stream(endpoint: string, data?: unknown, config?: RequestInit): AsyncIterable<unknown> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...this.defaultHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...config,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `HTTP ${response.status}: ${errorText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      if (!response.body) {
        throw new ProviderError('No response body for streaming', 'STREAM_ERROR');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process Server-Sent Events
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              
              try {
                const parsed = JSON.parse(data);
                // Validate that parsed data has expected structure
                if (parsed && typeof parsed === 'object') {
                  yield parsed;
                } else {
                  console.warn('Invalid streaming chunk structure:', data);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', data, parseError);
                // Continue processing other chunks instead of failing
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ProviderError) throw error;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ProviderConnectionError('Stream timeout');
        }
        throw new ProviderConnectionError(error.message, error);
      }
      
      throw new ProviderConnectionError('Unknown streaming error');
    }
  }
}

// Base adapter implementation
export abstract class BaseProviderAdapter implements IProviderAdapter {
  abstract readonly type: ModelProviderType;
  abstract readonly name: string;
  
  protected config: ProviderConfig;
  protected httpClient: HttpClient;
  protected isConnected: boolean = false;
  protected lastHealthCheck?: Date;
  protected cachedModels?: ModelInfo[];

  constructor(config: ProviderConfig, httpClient?: HttpClient) {
    this.config = config;
    this.httpClient = httpClient || this.createDefaultHttpClient();
  }

  protected createDefaultHttpClient(): HttpClient {
    const baseURL = this.config.baseUrl || this.getDefaultBaseURL();
    const headers = this.getDefaultHeaders();
    const timeout = this.config.timeout || 30000;
    
    return new FetchHttpClient(baseURL, headers, timeout);
  }

  protected abstract getDefaultBaseURL(): string;
  protected abstract getDefaultHeaders(): Record<string, string>;

  // Connection management
  async connect(config?: ProviderConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
      this.httpClient = this.createDefaultHttpClient();
    }

    try {
      await this.test();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.cachedModels = undefined;
    this.lastHealthCheck = undefined;
  }

  async test(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    
    try {
      const models = await this.listModels();
      const latency = Date.now() - startTime;
      
      // Test with a simple request if possible
      let capabilities: ModelCapabilities | undefined;
      if (models.length > 0) {
        capabilities = models[0]?.capabilities;
      }

      return {
        success: true,
        latency,
        modelCount: models.length,
        capabilities,
        models: models.slice(0, 5), // Return first 5 models as sample
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      };
    }
  }

  // Health checks
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.test();
      this.lastHealthCheck = new Date();
      return result.success;
    } catch {
      this.lastHealthCheck = new Date();
      return false;
    }
  }

  async getStatus(): Promise<{ status: ConnectionStatus; message?: string }> {
    if (!this.isConnected) {
      return { status: 'disconnected', message: 'Not connected' };
    }

    try {
      const healthy = await this.isHealthy();
      return {
        status: healthy ? 'connected' : 'error',
        message: healthy ? 'Connection healthy' : 'Health check failed'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Model operations - abstract methods that must be implemented
  abstract listModels(): Promise<ModelInfo[]>;
  abstract getModel(modelId: string): Promise<ModelInfo | null>;
  
  // Chat operations - abstract methods that must be implemented
  abstract chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract streamChatCompletion(request: ChatCompletionRequest): AsyncIterable<ChatCompletionResponse>;

  // Utility methods for subclasses
  protected validateRequest(request: ChatCompletionRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new ProviderError('Messages array is required and cannot be empty', 'INVALID_REQUEST');
    }

    if (request.maxTokens && request.maxTokens < 1) {
      throw new ProviderError('maxTokens must be greater than 0', 'INVALID_REQUEST');
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new ProviderError('temperature must be between 0 and 2', 'INVALID_REQUEST');
    }
  }

  protected normalizeModel(modelId: string): string {
    return modelId.trim();
  }

  protected createErrorFromResponse(response: unknown, statusCode?: number): ProviderError {
    let message = 'Unknown provider error';
    let code = 'UNKNOWN_ERROR';

    // Type guard for error response
    if (response && typeof response === 'object' && 'error' in response) {
      const errorObj = (response as Record<string, unknown>).error;
      if (typeof errorObj === 'string') {
        message = errorObj;
      } else if (errorObj && typeof errorObj === 'object') {
        const errorDetails = errorObj as Record<string, unknown>;
        message = (typeof errorDetails.message === 'string' ? errorDetails.message : 
                  typeof errorObj === 'object' ? JSON.stringify(errorObj).substring(0, 200) : String(errorObj));
        code = (typeof errorDetails.code === 'string' ? errorDetails.code : 
               typeof errorDetails.type === 'string' ? errorDetails.type : 'API_ERROR');
      }
    } else if (typeof response === 'string') {
      message = response;
    }

    if (statusCode === 401 || code === 'invalid_api_key') {
      return new ProviderAuthError(message);
    }

    if (statusCode === 429 || code === 'rate_limit_exceeded') {
      return new ProviderRateLimitError(message);
    }

    return new ProviderError(message, code, statusCode);
  }

  // Caching utilities
  protected getCachedModels(): ModelInfo[] | undefined {
    return this.cachedModels;
  }

  protected setCachedModels(models: ModelInfo[]): void {
    this.cachedModels = models;
  }

  protected clearCache(): void {
    this.cachedModels = undefined;
  }
}