import type { Connection } from '@/lib/types/connections'
import type { Message, Tool, ToolCall } from '@/lib/types'

// Protocol-specific configuration interfaces
interface OpenAIConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

interface MCPConfig {
  serverUrl: string
  transport: 'http' | 'stdio'
  command?: string
  args?: string[]
}

interface A2AConfig {
  agentUrl: string
  apiKey?: string
}

interface AnthropicConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

interface OllamaConfig {
  baseUrl: string
  model: string
}

// Base protocol adapter interface
export interface ProtocolAdapter {
  connection: Connection
  
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Message handling
  sendMessage(content: string): Promise<Message>
  sendMessageStream(content: string): AsyncGenerator<Message, void, unknown>
  
  // Tool management
  getAvailableTools(): Promise<Tool[]>
  executeTools(toolCalls: ToolCall[]): Promise<ToolCall[]>
  
  // Connection info
  getConnectionInfo(): string
}

// OpenAI Protocol Adapter
export class OpenAIAdapter implements ProtocolAdapter {
  private connected = false

  constructor(public connection: Connection) {
    if (connection.protocol !== 'openai') {
      throw new Error(`Invalid protocol for OpenAI adapter: ${connection.protocol}`)
    }
  }

  async connect(): Promise<void> {
    const config = this.connection.config as OpenAIConfig
    
    try {
      // Test connection by fetching models
      const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`OpenAI API connection failed: ${response.status} ${response.statusText}`)
      }

