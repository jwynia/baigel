/**
 * Model Provider Types and Interfaces
 * Defines types for connecting to various LLM providers (OpenAI, OpenRouter, Ollama, etc.)
 */

import type { BaseConnection, ConnectionStatus, ModelProviderType, ModelProviderConnection } from './connections';

// Model capabilities
export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embeddings: boolean;
  tools: boolean;
  maxTokens?: number;
  inputTypes?: ('text' | 'image' | 'audio')[];
  outputTypes?: ('text' | 'image' | 'audio')[];
}

// Model information
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  contextLength?: number;
  capabilities: ModelCapabilities;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
  metadata?: Record<string, any>;
}

// Base provider configuration
export interface BaseProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  models?: ModelInfo[];
  defaultModel?: string;
  // Generation defaults
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Provider-specific configurations
export interface OpenAIConfig extends BaseProviderConfig {
  organizationId?: string;
  project?: string;
}

export interface OpenAICompatibleConfig extends BaseProviderConfig {
  // Generic OpenAI-compatible endpoint
  providerName?: string;
  compatibilityMode?: 'strict' | 'flexible';
}

export interface OpenRouterConfig extends BaseProviderConfig {
  siteUrl?: string;
  siteName?: string;
  preferredProviders?: string[];
}

export interface OllamaConfig extends BaseProviderConfig {
  // Ollama-specific settings
  host?: string; // defaults to localhost:11434
  keepAlive?: string; // model keep-alive duration
  numCtx?: number; // context window size
  numGpu?: number; // GPU layers
  numThread?: number; // CPU threads
}

export interface LMStudioConfig extends BaseProviderConfig {
  // LMStudio in OpenAI-compatible mode
  serverUrl?: string; // defaults to localhost:1234
}

export interface AnthropicConfig extends BaseProviderConfig {
  version?: string; // API version
}

export interface GoogleConfig extends BaseProviderConfig {
  projectId?: string;
  location?: string;
  model?: string;
}

export interface AzureOpenAIConfig extends BaseProviderConfig {
  resourceName: string;
  deploymentName: string;
  apiVersion?: string;
}

// Union type for all provider configs
export type ProviderConfig = 
  | OpenAIConfig
  | OpenAICompatibleConfig  
  | OpenRouterConfig
  | OllamaConfig
  | LMStudioConfig
  | AnthropicConfig
  | GoogleConfig
  | AzureOpenAIConfig;

// Chat message types
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string; // For function/tool messages
  tool_call_id?: string; // For tool responses
  tool_calls?: ToolCall[]; // For assistant messages with tool calls
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: any; // JSON Schema
}

export interface Tool {
  type: 'function';
  function: FunctionDefinition;
}

// Chat completion request
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  tools?: Tool[];
  toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } };
  user?: string;
  stop?: string | string[];
  seed?: number;
  responseFormat?: {
    type: 'text' | 'json_object' | 'json_schema';
    json_schema?: {
      name: string;
      schema: any;
      strict?: boolean;
    };
  };
}

// Chat completion response
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    message?: ChatMessage;
    delta?: Partial<ChatMessage>;
    finishReason?: string;
    logprobs?: any;
  }[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  systemFingerprint?: string;
}

// Provider test result
export interface ProviderTestResult {
  success: boolean;
  latency?: number;
  error?: string;
  modelCount?: number;
  capabilities?: ModelCapabilities;
  models?: ModelInfo[];
  version?: string;
  provider?: string;
}

// Mini-agent configuration
export interface MiniAgent {
  id: string;
  name: string;
  description?: string;
  providerId: string; // References ModelProviderConnection.id
  modelId: string;
  systemPrompt: string;
  config: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    tools?: string[]; // Tool IDs to make available
    mcpConnections?: string[]; // MCP connection IDs for tool access
    responseFormat?: ChatCompletionRequest['responseFormat'];
    stopSequences?: string[];
  };
  tags?: string[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  usage?: {
    conversationCount: number;
    totalTokens: number;
    lastUsed: Date;
  };
}

// Conversation management
export interface Conversation {
  id: string;
  agentId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens: number;
    modelUsed: string;
    providerId: string;
  };
}

// Provider adapter interface
export interface IProviderAdapter {
  readonly type: ModelProviderType;
  readonly name: string;
  
  // Connection management
  connect(config: ProviderConfig): Promise<void>;
  disconnect(): Promise<void>;
  test(): Promise<ProviderTestResult>;
  
  // Model operations
  listModels(): Promise<ModelInfo[]>;
  getModel(modelId: string): Promise<ModelInfo | null>;
  
  // Chat operations
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  streamChatCompletion(request: ChatCompletionRequest): AsyncIterable<ChatCompletionResponse>;
  
  // Health checks
  isHealthy(): Promise<boolean>;
  getStatus(): Promise<{ status: ConnectionStatus; message?: string }>;
}

// Provider factory
export interface ProviderAdapterFactory {
  create(type: ModelProviderType, config: ProviderConfig): IProviderAdapter;
  getSupportedTypes(): ModelProviderType[];
}

// Provider registry
export interface ProviderRegistry {
  register(adapter: IProviderAdapter): void;
  unregister(type: ModelProviderType): void;
  get(type: ModelProviderType): IProviderAdapter | null;
  list(): IProviderAdapter[];
}

// Provider manager - main interface for managing all providers
export interface ProviderManager {
  // Connection management
  addProvider(connection: Omit<ModelProviderConnection, 'id' | 'createdAt' | 'status'>): Promise<ModelProviderConnection>;
  updateProvider(id: string, updates: Partial<ModelProviderConnection>): Promise<ModelProviderConnection>;
  deleteProvider(id: string): Promise<void>;
  getProvider(id: string): Promise<ModelProviderConnection | null>;
  listProviders(): Promise<ModelProviderConnection[]>;
  
  // Provider operations
  testProvider(id: string): Promise<ProviderTestResult>;
  refreshModels(id: string): Promise<ModelInfo[]>;
  
  // Mini-agent management
  addAgent(agent: Omit<MiniAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MiniAgent>;
  updateAgent(id: string, updates: Partial<MiniAgent>): Promise<MiniAgent>;
  deleteAgent(id: string): Promise<void>;
  getAgent(id: string): Promise<MiniAgent | null>;
  listAgents(): Promise<MiniAgent[]>;
  
  // Chat operations
  chatWithAgent(agentId: string, message: string, conversationId?: string): Promise<{ 
    response: string; 
    conversationId: string;
    usage: { tokens: number; cost?: number };
  }>;
  
  // Persistence
  save(): Promise<void>;
  load(): Promise<void>;
  export(): string;
  import(data: string): Promise<void>;
}