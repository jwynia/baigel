/**
 * OpenAI-Compatible Provider Adapter
 * Generic adapter for any API that implements the OpenAI API specification
 * Used for custom endpoints, self-hosted models, and other OpenAI-compatible services
 */

import { BaseProviderAdapter, ProviderError, ProviderAuthError } from './base';
import type { 
  ModelProviderType,
  OpenAICompatibleConfig,
  ModelInfo,
  ModelCapabilities,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderTestResult
} from '@/lib/types/providers';

// Generic OpenAI-compatible model response
interface OpenAICompatibleModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
  permission?: any[];
  root?: string;
  parent?: string;
  // Additional fields that might be present
  name?: string;
  description?: string;
  context_length?: number;
  architecture?: string;
  tokenizer?: string;
  // Provider-specific metadata
  [key: string]: any;
}

interface OpenAICompatibleModelsResponse {
  object: string;
  data: OpenAICompatibleModel[];
}

export class OpenAICompatibleAdapter extends BaseProviderAdapter {
  readonly type: ModelProviderType = 'openai-compatible';
  readonly name: string;
  
  private config: OpenAICompatibleConfig;

  constructor(config: OpenAICompatibleConfig) {
    super(config);
    this.config = config;
    this.name = config.providerName || 'OpenAI Compatible';
  }

  protected getDefaultBaseURL(): string {
    if (!this.config.baseUrl) {
      throw new ProviderError('Base URL is required for OpenAI-compatible providers', 'MISSING_BASE_URL');
    }
    return this.config.baseUrl;
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Add any custom headers
    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
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

      const response = await this.httpClient.get<OpenAICompatibleModelsResponse>('/models');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new ProviderError('Invalid response format from API', 'INVALID_RESPONSE');
      }

      const models: ModelInfo[] = response.data.map(model => this.mapModelToModelInfo(model));
      
      // Cache the models
      this.setCachedModels(models);
      