      this.connected = true
    } catch (error) {
      this.connected = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  async sendMessage(content: string): Promise<Message> {
    if (!this.isConnected()) {
      throw new Error('OpenAI adapter not connected')
    }

    const config = this.connection.config as OpenAIConfig
    
    const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [{ role: 'user', content }],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      id: `openai-${Date.now()}`,
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date()
    }
  }

  async *sendMessageStream(content: string): AsyncGenerator<Message, void, unknown> {
    if (!this.isConnected()) {
      throw new Error('OpenAI adapter not connected')
    }

    const config = this.connection.config as OpenAIConfig
    
    const response = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [{ role: 'user', content }],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    const messageId = `openai-${Date.now()}`

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              
              if (delta) {
                fullContent += delta
                yield {
                  id: messageId,
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                  isStreaming: true
                }
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async getAvailableTools(): Promise<Tool[]> {
    // OpenAI doesn't have discoverable tools in the same way as MCP
    return []
  }

  async executeTools(toolCalls: ToolCall[]): Promise<ToolCall[]> {
    // Tool execution would be handled by OpenAI's function calling
    return toolCalls
  }

  getConnectionInfo(): string {
    const config = this.connection.config as any
    return `${this.connection.name} (${config.model || 'GPT-4'})`
  }
}

// MCP Protocol Adapter
export class MCPAdapter implements ProtocolAdapter {
  private connected = false
  private sessionId?: string

  constructor(public connection: Connection) {
    if (connection.protocol !== 'mcp') {
      throw new Error(`Invalid protocol for MCP adapter: ${connection.protocol}`)
    }
  }

  async connect(): Promise<void> {
    const config = this.connection.config as any
    
    try {
      // Initialize MCP session
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'baigel-web-client',
              version: '1.0.0'
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`MCP connection failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`MCP initialization failed: ${data.error.message}`)
      }

      this.sessionId = `session-${Date.now()}`
      this.connected = true
    } catch (error) {
      this.connected = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.sessionId = undefined
  }

  isConnected(): boolean {
    return this.connected
  }

  private async mcpRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const config = this.connection.config as MCPConfig
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    })

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`)
    }

    return data.result
  }

  async sendMessage(content: string): Promise<Message> {
    if (!this.isConnected()) {
      throw new Error('MCP adapter not connected')
    }

    // For MCP, we need to analyze the message and potentially use tools
    // This is a simplified implementation - a real implementation would
    // use more sophisticated intent detection and tool selection
    
    try {
      // Check if this looks like a tool request
      if (content.toLowerCase().includes('read') && content.toLowerCase().includes('file')) {
        const tools = await this.getAvailableTools()
        const readTool = tools.find(t => t.name === 'read_file')
        
        if (readTool) {
          // Extract file path (simple regex - would need better parsing in real implementation)
          const pathMatch = content.match(/['"`]([^'"`]+)['"`]/) || content.match(/(\S+\.\w+)/)
          const path = pathMatch?.[1] || 'config.json'
          
          const result = await this.mcpRequest('tools/call', {
            name: 'read_file',
            arguments: { path }
          })
          
          return {
            id: `mcp-${Date.now()}`,
            role: 'assistant',
            content: `File content:\n\n${result.content?.[0]?.text || 'File read successfully'}`,
            timestamp: new Date()
          }
        }
      }
      
      // Default response for non-tool messages
      return {
        id: `mcp-${Date.now()}`,
        role: 'assistant',
        content: `MCP server received: "${content}". Available tools: ${(await this.getAvailableTools()).map(t => t.name).join(', ') || 'none'}`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        id: `mcp-${Date.now()}`,
        role: 'assistant',
        content: `MCP error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
    }
  }

  async *sendMessageStream(content: string): AsyncGenerator<Message, void, unknown> {
    // MCP doesn't typically support streaming, so we'll yield the full response
    const response = await this.sendMessage(content)
    yield response
  }

  async getAvailableTools(): Promise<Tool[]> {
    if (!this.isConnected()) {
      return []
    }

    try {
      const result = await this.mcpRequest('tools/list')
      
      return (result.tools || []).map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        parameters: tool.inputSchema || {}
      }))
    } catch {
      return []
    }
  }

  async executeTools(toolCalls: ToolCall[]): Promise<ToolCall[]> {
    const results = []
    
    for (const toolCall of toolCalls) {
      try {
        const result = await this.mcpRequest('tools/call', {
          name: toolCall.tool,
          arguments: toolCall.arguments
        })
        
        results.push({
          ...toolCall,
          status: 'success' as const,
          result: result.content?.[0]?.text || result
        })
      } catch (error) {
        results.push({
          ...toolCall,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return results
  }

  getConnectionInfo(): string {
    return `${this.connection.name} (MCP)`
  }
}

// A2A Protocol Adapter
export class A2AAdapter implements ProtocolAdapter {
  private connected = false

  constructor(public connection: Connection) {
    if (connection.protocol !== 'a2a') {
      throw new Error(`Invalid protocol for A2A adapter: ${connection.protocol}`)
    }
  }

  async connect(): Promise<void> {
    const config = this.connection.config as any
    
    try {
      // Register with agent network
      const response = await fetch(`${config.endpoint}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authentication?.apiKey && {
            'Authorization': `Bearer ${config.authentication.apiKey}`
          })
        },
        body: JSON.stringify({
          agentId: config.agentId,
          identityCard: config.identityCard || {
            name: this.connection.name,
            description: 'Baigel web client agent',
            capabilities: ['chat', 'execute']
          }
        })
      })

      if (!response.ok) {
        throw new Error(`A2A registration failed: ${response.status} ${response.statusText}`)
      }

      this.connected = true
    } catch (error) {
      this.connected = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    const config = this.connection.config as any
    
    try {
      await fetch(`${config.endpoint}/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authentication?.apiKey && {
            'Authorization': `Bearer ${config.authentication.apiKey}`
          })
        },
        body: JSON.stringify({
          agentId: config.agentId
        })
      })
    } catch {
      // Ignore errors during disconnect
    }
    
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  async sendMessage(content: string): Promise<Message> {
    if (!this.isConnected()) {
      throw new Error('A2A adapter not connected')
    }

    const config = this.connection.config as any
    
    const response = await fetch(`${config.endpoint}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.authentication?.apiKey && {
          'Authorization': `Bearer ${config.authentication.apiKey}`
        })
      },
      body: JSON.stringify({
        from: config.agentId,
        content,
        timestamp: new Date().toISOString(),
        type: 'chat'
      })
    })

    if (!response.ok) {
      throw new Error(`A2A message failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      id: `a2a-${Date.now()}`,
      role: 'assistant',
      content: data.response || `Agent ${data.agentId || 'unknown'} processed your request`,
      timestamp: new Date()
    }
  }

  async *sendMessageStream(content: string): AsyncGenerator<Message, void, unknown> {
    // A2A doesn't typically support streaming, yield full response
    const response = await this.sendMessage(content)
    yield response
  }

  async getAvailableTools(): Promise<Tool[]> {
    if (!this.isConnected()) {
      return []
    }

    const config = this.connection.config as any
    
    try {
      const response = await fetch(`${config.endpoint}/capabilities`, {
        headers: {
          ...(config.authentication?.apiKey && {
            'Authorization': `Bearer ${config.authentication.apiKey}`
          })
        }
      })

      if (response.ok) {
        const data = await response.json()
        return (data.tools || []).map((tool: any) => ({
          name: tool.name,
          description: tool.description || '',
          parameters: tool.parameters || {}
        }))
      }
    } catch {
      // Ignore errors, return empty
    }

    return []
  }

  async executeTools(toolCalls: ToolCall[]): Promise<ToolCall[]> {
    // Tool execution would be delegated to other agents
    return toolCalls.map(call => ({
      ...call,
      status: 'success' as const,
      result: 'Tool execution delegated to agent network'
    }))
  }

  getConnectionInfo(): string {
    const config = this.connection.config as any
    return `${this.connection.name} (Agent: ${config.agentId})`
  }
}

// Factory for creating protocol adapters
export class ProtocolAdapterFactory {
  static create(connection: Connection): ProtocolAdapter {
    switch (connection.protocol) {
      case 'openai':
        return new OpenAIAdapter(connection)
      case 'mcp':
        return new MCPAdapter(connection)
      case 'a2a':
        return new A2AAdapter(connection)
      default:
        throw new Error(`Unsupported protocol: ${connection.protocol}`)
    }
  }
}