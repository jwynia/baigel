import { describe, it, expect } from 'vitest'
import type { OpenAIConfig, MCPConfig, A2AConfig } from '@/lib/types/protocol-configs'

describe('Protocol Adapters Types Integration', () => {
  describe('OpenAI Configuration Usage', () => {
    it('should accept valid OpenAI config in protocol adapters context', () => {
      const config: OpenAIConfig = {
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }

      // Test that config can be type-checked correctly
      expect(config.apiKey).toBe('sk-test-key')
      expect(config.temperature).toBe(0.7)
      expect(config.maxTokens).toBe(1000)

      // Test that it can be cast to any (like in adapters)
      const adaptedConfig = config as any
      expect(adaptedConfig.temperature).toBe(0.7)
      expect(adaptedConfig.maxTokens).toBe(1000)
    })
  })

  describe('MCP Configuration Usage', () => {
    it('should accept HTTP MCP config', () => {
      const config: MCPConfig = {
        serverUrl: 'http://localhost:3000',
        transport: 'http',
        headers: {
          'Authorization': 'Bearer token'
        }
      }

      expect(config.transport).toBe('http')
      expect(config.headers?.Authorization).toBe('Bearer token')
    })

    it('should accept STDIO MCP config', () => {
      const config: MCPConfig = {
        serverUrl: 'localhost',
        transport: 'stdio',
        command: 'node',
        args: ['server.js', '--port', '3000']
      }

      expect(config.transport).toBe('stdio')
      expect(config.command).toBe('node')
      expect(config.args).toEqual(['server.js', '--port', '3000'])
    })
  })

  describe('A2A Configuration Usage', () => {
    it('should accept A2A config with all optional fields', () => {
      const config: A2AConfig = {
        agentUrl: 'https://agent.example.com',
        apiKey: 'agent-key',
        agentId: 'agent-123',
        endpoint: 'https://api.agent.com',
        authentication: {
          apiKey: 'auth-key',
          type: 'bearer'
        },
        identityCard: {
          name: 'Test Agent',
          description: 'A test agent',
          capabilities: ['chat', 'execute', 'analyze']
        }
      }

      expect(config.agentUrl).toBe('https://agent.example.com')
      expect(config.authentication?.type).toBe('bearer')
      expect(config.identityCard?.capabilities).toContain('chat')
    })
  })

  describe('Type Compatibility', () => {
    it('should work with union types as used in Connection interfaces', () => {
      type AdapterConfig = OpenAIConfig | MCPConfig | A2AConfig

      const configs: AdapterConfig[] = [
        {
          apiKey: 'sk-123',
          model: 'gpt-4',
          temperature: 0.8
        } satisfies OpenAIConfig,
        {
          serverUrl: 'http://localhost:3000',
          transport: 'http'
        } satisfies MCPConfig,
        {
          agentUrl: 'https://agent.example.com',
          apiKey: 'agent-key'
        } satisfies A2AConfig
      ]

      expect(configs).toHaveLength(3)

      // Test type narrowing as would happen in adapters
      configs.forEach(config => {
        if ('apiKey' in config && 'model' in config) {
          // OpenAI config
          expect(config.apiKey).toContain('sk-')
        } else if ('transport' in config) {
          // MCP config
          expect(['http', 'stdio']).toContain(config.transport)
        } else if ('agentUrl' in config) {
          // A2A config
          expect(config.agentUrl).toMatch(/^https?:\/\//)
        }
      })
    })

    it('should support the casting pattern used in adapters', () => {
      const mockConnection = {
        protocol: 'openai' as const,
        config: {
          apiKey: 'sk-test',
          model: 'gpt-4',
          temperature: 0.7
        } satisfies OpenAIConfig
      }

      // This mimics how adapters cast the config
      const config = mockConnection.config as OpenAIConfig
      expect(config.apiKey).toBe('sk-test')
      expect(config.model).toBe('gpt-4')
      expect(config.temperature).toBe(0.7)

      // Test the any casting pattern for backwards compatibility
      const anyConfig = mockConnection.config as any
      expect(anyConfig.temperature).toBe(0.7)
      expect(anyConfig.maxTokens).toBeUndefined()
    })
  })
})