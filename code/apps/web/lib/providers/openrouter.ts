/**
 * OpenRouter Provider Adapter
 * Implements OpenRouter API integration with multi-model support
 * OpenRouter provides access to 280+ models through a unified OpenAI-compatible API
 */

import { BaseProviderAdapter, ProviderError, ProviderAuthError } from './base';
import type { 
  ModelProviderType,
  OpenRouterConfig,
  ModelInfo,
  ModelCapabilities,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderTestResult
} from '@/lib/types/providers';

// OpenRouter-specific model response
interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  created: number;
  owned_by?: string;
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// OpenRouter generation response includes additional metadata
interface OpenRouterGenerationResponse extends ChatCompletionResponse {
  id: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    // OpenRouter-specific usage info
    total_cost?: number;
    prompt_cost?: number;
    completion_cost?: number;
  };
  // OpenRouter-specific metadata
  provider?: {
    name: string;
    model: string;
  };
}

export class OpenRouterAdapter extends BaseProviderAdapter {
  readonly type: ModelProviderType = 'openrouter';
  readonly name: string = 'OpenRouter';
  
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    super(config);
    this.config = config;
  }

  protected getDefaultBaseURL(): string {
    return 'https://openrouter.ai/api/v1';
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Optional headers for OpenRouter rankings and analytics
    if (this.config.siteUrl) {
      headers['HTTP-Referer'] = this.config.siteUrl;
    }

    if (this.config.siteName) {
      headers['X-Title'] = this.config.siteName;
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

      const response = await this.httpClient.get<OpenRouterModelsResponse>('/models');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new ProviderError('Invalid response format from OpenRouter API', 'INVALID_RESPONSE');
      }

      // Filter models based on preferred providers if specified
      let models = response.data;
      if (this.config.preferredProviders && this.config.preferredProviders.length > 0) {
        models = models.filter(model => 
          this.config.preferredProviders!.some(provider => 
            model.id.toLowerCase().includes(provider.toLowerCase())
          )
        );
      }

      const modelInfos: ModelInfo[] = models.map(model => this.mapOpenRouterModelToModelInfo(model));
      
      // Cache the models
      this.setCachedModels(modelInfos);
      
      return modelInfos;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const openrouterError = error as any;
      if (openrouterError.response?.data?.error) {
        throw this.createErrorFromResponse(openrouterError.response.data, openrouterError.response.status);
      }
      
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to list models',
        'LIST_MODELS_ERROR'
      );
    }
  }

  async getModel(modelId: string): Promise<ModelInfo | null> {
    try {
      // Get from cache/list first
      const models = await this.listModels();
      return models.find(model => model.id === modelId) || null;
    } catch (error) {
      return null;
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    this.validateRequest(request);
    
    try {
      const openrouterRequest = this.mapToOpenRouterRequest(request);
      const response = await this.httpClient.post<OpenRouterGenerationResponse>('/chat/completions', openrouterRequest);
      
      return this.mapFromOpenRouterResponse(response);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const openrouterError = error as any;
      if (openrouterError.response?.data?.error) {
        throw this.createErrorFromResponse(openrouterError.response.data, openrouterError.response.status);
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
      const openrouterRequest = this.mapToOpenRouterRequest({ ...request, stream: true });
      
      for await (const chunk of this.httpClient.stream('/chat/completions', openrouterRequest)) {
        if (chunk) {
          yield this.mapFromOpenRouterResponse(chunk);
        }
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      
      const openrouterError = error as any;
      if (openrouterError.response?.data?.error) {
        throw this.createErrorFromResponse(openrouterError.response.data, openrouterError.response.status);
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
      
      // Test a simple completion with a fast, cheap model
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
        models: models.slice(0, 10), // Show more models for OpenRouter
        provider: this.name,
        version: '1.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      };
    }
  }

  private mapOpenRouterModelToModelInfo(model: OpenRouterModel): ModelInfo {
    const capabilities = this.inferOpenRouterModelCapabilities(model);

    return {
      id: model.id,
      name: model.name,
      description: model.description || `OpenRouter model: ${model.name}`,
      owner: model.owned_by || this.extractProviderFromId(model.id),
      contextLength: model.context_length,
      capabilities,
      costPer1kTokens: {
        input: parseFloat(model.pricing.prompt) * 1000,
        output: parseFloat(model.pricing.completion) * 1000,
      },
      metadata: {
        created: model.created,
        architecture: model.architecture,
        pricing: model.pricing,
        topProvider: model.top_provider,
        perRequestLimits: model.per_request_limits,
        openrouterProvider: this.extractProviderFromId(model.id),
      }
    };
  }

  private inferOpenRouterModelCapabilities(model: OpenRouterModel): ModelCapabilities {
    const modality = model.architecture?.modality || '';
    const isMultimodal = modality.includes('image') || modality.includes('vision');
    const isTextOnly = modality === 'text' || modality === 'text->text';
    
    // Most OpenRouter models support these features
    const supportsStreaming = true;
    const supportsFunctionCalling = !model.id.includes('claude-1'); // Most models except very old ones
    const supportsTools = supportsFunctionCalling;

    return {
      streaming: supportsStreaming,
      functionCalling: supportsFunctionCalling,
      vision: isMultimodal,
      embeddings: false, // OpenRouter doesn't expose embedding models through chat endpoint
      tools: supportsTools,
      maxTokens: model.top_provider?.max_completion_tokens,
      inputTypes: isMultimodal ? ['text', 'image'] : ['text'],
      outputTypes: ['text'], // OpenRouter primarily supports text output
    };
  }

  private extractProviderFromId(modelId: string): string {
    // Extract provider name from model ID (e.g., "openai/gpt-4" -> "openai")
    const parts = modelId.split('/');
    return parts.length > 1 ? parts[0] : 'unknown';
  }

  private findSuitableTestModel(models: ModelInfo[]): ModelInfo | undefined {
    // Prefer free or very cheap models for testing
    const freeModels = models.filter(m => 
      m.costPer1kTokens && 
      m.costPer1kTokens.input < 0.001 && 
      m.capabilities.streaming
    );
    
    if (freeModels.length > 0) {
      // Prefer smaller, faster models
      const fastModel = freeModels.find(m => 
        m.id.includes('3.5') || 
        m.id.includes('gemma') || 
        m.id.includes('phi') ||
        m.id.includes('7b')
      );
      
      if (fastModel) return fastModel;
      return freeModels[0];
    }
    
    // Fall back to cheapest available model
    const sortedByCost = models
      .filter(m => m.costPer1kTokens && m.capabilities.streaming)
      .sort((a, b) => (a.costPer1kTokens?.input || 0) - (b.costPer1kTokens?.input || 0));
    
    return sortedByCost[0];
  }

  private mapToOpenRouterRequest(request: ChatCompletionRequest): any {
    const openrouterRequest: any = {
      model: request.model || this.config.defaultModel,
      messages: request.messages,
      stream: request.stream || false,
    };

    // Standard OpenAI parameters (all supported by OpenRouter)
    if (request.temperature !== undefined) openrouterRequest.temperature = request.temperature;
    if (request.maxTokens !== undefined) openrouterRequest.max_tokens = request.maxTokens;
    if (request.topP !== undefined) openrouterRequest.top_p = request.topP;
    if (request.frequencyPenalty !== undefined) openrouterRequest.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined) openrouterRequest.presence_penalty = request.presencePenalty;
    if (request.stop !== undefined) openrouterRequest.stop = request.stop;
    if (request.seed !== undefined) openrouterRequest.seed = request.seed;
    if (request.user !== undefined) openrouterRequest.user = request.user;

    // Tools and function calling
    if (request.tools && request.tools.length > 0) {
      openrouterRequest.tools = request.tools;
      if (request.toolChoice) {
        openrouterRequest.tool_choice = request.toolChoice;
      }
    }

    // Response format
    if (request.responseFormat) {
      openrouterRequest.response_format = request.responseFormat;
    }

    // OpenRouter-specific parameters
    if (this.config.preferredProviders && this.config.preferredProviders.length > 0) {
      // Can add provider preference hints if needed
    }

    return openrouterRequest;
  }

  private mapFromOpenRouterResponse(response: OpenRouterGenerationResponse): ChatCompletionResponse {
    return {
      id: response.id || '',
      object: response.object || 'chat.completion',
      created: response.created || Math.floor(Date.now() / 1000),
      model: response.model || '',
      choices: response.choices || [],
      usage: response.usage,
      systemFingerprint: response.systemFingerprint,
      // Include OpenRouter-specific metadata in a way that doesn't break the interface
      ...(response.provider && { _provider: response.provider }),
    };
  }

  protected createErrorFromResponse(response: any, statusCode?: number): ProviderError {
    let message = 'Unknown OpenRouter API error';
    let code = 'UNKNOWN_ERROR';

    if (response?.error) {
      message = response.error.message || response.error;
      code = response.error.code || response.error.type || 'API_ERROR';
    }

    if (statusCode === 401 || code === 'invalid_api_key') {
      return new ProviderAuthError(`OpenRouter API authentication failed: ${message}`);
    }

    if (statusCode === 402 || code === 'insufficient_credits') {
      return new ProviderError(
        `OpenRouter insufficient credits: ${message}`,
        'INSUFFICIENT_CREDITS',
        statusCode
      );
    }

    if (statusCode === 429 || code === 'rate_limit_exceeded') {
      return new ProviderError(
        `OpenRouter rate limit exceeded: ${message}`,
        'RATE_LIMIT',
        statusCode
      );
    }

    if (statusCode === 400 || code === 'invalid_request_error') {
      return new ProviderError(
        `OpenRouter invalid request: ${message}`,
        'INVALID_REQUEST',
        statusCode
      );
    }

    if (statusCode === 503 || code === 'service_unavailable') {
      return new ProviderError(
        `OpenRouter service unavailable: ${message}`,
        'SERVICE_UNAVAILABLE',
        statusCode
      );
    }

    return new ProviderError(`OpenRouter API error: ${message}`, code, statusCode);
  }

  // Helper methods for OpenRouter-specific features
  
  /**
   * Get models by provider (e.g., all OpenAI models, all Anthropic models)
   */
  async getModelsByProvider(providerName: string): Promise<ModelInfo[]> {
    const allModels = await this.listModels();
    return allModels.filter(model => 
      this.extractProviderFromId(model.id).toLowerCase() === providerName.toLowerCase()
    );
  }

  /**
   * Get the cheapest models available
   */
  async getCheapestModels(limit: number = 10): Promise<ModelInfo[]> {
    const allModels = await this.listModels();
    return allModels
      .filter(model => model.costPer1kTokens)
      .sort((a, b) => (a.costPer1kTokens?.input || 0) - (b.costPer1kTokens?.input || 0))
      .slice(0, limit);
  }

  /**
   * Get models with specific capabilities
   */
  async getModelsByCapability(capability: keyof ModelCapabilities): Promise<ModelInfo[]> {
    const allModels = await this.listModels();
    return allModels.filter(model => model.capabilities[capability]);
  }
}

// Factory function
export function createOpenRouterAdapter(config: OpenRouterConfig): OpenRouterAdapter {
  if (!config.apiKey) {
    throw new ProviderAuthError('OpenRouter API key is required');
  }
  
  return new OpenRouterAdapter(config);
}