      return models;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      // Try to parse error response
      const apiError = error as any;
      if (apiError.response?.data) {
        throw this.createErrorFromResponse(apiError.response.data, apiError.response.status);
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
      const model = models.find(model => model.id === modelId);
      
      if (model) {
        return model;
      }

      // Try to get individual model if supported
      try {
        const response = await this.httpClient.get<OpenAICompatibleModel>(`/models/${modelId}`);
        return this.mapModelToModelInfo(response);
      } catch {
        // Individual model endpoint not supported, return null
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    this.validateRequest(request);
    
    try {
      const compatibleRequest = this.mapToCompatibleRequest(request);
      const response = await this.httpClient.post<ChatCompletionResponse>('/chat/completions', compatibleRequest);
      
      return this.mapFromCompatibleResponse(response);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const apiError = error as any;
      if (apiError.response?.data) {
        throw this.createErrorFromResponse(apiError.response.data, apiError.response.status);
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
      const compatibleRequest = this.mapToCompatibleRequest({ ...request, stream: true });
      
      for await (const chunk of this.httpClient.stream('/chat/completions', compatibleRequest)) {
        if (chunk) {
          yield this.mapFromCompatibleResponse(chunk);
        }
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const apiError = error as any;
      if (apiError.response?.data) {
        throw this.createErrorFromResponse(apiError.response.data, apiError.response.status);
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
              messages: [{ role: 'user', content: 'Hi' }],
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

  private mapModelToModelInfo(model: OpenAICompatibleModel): ModelInfo {
    const capabilities = this.inferModelCapabilities(model);
    const contextLength = this.inferContextLength(model);

    return {
      id: model.id,
      name: model.name || model.id,
      description: model.description || `${this.name} model: ${model.id}`,
      owner: model.owned_by || this.name,
      contextLength,
      capabilities,
      metadata: {
        created: model.created || Date.now(),
        object: model.object,
        architecture: model.architecture,
        tokenizer: model.tokenizer,
        root: model.root,
        parent: model.parent,
        ...this.extractAdditionalMetadata(model),
      }
    };
  }

  private inferModelCapabilities(model: OpenAICompatibleModel): ModelCapabilities {
    const id = model.id.toLowerCase();
    
    // If the model provides explicit capability information, use it
    if (model.capabilities) {
      return {
        streaming: model.capabilities.streaming ?? true,
        functionCalling: model.capabilities.function_calling ?? model.capabilities.tools ?? true,
        vision: model.capabilities.vision ?? model.capabilities.multimodal ?? false,
        embeddings: model.capabilities.embeddings ?? id.includes('embedding'),
        tools: model.capabilities.tools ?? model.capabilities.function_calling ?? true,
        maxTokens: model.capabilities.max_tokens || model.context_length,
        inputTypes: model.capabilities.input_types || ['text'],
        outputTypes: model.capabilities.output_types || ['text'],
      };
    }
    
    // Infer capabilities from model name/id
    const isEmbeddingModel = id.includes('embedding') || id.includes('embed');
    const isVisionModel = id.includes('vision') || id.includes('multimodal') || id.includes('llava');
    const isCodeModel = id.includes('code') || id.includes('copilot');
    
    // Check for specific model families
    const isOpenAIModel = id.includes('gpt-') || id.includes('text-');
    const isAnthropicModel = id.includes('claude');
    const isLlamaModel = id.includes('llama') || id.includes('vicuna') || id.includes('alpaca');
    const isMistralModel = id.includes('mistral') || id.includes('mixtral');
    
    return {
      streaming: true, // Most modern models support streaming
      functionCalling: !isEmbeddingModel, // Most chat models support function calling
      vision: isVisionModel,
      embeddings: isEmbeddingModel,
      tools: !isEmbeddingModel,
      inputTypes: isVisionModel ? ['text', 'image'] : ['text'],
      outputTypes: ['text'],
    };
  }

  private inferContextLength(model: OpenAICompatibleModel): number {
    // Use explicit context length if provided
    if (model.context_length) {
      return model.context_length;
    }
    
    const id = model.id.toLowerCase();
    
    // Common context length patterns
    if (id.includes('32k')) return 32768;
    if (id.includes('16k')) return 16384;
    if (id.includes('8k')) return 8192;
    if (id.includes('4k')) return 4096;
    if (id.includes('2k')) return 2048;
    
    // Model family defaults
    if (id.includes('gpt-4')) return 8192;
    if (id.includes('gpt-3.5')) return 4097;
    if (id.includes('claude')) return 100000;
    if (id.includes('llama')) return 4096;
    if (id.includes('mistral')) return 32768;
    
    // Default
    return 4096;
  }

  private findSuitableTestModel(models: ModelInfo[]): ModelInfo | undefined {
    // Prefer smaller, faster models for testing
    const chatModels = models.filter(m => 
      !m.capabilities.embeddings && 
      m.capabilities.streaming
    );
    
    // Look for common fast models
    const fastModel = chatModels.find(m => {
      const id = m.id.toLowerCase();
      return id.includes('turbo') || id.includes('3.5') || id.includes('small') || id.includes('7b');
    });
    
    if (fastModel) return fastModel;
    
    // Fall back to first available chat model
    return chatModels[0];
  }

  private mapToCompatibleRequest(request: ChatCompletionRequest): any {
    const compatibleRequest: any = {
      model: request.model || this.config.defaultModel,
      messages: request.messages,
    };

    // Only include supported parameters based on compatibility mode
    const strictMode = this.config.compatibilityMode === 'strict';

    if (!strictMode || request.stream !== undefined) {
      compatibleRequest.stream = request.stream || false;
    }

    // Core OpenAI parameters (widely supported)
    if (request.temperature !== undefined) compatibleRequest.temperature = request.temperature;
    if (request.maxTokens !== undefined) compatibleRequest.max_tokens = request.maxTokens;
    if (request.topP !== undefined) compatibleRequest.top_p = request.topP;
    if (request.stop !== undefined) compatibleRequest.stop = request.stop;

    // Advanced parameters (may not be supported by all providers)
    if (!strictMode) {
      if (request.frequencyPenalty !== undefined) compatibleRequest.frequency_penalty = request.frequencyPenalty;
      if (request.presencePenalty !== undefined) compatibleRequest.presence_penalty = request.presencePenalty;
      if (request.seed !== undefined) compatibleRequest.seed = request.seed;
      if (request.user !== undefined) compatibleRequest.user = request.user;
      
      // Tools and function calling
      if (request.tools && request.tools.length > 0) {
        compatibleRequest.tools = request.tools;
        if (request.toolChoice) {
          compatibleRequest.tool_choice = request.toolChoice;
        }
      }

      // Response format
      if (request.responseFormat) {
        compatibleRequest.response_format = request.responseFormat;
      }
    }

    return compatibleRequest;
  }

  private mapFromCompatibleResponse(response: any): ChatCompletionResponse {
    // Normalize response to standard format
    return {
      id: response.id || `compat-${Date.now()}`,
      object: response.object || 'chat.completion',
      created: response.created || Math.floor(Date.now() / 1000),
      model: response.model || 'unknown',
      choices: response.choices || [],
      usage: response.usage,
      systemFingerprint: response.system_fingerprint,
    };
  }

  private extractAdditionalMetadata(model: OpenAICompatibleModel): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract any additional fields that aren't part of the standard interface
    const standardFields = ['id', 'object', 'created', 'owned_by', 'permission', 'root', 'parent', 'name', 'description', 'context_length'];
    
    for (const [key, value] of Object.entries(model)) {
      if (!standardFields.includes(key)) {
        metadata[key] = value;
      }
    }
    
    return metadata;
  }

  protected createErrorFromResponse(response: any, statusCode?: number): ProviderError {
    let message = 'Unknown API error';
    let code = 'UNKNOWN_ERROR';

    // Handle different error response formats
    if (response?.error) {
      if (typeof response.error === 'string') {
        message = response.error;
      } else if (response.error.message) {
        message = response.error.message;
        code = response.error.code || response.error.type || 'API_ERROR';
      }
    } else if (response?.message) {
      message = response.message;
      code = response.code || response.type || 'API_ERROR';
    } else if (typeof response === 'string') {
      message = response;
    }

    // Add provider context to the message if not already present
    if (!message.includes(this.name)) {
      message = `${this.name} API error: ${message}`;
    }

    if (statusCode === 401 || code.includes('auth') || code.includes('key')) {
      return new ProviderAuthError(message);
    }

    if (statusCode === 429 || code.includes('rate_limit') || code.includes('quota')) {
      return new ProviderError(message, 'RATE_LIMIT', statusCode);
    }

    if (statusCode === 400 || code.includes('invalid_request')) {
      return new ProviderError(message, 'INVALID_REQUEST', statusCode);
    }

    return new ProviderError(message, code, statusCode);
  }
}

// Factory function
export function createOpenAICompatibleAdapter(config: OpenAICompatibleConfig): OpenAICompatibleAdapter {
  if (!config.baseUrl) {
    throw new ProviderError('Base URL is required for OpenAI-compatible providers', 'MISSING_BASE_URL');
  }
  
  return new OpenAICompatibleAdapter(config);
}