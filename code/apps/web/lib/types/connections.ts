// Connection configuration types for all protocols

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'testing'

// Base connection interface
export interface BaseConnection {
  id: string
  name: string
  protocol: ProtocolType
  status: ConnectionStatus
  createdAt: Date
  lastConnected?: Date
  error?: string
  isDefault?: boolean
  tags?: string[]
  // Store discovered capabilities/tools
  tools?: Array<{
    id: string
    name: string
    description?: string
    inputSchema?: any
    outputSchema?: any
  }>
  capabilities?: string[]
  // Store discovery metadata (execution endpoints, etc.)
  metadata?: Record<string, any>
}

// Protocol-specific connection configurations

export interface MCPConnection extends BaseConnection {
  protocol: 'mcp'
  config: {
    transport: 'stdio' | 'http' | 'sse'
    // STDIO transport
    command?: string
    args?: string[]
    env?: Record<string, string>
    // HTTP/SSE transport
    url?: string
    headers?: Record<string, string>
    apiKey?: string
  }
  mcpCapabilities?: {
    tools?: boolean
    resources?: boolean
    prompts?: boolean
  }
}

export interface A2AConnection extends BaseConnection {
  protocol: 'a2a'
  config: {
    agentId: string
    endpoint: string
    identityCard?: {
      name: string
      description: string
      capabilities: string[]
      trustScore?: number
    }
    authentication?: {
      type: 'none' | 'api-key' | 'oauth'
      apiKey?: string
      clientId?: string
      clientSecret?: string
    }
  }
}

export interface AGUIConnection extends BaseConnection {
  protocol: 'ag-ui'
  config: {
    transport: 'websocket' | 'sse' | 'http'
    endpoint: string
    apiKey?: string
    streaming?: boolean
    reconnect?: boolean
    reconnectInterval?: number
  }
  features?: {
    streaming?: boolean
    tools?: boolean
    multiModal?: boolean
  }
}

export interface OpenAIConnection extends BaseConnection {
  protocol: 'openai'
  config: {
    apiKey: string
    organizationId?: string
    baseUrl?: string
    model?: string
    maxTokens?: number
    temperature?: number
  }
}

export interface LangChainConnection extends BaseConnection {
  protocol: 'langchain'
  config: {
    endpoint: string
    apiKey?: string
    chainType?: 'conversation' | 'qa' | 'agent'
    memory?: boolean
    tools?: string[]
  }
}

// Model Provider connection types
export type ModelProviderType = 
  | 'openai-provider'
  | 'openai-compatible' 
  | 'openrouter'
  | 'ollama'
  | 'lmstudio'
  | 'anthropic'
  | 'google'
  | 'azure-openai';

export interface ModelProviderConnection extends BaseConnection {
  protocol: ModelProviderType
  config: {
    baseUrl?: string
    apiKey?: string
    timeout?: number
    retries?: number
    headers?: Record<string, string>
    defaultModel?: string
    // Generation defaults
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    // Provider-specific config
    organizationId?: string // OpenAI
    project?: string // OpenAI
    siteUrl?: string // OpenRouter
    siteName?: string // OpenRouter
    host?: string // Ollama
    keepAlive?: string // Ollama
    numCtx?: number // Ollama
    resourceName?: string // Azure
    deploymentName?: string // Azure
    apiVersion?: string // Azure
    projectId?: string // Google
    location?: string // Google
  }
  models?: Array<{
    id: string
    name: string
    description?: string
    contextLength?: number
    capabilities: {
      streaming: boolean
      functionCalling: boolean
      vision: boolean
      embeddings: boolean
    }
  }>
  isHealthy?: boolean
  lastHealthCheck?: Date
}

export type Connection = 
  | MCPConnection 
  | A2AConnection 
  | AGUIConnection 
  | OpenAIConnection 
  | LangChainConnection
  | ModelProviderConnection

export type ProtocolType = Connection['protocol']

// Connection test result
export interface ConnectionTestResult {
  success: boolean
  latency?: number
  error?: string
  capabilities?: Record<string, boolean>
  info?: {
    version?: string
    name?: string
    description?: string
  }
}

// Connection form data
export interface ConnectionFormData {
  name: string
  protocol: ProtocolType
  tags?: string[]
  isDefault?: boolean
  config: Record<string, any>
}

// Protocol metadata for UI
export interface ProtocolMetadata {
  id: ProtocolType
  name: string
  description: string
  icon?: string
  documentationUrl?: string
  configFields: ConfigField[]
  testable: boolean
  supportsMultiple: boolean
}

export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'number' | 'select' | 'checkbox' | 'json'
  required?: boolean
  placeholder?: string
  description?: string
  defaultValue?: any
  options?: { label: string; value: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

// Connection management actions
export interface ConnectionManager {
  connections: Connection[]
  activeConnection?: Connection
  
  // CRUD operations
  addConnection: (connection: Omit<Connection, 'id' | 'createdAt' | 'status'>) => Promise<Connection>
  updateConnection: (id: string, updates: Partial<Connection>) => Promise<Connection>
  deleteConnection: (id: string) => Promise<void>
  
  // Connection operations
  connect: (id: string) => Promise<void>
  disconnect: (id: string) => Promise<void>
  testConnection: (id: string) => Promise<ConnectionTestResult>
  
  // Persistence
  saveConnections: () => Promise<void>
  loadConnections: () => Promise<void>
  exportConnections: () => string
  importConnections: (data: string) => Promise<void>
}