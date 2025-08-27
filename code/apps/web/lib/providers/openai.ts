/**
 * OpenAI Provider Adapter
 * Implements OpenAI API integration with full feature support
 */

import { BaseProviderAdapter, ProviderError, ProviderAuthError } from './base';
import type { 
  ModelProviderType,
  OpenAIConfig,
  ModelInfo,
  ModelCapabilities,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderTestResult
} from '@/lib/types/providers';

// OpenAI API response types
interface OpenAIModel {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  object: 'list';
  data: OpenAIModel[];
}

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export class OpenAIAdapter extends BaseProviderAdapter {
  readonly type: ModelProviderType = 'openai-provider';
  readonly name: string = 'OpenAI';
  
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    super(config);
    this.config = config;
  }

  protected getDefaultBaseURL(): string {
    return 'https://api.openai.com/v1';
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.config.organizationId) {
      headers['OpenAI-Organization'] = this.config.organizationId;
    }

    if (this.config.project) {
      headers['OpenAI-Project'] = this.config.project;
    }

    return headers;
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      // Check cache first
      const cached = this.getCachedModels();
      if (cached) {
        return cached;
      }

      const response = await this.httpClient.get<OpenAIModelsResponse>('/models');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new ProviderError('Invalid response format from OpenAI API', 'INVALID_RESPONSE');
      }

      const models: ModelInfo[] = response.data.map(model => this.mapOpenAIModelToModelInfo(model));
      
      // Cache the models
      this.setCachedModels(models);
      
      return models;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const openaiError = error as any;
      if (openaiError.response?.data?.error) {
        throw this.createErrorFromResponse(openaiError.response.data, openaiError.response.status);
      }
      
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to list models',
        'LIST_MODELS_ERROR'
      );
    }
  }

  async getModel(modelId: string): Promise<ModelInfo | null> {
    try {
      // Try to get from cache first
      const models = await this.listModels();
      return models.find(model => model.id === modelId) || null;
    } catch (error) {
      // If listing fails, try to get individual model
      try {
        const response = await this.httpClient.get<OpenAIModel>(`/models/${modelId}`);
        return this.mapOpenAIModelToModelInfo(response);
      } catch {
        return null;
      }
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    this.validateRequest(request);
    
    try {
      const openaiRequest = this.mapToOpenAIRequest(request);
      const response = await this.httpClient.post<ChatCompletionResponse>('/chat/completions', openaiRequest);
      
      return this.mapFromOpenAIResponse(response);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const openaiError = error as any;
      if (openaiError.response?.data?.error) {
        throw this.createErrorFromResponse(openaiError.response.data, openaiError.response.status);
      }
      
      throw new ProviderError(
        error instanceof Error ? error.message : 'Chat completion failed',
        'CHAT_COMPLETION_ERROR'
      );
    }
  }

  async* streamChatCompletion(request: ChatCompletionRequest): AsyncIterable<ChatCompletionResponse> {
    this.validateRequest(request);
    
    try {
      const openaiRequest = this.mapToOpenAIRequest({ ...request, stream: true });
      
      for await (const chunk of this.httpClient.stream('/chat/completions', openaiRequest)) {
        if (chunk) {
          yield this.mapFromOpenAIResponse(chunk);
        }
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const openaiError = error as any;
      if (openaiError.response?.data?.error) {
        throw this.createErrorFromResponse(openaiError.response.data, openaiError.response.status);
      }
      
      throw new ProviderError(
        error instanceof Error ? error.message : 'Streaming chat completion failed',
        'STREAM_ERROR'
      );
    }
  }

  async test(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    
    try {
      // Test API connectivity by listing models
      const models = await this.listModels();
      const latency = Date.now() - startTime;
      
      // Test a simple completion if models are available
      let capabilities: ModelCapabilities | undefined;
      if (models.length > 0) {
        const testModel = this.findSuitableTestModel(models);
        if (testModel) {
          try {
            await this.chatCompletion({
              messages: [{ role: 'user', content: 'Hello' }],
              model: testModel.id,
              maxTokens: 5,
              temperature: 0.1,
            });
            capabilities = testModel.capabilities;
          } catch {
            // Test completion failed, but model listing worked
            capabilities = testModel.capabilities;
          }
        }
      }

      return {
        success: true,
        latency,
        modelCount: models.length,
        capabilities,
        models: models.slice(0, 5),
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

  private mapOpenAIModelToModelInfo(model: OpenAIModel): ModelInfo {
    const capabilities = this.inferModelCapabilities(model.id);
    const contextLength = this.inferContextLength(model.id);

    return {
      id: model.id,
      name: model.id,
      description: `OpenAI model: ${model.id}`,
      owner: model.owned_by,
      contextLength,
      capabilities,
      metadata: {
        created: model.created,
        object: model.object,
      }
    };
  }

  private inferModelCapabilities(modelId: string): ModelCapabilities {
    const id = modelId.toLowerCase();
    
    // GPT-4 models
    if (id.includes('gpt-4')) {
      return {
        streaming: true,
        functionCalling: true,
        vision: id.includes('vision') || id.includes('turbo'),
        embeddings: false,
        tools: true,
        inputTypes: id.includes('vision') ? ['text', 'image'] : ['text'],
        outputTypes: ['text'],
      };
    }
    
    // GPT-3.5 models
    if (id.includes('gpt-3.5')) {
      return {
        streaming: true,
        functionCalling: id.includes('turbo'),
        vision: false,
        embeddings: false,
        tools: id.includes('turbo'),
        inputTypes: ['text'],
        outputTypes: ['text'],
      };
    }
    
    // O1 models
    if (id.includes('o1')) {
      return {
        streaming: false, // O1 models don't support streaming
        functionCalling: false, // O1 models don't support function calling
        vision: false,
        embeddings: false,
        tools: false,
        inputTypes: ['text'],
        outputTypes: ['text'],
      };
    }
    
    // Embedding models
    if (id.includes('embedding') || id.includes('ada')) {
      return {
        streaming: false,
        functionCalling: false,
        vision: false,
        embeddings: true,
        tools: false,
        inputTypes: ['text'],
        outputTypes: ['text'], // Embeddings are returned as arrays but simplified here
      };
    }
    
    // Default capabilities
    return {
      streaming: true,
      functionCalling: true,
      vision: false,
      embeddings: false,
      tools: true,
      inputTypes: ['text'],
      outputTypes: ['text'],
    };
  }

  private inferContextLength(modelId: string): number {
    const id = modelId.toLowerCase();
    
    if (id.includes('gpt-4-turbo') || id.includes('gpt-4-0125')) return 128000;
    if (id.includes('gpt-4-32k')) return 32768;
    if (id.includes('gpt-4')) return 8192;
    if (id.includes('gpt-3.5-turbo-16k')) return 16385;
    if (id.includes('gpt-3.5')) return 4097;
    if (id.includes('o1-preview')) return 128000;
    if (id.includes('o1-mini')) return 128000;
    if (id.includes('embedding')) return 8191;
    
    // Default
    return 4097;
  }

  private findSuitableTestModel(models: ModelInfo[]): ModelInfo | undefined {
    // Prefer GPT-3.5-turbo for testing (fast and cheap)
    const preferred = models.find(m => m.id.includes('gpt-3.5-turbo') && !m.id.includes('16k'));
    if (preferred) return preferred;
    
    // Fall back to any chat model
    return models.find(m => 
      m.capabilities.streaming && 
      !m.id.includes('embedding') && 
      !m.id.includes('whisper')
    );
  }

  private mapToOpenAIRequest(request: ChatCompletionRequest): any {
    const openaiRequest: any = {
      model: request.model || this.config.defaultModel || 'gpt-3.5-turbo',
      messages: request.messages,
      stream: request.stream || false,
    };

    // Optional parameters
    if (request.temperature !== undefined) openaiRequest.temperature = request.temperature;
    if (request.maxTokens !== undefined) openaiRequest.max_tokens = request.maxTokens;
    if (request.topP !== undefined) openaiRequest.top_p = request.topP;
    if (request.frequencyPenalty !== undefined) openaiRequest.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined) openaiRequest.presence_penalty = request.presencePenalty;
    if (request.stop !== undefined) openaiRequest.stop = request.stop;
    if (request.seed !== undefined) openaiRequest.seed = request.seed;
    if (request.user !== undefined) openaiRequest.user = request.user;

    // Tools and function calling
    if (request.tools && request.tools.length > 0) {
      openaiRequest.tools = request.tools;
      if (request.toolChoice) {
        openaiRequest.tool_choice = request.toolChoice;
      }
    }

    // Response format
    if (request.responseFormat) {
      openaiRequest.response_format = request.responseFormat;
    }

    return openaiRequest;
  }

  private mapFromOpenAIResponse(response: any): ChatCompletionResponse {
    // OpenAI responses are already in the correct format, just ensure required fields
    return {
      id: response.id || '',
      object: response.object || 'chat.completion',
      created: response.created || Date.now(),
      model: response.model || '',
      choices: response.choices || [],
      usage: response.usage,
      systemFingerprint: response.system_fingerprint,
    };
  }

  protected createErrorFromResponse(response: OpenAIErrorResponse, statusCode?: number): ProviderError {
    const { error } = response;
    const message = error.message || 'Unknown OpenAI API error';
    const code = error.code || error.type || 'UNKNOWN_ERROR';

    if (statusCode === 401 || code === 'invalid_api_key') {
      return new ProviderAuthError(`OpenAI API authentication failed: ${message}`);
    }

    if (statusCode === 429 || code === 'rate_limit_exceeded') {
      return new ProviderError(
        `OpenAI API rate limit exceeded: ${message}`,
        'RATE_LIMIT',
        statusCode
      );
    }

    if (statusCode === 400 || code === 'invalid_request_error') {
      return new ProviderError(
        `OpenAI API invalid request: ${message}`,
        'INVALID_REQUEST',
        statusCode
      );
    }

    return new ProviderError(`OpenAI API error: ${message}`, code, statusCode);
  }
}

// Factory function
export function createOpenAIAdapter(config: OpenAIConfig): OpenAIAdapter {
  if (!config.apiKey) {
    throw new ProviderAuthError('OpenAI API key is required');
  }
  
  return new OpenAIAdapter(config);
}