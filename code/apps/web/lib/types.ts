// Core message types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
  status?: 'sending' | 'sent' | 'error'
  type?: 'text' | 'tool'
  tool?: string
  arguments?: Record<string, unknown>
  result?: unknown
}

// Protocol types
export type ProtocolType = 'mcp' | 'a2a' | 'ag-ui' | 'openai' | 'langchain'

export interface ProtocolInfo {
  id: ProtocolType
  name: string
  description: string
  type: 'local' | 'remote'
  status: 'connected' | 'disconnected' | 'error'
  capabilities: string[]
}

// Connection types
export interface ConnectionConfig {
  protocol: ProtocolType
  endpoint?: string
  apiKey?: string
  headers?: Record<string, string>
  options?: Record<string, unknown>
}

// Tool execution types
export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ToolCall {
  id: string
  tool: string
  arguments: Record<string, unknown>
  status: 'running' | 'success' | 'error'
  result?: unknown
  error?: string
}

// Chat state types
export interface ChatState {
  messages: Message[]
  activeProtocol: ProtocolType
  isConnected: boolean
  isStreaming: boolean
  connectionConfig?: ConnectionConfig
  availableTools: Tool[]
  activeToolCalls: ToolCall[]
}

// Form types
export interface MessageFormData {
  content: string
  attachments?: File[]
}

export interface ConnectionFormData {
  protocol: ProtocolType
  endpoint: string
  apiKey?: string
}