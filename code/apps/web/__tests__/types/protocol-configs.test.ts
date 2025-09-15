import { describe, it, expect, beforeEach } from 'vitest'
import {
  OpenAIConfig,
  MCPConfig,
  A2AConfig,
  AnthropicConfig,
  OllamaConfig,
  validateOpenAIConfig,
  validateMCPConfig,
  validateA2AConfig,
  validateAnthropicConfig,
  validateOllamaConfig
} from '@/lib/types/protocol-configs'

describe('Protocol Configuration Types', () => {
  describe('OpenAIConfig', () => {
    it('should accept valid OpenAI configuration', () => {
      const config: OpenAIConfig = {
        apiKey: 'sk-1234567890abcdef',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4'
      }

      expect(config.apiKey).toBe('sk-1234567890abcdef')
      expect(config.baseUrl).toBe('https://api.openai.com/v1')
      expect(config.model).toBe('gpt-4')
    })

    it('should accept minimal OpenAI configuration', () => {
      const config: OpenAIConfig = {
        apiKey: 'sk-1234567890abcdef'
      }

      expect(config.apiKey).toBe('sk-1234567890abcdef')
      expect(config.baseUrl).toBeUndefined()
      expect(config.model).toBeUndefined()
    })

    it('should validate OpenAI configuration correctly', () => {
      expect(() => validateOpenAIConfig({
        apiKey: 'sk-1234567890abcdef',
        model: 'gpt-4'
      })).not.toThrow()

      expect(() => validateOpenAIConfig({
        apiKey: '',
        model: 'gpt-4'
      })).toThrow('API key is required')

      expect(() => validateOpenAIConfig({
        model: 'gpt-4'
      } as any)).toThrow('API key is required')
    })
  })

  describe('MCPConfig', () => {
    it('should accept valid MCP HTTP configuration', () => {
      const config: MCPConfig = {
        serverUrl: 'http://localhost:3000',
        transport: 'http'
      }

      expect(config.serverUrl).toBe('http://localhost:3000')
      expect(config.transport).toBe('http')
    })

    it('should accept valid MCP STDIO configuration', () => {
      const config: MCPConfig = {
        serverUrl: 'localhost',
        transport: 'stdio',
        command: 'node',
        args: ['server.js']
      }

      expect(config.transport).toBe('stdio')
      expect(config.command).toBe('node')
      expect(config.args).toEqual(['server.js'])
    })

    it('should validate MCP configuration correctly', () => {
      expect(() => validateMCPConfig({
        serverUrl: 'http://localhost:3000',
        transport: 'http'
      })).not.toThrow()

      expect(() => validateMCPConfig({
        serverUrl: '',
        transport: 'http'
      })).toThrow('Server URL is required')

      expect(() => validateMCPConfig({
        serverUrl: 'localhost',
        transport: 'stdio'
        // Missing command for stdio
      })).toThrow('Command is required for stdio transport')
    })
  })

  describe('A2AConfig', () => {
    it('should accept valid A2A configuration', () => {
      const config: A2AConfig = {
        agentUrl: 'https://agent.example.com',
        apiKey: 'agent-key-123'
      }

      expect(config.agentUrl).toBe('https://agent.example.com')
      expect(config.apiKey).toBe('agent-key-123')
    })

    it('should accept A2A configuration without API key', () => {
      const config: A2AConfig = {
        agentUrl: 'https://agent.example.com'
      }

      expect(config.agentUrl).toBe('https://agent.example.com')
      expect(config.apiKey).toBeUndefined()
    })

    it('should validate A2A configuration correctly', () => {
      expect(() => validateA2AConfig({
        agentUrl: 'https://agent.example.com'
      })).not.toThrow()

      expect(() => validateA2AConfig({
        agentUrl: ''
      })).toThrow('Agent URL is required')

      expect(() => validateA2AConfig({
        agentUrl: 'invalid-url'
      })).toThrow('Agent URL must be a valid URL')
    })
  })

  describe('AnthropicConfig', () => {
    it('should accept valid Anthropic configuration', () => {
      const config: AnthropicConfig = {
        apiKey: 'sk-ant-1234567890',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-opus-20240229'
      }

      expect(config.apiKey).toBe('sk-ant-1234567890')
      expect(config.baseUrl).toBe('https://api.anthropic.com')
      expect(config.model).toBe('claude-3-opus-20240229')
    })

    it('should validate Anthropic configuration correctly', () => {
      expect(() => validateAnthropicConfig({
        apiKey: 'sk-ant-1234567890'
      })).not.toThrow()

      expect(() => validateAnthropicConfig({
        apiKey: ''
      })).toThrow('API key is required')
    })
  })

  describe('OllamaConfig', () => {
    it('should accept valid Ollama configuration', () => {
      const config: OllamaConfig = {
        baseUrl: 'http://localhost:11434',
        model: 'llama2'
      }

      expect(config.baseUrl).toBe('http://localhost:11434')
      expect(config.model).toBe('llama2')
    })

    it('should validate Ollama configuration correctly', () => {
      expect(() => validateOllamaConfig({
        baseUrl: 'http://localhost:11434',
        model: 'llama2'
      })).not.toThrow()

      expect(() => validateOllamaConfig({
        baseUrl: '',
        model: 'llama2'
      })).toThrow('Base URL is required')

      expect(() => validateOllamaConfig({
        baseUrl: 'http://localhost:11434',
        model: ''
      })).toThrow('Model is required')
    })
  })
})

describe('Protocol Configuration Integration', () => {
  it('should allow protocol configs to be used interchangeably via union types', () => {
    type ProtocolConfig = OpenAIConfig | MCPConfig | A2AConfig | AnthropicConfig | OllamaConfig

    const configs: ProtocolConfig[] = [
      { apiKey: 'sk-123', model: 'gpt-4' } as OpenAIConfig,
      { serverUrl: 'http://localhost:3000', transport: 'http' } as MCPConfig,
      { agentUrl: 'https://agent.example.com' } as A2AConfig,
      { apiKey: 'sk-ant-123' } as AnthropicConfig,
      { baseUrl: 'http://localhost:11434', model: 'llama2' } as OllamaConfig
    ]

    expect(configs).toHaveLength(5)
    expect(configs[0]).toHaveProperty('apiKey')
    expect(configs[1]).toHaveProperty('transport')
    expect(configs[2]).toHaveProperty('agentUrl')
    expect(configs[3]).toHaveProperty('apiKey')
    expect(configs[4]).toHaveProperty('model')
  })
})