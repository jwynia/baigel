import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  ProtocolAdapter, 
  OpenAIAdapter, 
  MCPAdapter, 
  A2AAdapter,
  ProtocolAdapterFactory 
} from '@/lib/protocol-adapters'
import type { Connection } from '@/lib/types/connections'
import type { Message } from '@/lib/types'

// Mock fetch for testing
global.fetch = vi.fn()

describe('ProtocolAdapterFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create OpenAI adapter for openai protocol', () => {
    const connection: Connection = {
      id: 'test-openai',
      name: 'Test OpenAI',
      protocol: 'openai',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        apiKey: 'test-key',
        model: 'gpt-4'
      }
    } as any

    const adapter = ProtocolAdapterFactory.create(connection)
    expect(adapter).toBeInstanceOf(OpenAIAdapter)
  })

  it('should create MCP adapter for mcp protocol', () => {
    const connection: Connection = {
      id: 'test-mcp',
      name: 'Test MCP',
      protocol: 'mcp',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        transport: 'http',
        url: 'http://localhost:3001'
      }
    } as any

    const adapter = ProtocolAdapterFactory.create(connection)
    expect(adapter).toBeInstanceOf(MCPAdapter)
  })

  it('should create A2A adapter for a2a protocol', () => {
    const connection: Connection = {
      id: 'test-a2a',
      name: 'Test A2A',
      protocol: 'a2a',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        agentId: 'test-agent',
        endpoint: 'http://localhost:8080'
      }
    } as any

    const adapter = ProtocolAdapterFactory.create(connection)
    expect(adapter).toBeInstanceOf(A2AAdapter)
  })

  it('should throw error for unsupported protocol', () => {
    const connection = {
      id: 'test-unknown',
      protocol: 'unknown'
    } as any

    expect(() => ProtocolAdapterFactory.create(connection)).toThrow('Unsupported protocol: unknown')
  })
})

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter
  let connection: Connection

  beforeEach(() => {
    connection = {
      id: 'test-openai',
      name: 'Test OpenAI',
      protocol: 'openai',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        apiKey: 'test-api-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    } as any

    adapter = new OpenAIAdapter(connection)
    vi.clearAllMocks()
  })

  describe('connect', () => {
    it('should successfully connect with valid API key', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'gpt-4', object: 'model' }]
        })
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      await adapter.connect()

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
    })

    it('should throw error with invalid API key', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      await expect(adapter.connect()).rejects.toThrow('OpenAI API connection failed: 401 Unauthorized')
    })
  })

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      // Mock connect first
      const connectResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [] })
      }
      
      const messageResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you today?'
            }
          }]
        })
      }
      
      vi.mocked(fetch)
        .mockResolvedValueOnce(connectResponse as any)
        .mockResolvedValueOnce(messageResponse as any)

      await adapter.connect()
      const response = await adapter.sendMessage('Hello')

      expect(response.content).toBe('Hello! How can I help you today?')
      expect(response.role).toBe('assistant')
    })

    it('should handle streaming responses', async () => {
      // Mock connect first
      const connectResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [] })
      }
      
      const mockStream = new ReadableStream({
        start(controller) {
          const chunks = [
            'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
            'data: [DONE]\n\n'
          ]
          
          chunks.forEach((chunk, i) => {
            setTimeout(() => {
              controller.enqueue(new TextEncoder().encode(chunk))
              if (i === chunks.length - 1) {
                controller.close()
              }
            }, i * 10)
          })
        }
      })

      const streamResponse = {
        ok: true,
        body: mockStream
      }
      
      vi.mocked(fetch)
        .mockResolvedValueOnce(connectResponse as any)
        .mockResolvedValueOnce(streamResponse as any)

      await adapter.connect()
      
      const responses: string[] = []
      for await (const chunk of adapter.sendMessageStream('Hello')) {
        responses.push(chunk.content)
      }

      expect(responses).toContain('Hello')
      expect(responses).toContain('Hello world')
    })
  })

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await adapter.disconnect()
      // OpenAI doesn't require explicit disconnect, should resolve without error
    })
  })

  describe('getAvailableTools', () => {
    it('should return empty array for basic OpenAI connection', async () => {
      const tools = await adapter.getAvailableTools()
      expect(tools).toEqual([])
    })
  })
})

describe('MCPAdapter', () => {
  let adapter: MCPAdapter
  let connection: Connection

  beforeEach(() => {
    connection = {
      id: 'test-mcp',
      name: 'Test MCP',
      protocol: 'mcp',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        transport: 'http',
        url: 'http://localhost:3001',
        headers: { 'Content-Type': 'application/json' }
      }
    } as any

    adapter = new MCPAdapter(connection)
    vi.clearAllMocks()
  })

  describe('connect', () => {
    it('should initialize MCP session', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: 'test-server',
              version: '1.0.0'
            }
          }
        })
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      await adapter.connect()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('initialize')
        })
      )
    })
  })

  describe('sendMessage', () => {
    it('should use tools to fulfill user requests', async () => {
      // Mock connect first
      const connectResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {}
          }
        })
      }

      // Mock tools/list response
      const toolsResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          result: {
            tools: [{
              name: 'read_file',
              description: 'Read a file',
              inputSchema: {
                type: 'object',
                properties: {
                  path: { type: 'string' }
                }
              }
            }]
          }
        })
      }

      // Mock tool execution response
      const executeResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: 'File content here'
              }
            ]
          }
        })
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce(connectResponse as any)
        .mockResolvedValueOnce(toolsResponse as any)
        .mockResolvedValueOnce(executeResponse as any)

      await adapter.connect()
      const response = await adapter.sendMessage('Read the config.json file')

      expect(response.content).toContain('File content here')
    })
  })
})

describe('A2AAdapter', () => {
  let adapter: A2AAdapter
  let connection: Connection

  beforeEach(() => {
    connection = {
      id: 'test-a2a',
      name: 'Test A2A',
      protocol: 'a2a',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        agentId: 'test-agent-123',
        endpoint: 'http://localhost:8080/agent',
        authentication: {
          type: 'api-key',
          apiKey: 'test-key'
        }
      }
    } as any

    adapter = new A2AAdapter(connection)
    vi.clearAllMocks()
  })

  describe('connect', () => {
    it('should register with agent network', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          agentId: 'test-agent-123',
          status: 'registered',
          capabilities: ['chat', 'execute']
        })
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      await adapter.connect()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/agent/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      )
    })
  })

  describe('sendMessage', () => {
    it('should send message via A2A protocol', async () => {
      // Mock connect first
      const connectResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          agentId: 'test-agent-123',
          status: 'registered'
        })
      }
      
      const messageResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'msg-123',
          response: 'Task completed successfully',
          agentId: 'test-agent-123',
          timestamp: new Date().toISOString()
        })
      }
      
      vi.mocked(fetch)
        .mockResolvedValueOnce(connectResponse as any)
        .mockResolvedValueOnce(messageResponse as any)

      await adapter.connect()
      const response = await adapter.sendMessage('Execute workflow X')

      expect(response.content).toBe('Task completed successfully')
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/agent/message',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Execute workflow X')
        })
      )
    })
  })
})