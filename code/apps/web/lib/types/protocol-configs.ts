/**
 * Protocol Configuration Types
 *
 * This file contains all protocol-specific configuration interfaces
 * extracted from the main protocol adapter implementations for
 * improved reusability and maintainability.
 */

/**
 * Configuration for OpenAI API protocol adapter
 */
export interface OpenAIConfig {
  /** OpenAI API key for authentication */
  apiKey: string
  /** Optional base URL override (default: https://api.openai.com/v1) */
  baseUrl?: string
  /** Model to use for completions (default: gpt-4) */
  model?: string
  /** Temperature for response generation (0-2, default: 0.7) */
  temperature?: number
  /** Maximum tokens in response (default: 1000) */
  maxTokens?: number
}

/**
 * Configuration for MCP (Model Context Protocol) adapter
 */
export interface MCPConfig {
  /** MCP server URL or connection string */
  serverUrl: string
  /** Transport method for MCP communication */
  transport: 'http' | 'stdio'
  /** Command to execute for stdio transport */
  command?: string
  /** Arguments for stdio command */
  args?: string[]
  /** Additional headers for HTTP transport */
  headers?: Record<string, string>
  /** Server connection URL (for HTTP transport) */
  url?: string
}

/**
 * Configuration for Agent-to-Agent (A2A) protocol adapter
 */
export interface A2AConfig {
  /** URL of the target agent */
  agentUrl: string
  /** Optional API key for authentication */
  apiKey?: string
  /** Agent identifier */
  agentId?: string
  /** Agent endpoint URL */
  endpoint?: string
  /** Authentication configuration */
  authentication?: {
    apiKey?: string
    type?: 'bearer' | 'api-key'
  }
  /** Agent identity card for registration */
  identityCard?: {
    name: string
    description: string
    capabilities: string[]
  }
}

/**
 * Configuration for Anthropic Claude API protocol adapter
 */
export interface AnthropicConfig {
  /** Anthropic API key for authentication */
  apiKey: string
  /** Optional base URL override (default: https://api.anthropic.com) */
  baseUrl?: string
  /** Model to use for completions (default: claude-3-opus-20240229) */
  model?: string
  /** Maximum tokens in response */
  maxTokens?: number
  /** Temperature for response generation */
  temperature?: number
}

/**
 * Configuration for Ollama local model protocol adapter
 */
export interface OllamaConfig {
  /** Ollama server base URL */
  baseUrl: string
  /** Model name to use */
  model: string
  /** Optional generation parameters */
  parameters?: {
    temperature?: number
    top_p?: number
    top_k?: number
    num_predict?: number
  }
}

/**
 * Union type for all protocol configurations
 */
export type ProtocolConfig = OpenAIConfig | MCPConfig | A2AConfig | AnthropicConfig | OllamaConfig

// Validation functions

/**
 * Validates OpenAI configuration
 */
export function validateOpenAIConfig(config: Partial<OpenAIConfig>): asserts config is OpenAIConfig {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('API key is required for OpenAI configuration')
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    throw new Error('Temperature must be between 0 and 2')
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    throw new Error('Max tokens must be greater than 0')
  }
}

/**
 * Validates MCP configuration
 */
export function validateMCPConfig(config: Partial<MCPConfig>): asserts config is MCPConfig {
  if (!config.serverUrl || config.serverUrl.trim().length === 0) {
    throw new Error('Server URL is required for MCP configuration')
  }

  if (!config.transport) {
    throw new Error('Transport type is required for MCP configuration')
  }

  if (config.transport === 'stdio' && !config.command) {
    throw new Error('Command is required for stdio transport')
  }
}

/**
 * Validates A2A configuration
 */
export function validateA2AConfig(config: Partial<A2AConfig>): asserts config is A2AConfig {
  if (!config.agentUrl || config.agentUrl.trim().length === 0) {
    throw new Error('Agent URL is required for A2A configuration')
  }

  try {
    new URL(config.agentUrl)
  } catch {
    throw new Error('Agent URL must be a valid URL')
  }
}

/**
 * Validates Anthropic configuration
 */
export function validateAnthropicConfig(config: Partial<AnthropicConfig>): asserts config is AnthropicConfig {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('API key is required for Anthropic configuration')
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
    throw new Error('Temperature must be between 0 and 1')
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    throw new Error('Max tokens must be greater than 0')
  }
}

/**
 * Validates Ollama configuration
 */
export function validateOllamaConfig(config: Partial<OllamaConfig>): asserts config is OllamaConfig {
  if (!config.baseUrl || config.baseUrl.trim().length === 0) {
    throw new Error('Base URL is required for Ollama configuration')
  }

  if (!config.model || config.model.trim().length === 0) {
    throw new Error('Model is required for Ollama configuration')
  }

  try {
    new URL(config.baseUrl)
  } catch {
    throw new Error('Base URL must be a valid URL')
  }
}

/**
 * Type guard to check if config is OpenAI config
 */
export function isOpenAIConfig(config: ProtocolConfig): config is OpenAIConfig {
  return 'apiKey' in config && !('agentUrl' in config) && !('serverUrl' in config)
}

/**
 * Type guard to check if config is MCP config
 */
export function isMCPConfig(config: ProtocolConfig): config is MCPConfig {
  return 'serverUrl' in config && 'transport' in config
}

/**
 * Type guard to check if config is A2A config
 */
export function isA2AConfig(config: ProtocolConfig): config is A2AConfig {
  return 'agentUrl' in config
}

/**
 * Type guard to check if config is Anthropic config
 */
export function isAnthropicConfig(config: ProtocolConfig): config is AnthropicConfig {
  return 'apiKey' in config && !('agentUrl' in config) && !('serverUrl' in config) && !('baseUrl' in config)
}

/**
 * Type guard to check if config is Ollama config
 */
export function isOllamaConfig(config: ProtocolConfig): config is OllamaConfig {
  return 'baseUrl' in config && 'model' in config && !('apiKey' in config)
}