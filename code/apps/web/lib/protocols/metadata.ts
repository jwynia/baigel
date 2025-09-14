import type { ProtocolMetadata, ConfigField } from '@/lib/types/connections'

// Configuration field definitions for each protocol
const mcpConfigFields: ConfigField[] = [
  {
    name: 'transport',
    label: 'Transport Type',
    type: 'select',
    required: true,
    description: 'How to connect to the MCP server',
    options: [
      { label: 'Standard I/O (Local Process)', value: 'stdio' },
      { label: 'HTTP', value: 'http' },
      { label: 'Server-Sent Events (SSE)', value: 'sse' }
    ],
    defaultValue: 'stdio'
  },
  // STDIO fields
  {
    name: 'command',
    label: 'Command',
    type: 'text',
    required: true,
    placeholder: 'mcp-server',
    description: 'Command to execute the MCP server (for STDIO transport)'
  },
  {
    name: 'args',
    label: 'Arguments',
    type: 'json',
    placeholder: '["--port", "3001"]',
    description: 'Command line arguments as JSON array (for STDIO transport)'
  },
  {
    name: 'env',
    label: 'Environment Variables',
    type: 'json',
    placeholder: '{"DEBUG": "true"}',
    description: 'Environment variables as JSON object (for STDIO transport)'
  },
  // HTTP/SSE fields
  {
    name: 'url',
    label: 'Server URL',
    type: 'text',
    required: true,
    placeholder: 'https://your-server.com:3001',
    description: 'Server endpoint (for HTTP/SSE transport)',
    validation: {
      pattern: '^https?://.+',
      message: 'Must be a valid HTTP/HTTPS URL'
    }
  },
  {
    name: 'apiKey',
    label: 'API Key',
    type: 'password',
    placeholder: 'Optional API key',
    description: 'Authentication key if required'
  },
  {
    name: 'headers',
    label: 'Custom Headers',
    type: 'json',
    placeholder: '{"X-Custom-Header": "value"}',
    description: 'Additional HTTP headers as JSON object'
  }
]

const a2aConfigFields: ConfigField[] = [
  {
    name: 'agentId',
    label: 'Agent ID',
    type: 'text',
    required: true,
    placeholder: 'agent-123',
    description: 'Unique identifier for the agent'
  },
  {
    name: 'endpoint',
    label: 'Agent Endpoint',
    type: 'text',
    required: true,
    placeholder: 'https://api.agent.com/v1',
    description: 'Agent API endpoint',
    validation: {
      pattern: '^https?://.+',
      message: 'Must be a valid HTTP/HTTPS URL'
    }
  },
  {
    name: 'authentication.type',
    label: 'Authentication Type',
    type: 'select',
    required: true,
    options: [
      { label: 'None', value: 'none' },
      { label: 'API Key', value: 'api-key' },
      { label: 'OAuth 2.0', value: 'oauth' }
    ],
    defaultValue: 'none'
  },
  {
    name: 'authentication.apiKey',
    label: 'API Key',
    type: 'password',
    placeholder: 'Your API key',
    description: 'Required if using API Key authentication'
  },
  {
    name: 'authentication.clientId',
    label: 'OAuth Client ID',
    type: 'text',
    placeholder: 'OAuth client ID',
    description: 'Required for OAuth authentication'
  },
  {
    name: 'authentication.clientSecret',
    label: 'OAuth Client Secret',
    type: 'password',
    placeholder: 'OAuth client secret',
    description: 'Required for OAuth authentication'
  }
]

const agUIConfigFields: ConfigField[] = [
  {
    name: 'transport',
    label: 'Transport Type',
    type: 'select',
    required: true,
    description: 'Connection protocol for AG-UI',
    options: [
      { label: 'WebSocket', value: 'websocket' },
      { label: 'Server-Sent Events (SSE)', value: 'sse' },
      { label: 'HTTP Polling', value: 'http' }
    ],
    defaultValue: 'websocket'
  },
  {
    name: 'endpoint',
    label: 'Server Endpoint',
    type: 'text',
    required: true,
    placeholder: 'wss://api.example.com/agent',
    description: 'AG-UI server endpoint',
    validation: {
      pattern: '^(wss?|https?)://.+',
      message: 'Must be a valid WebSocket or HTTP URL'
    }
  },
  {
    name: 'apiKey',
    label: 'API Key',
    type: 'password',
    placeholder: 'Optional API key',
    description: 'Authentication key if required'
  },
  {
    name: 'streaming',
    label: 'Enable Streaming',
    type: 'checkbox',
    defaultValue: true,
    description: 'Enable real-time message streaming'
  },
  {
    name: 'reconnect',
    label: 'Auto-Reconnect',
    type: 'checkbox',
    defaultValue: true,
    description: 'Automatically reconnect on connection loss'
  },
  {
    name: 'reconnectInterval',
    label: 'Reconnect Interval (ms)',
    type: 'number',
    defaultValue: 5000,
    description: 'Time between reconnection attempts',
    validation: {
      min: 1000,
      max: 60000,
      message: 'Must be between 1000 and 60000 milliseconds'
    }
  }
]

const openAIConfigFields: ConfigField[] = [
  {
    name: 'apiKey',
    label: 'API Key',
    type: 'password',
    required: true,
    placeholder: 'sk-...',
    description: 'Your OpenAI API key'
  },
  {
    name: 'organizationId',
    label: 'Organization ID',
    type: 'text',
    placeholder: 'org-...',
    description: 'Optional organization ID'
  },
  {
    name: 'baseUrl',
    label: 'Base URL',
    type: 'text',
    placeholder: 'https://api.openai.com/v1',
    defaultValue: 'https://api.openai.com/v1',
    description: 'API base URL (for custom endpoints)',
    validation: {
      pattern: '^https?://.+',
      message: 'Must be a valid HTTP/HTTPS URL'
    }
  },
  {
    name: 'model',
    label: 'Model',
    type: 'select',
    required: true,
    options: [
      { label: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
      { label: 'GPT-4', value: 'gpt-4' },
      { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      { label: 'GPT-3.5 Turbo 16K', value: 'gpt-3.5-turbo-16k' }
    ],
    defaultValue: 'gpt-4-turbo-preview'
  },
  {
    name: 'maxTokens',
    label: 'Max Tokens',
    type: 'number',
    defaultValue: 4096,
    description: 'Maximum tokens in response',
    validation: {
      min: 1,
      max: 128000,
      message: 'Must be between 1 and 128000'
    }
  },
  {
    name: 'temperature',
    label: 'Temperature',
    type: 'number',
    defaultValue: 0.7,
    description: 'Creativity level (0 = deterministic, 2 = very creative)',
    validation: {
      min: 0,
      max: 2,
      message: 'Must be between 0 and 2'
    }
  }
]

const langChainConfigFields: ConfigField[] = [
  {
    name: 'endpoint',
    label: 'Server Endpoint',
    type: 'text',
    required: true,
    placeholder: 'https://your-server.com:8000',
    description: 'LangChain server endpoint',
    validation: {
      pattern: '^https?://.+',
      message: 'Must be a valid HTTP/HTTPS URL'
    }
  },
  {
    name: 'apiKey',
    label: 'API Key',
    type: 'password',
    placeholder: 'Optional API key',
    description: 'Authentication key if required'
  },
  {
    name: 'chainType',
    label: 'Chain Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Conversation', value: 'conversation' },
      { label: 'Question & Answer', value: 'qa' },
      { label: 'Agent', value: 'agent' }
    ],
    defaultValue: 'conversation',
    description: 'Type of LangChain to use'
  },
  {
    name: 'memory',
    label: 'Enable Memory',
    type: 'checkbox',
    defaultValue: true,
    description: 'Enable conversation memory'
  },
  {
    name: 'tools',
    label: 'Available Tools',
    type: 'json',
    placeholder: '["search", "calculator", "weather"]',
    description: 'List of tool names as JSON array'
  }
]

// Protocol metadata definitions
export const protocolMetadata: Record<string, ProtocolMetadata> = {
  mcp: {
    id: 'mcp',
    name: 'Model Context Protocol',
    description: 'Connect to MCP servers for tool and resource access',
    icon: '🔧',
    documentationUrl: 'https://github.com/anthropics/mcp',
    configFields: mcpConfigFields,
    testable: true,
    supportsMultiple: true
  },
  'a2a': {
    id: 'a2a',
    name: 'Agent-to-Agent',
    description: 'Connect to other AI agents for delegation and collaboration',
    icon: '🤝',
    documentationUrl: 'https://docs.example.com/a2a',
    configFields: a2aConfigFields,
    testable: true,
    supportsMultiple: true
  },
  'ag-ui': {
    id: 'ag-ui',
    name: 'Agent UI Protocol',
    description: 'Real-time streaming UI protocol for agent interactions',
    icon: '⚡',
    documentationUrl: 'https://docs.example.com/ag-ui',
    configFields: agUIConfigFields,
    testable: true,
    supportsMultiple: true
  },
  openai: {
    id: 'openai',
    name: 'OpenAI API',
    description: 'Connect to OpenAI GPT models',
    icon: '🤖',
    documentationUrl: 'https://platform.openai.com/docs',
    configFields: openAIConfigFields,
    testable: true,
    supportsMultiple: true
  },
  langchain: {
    id: 'langchain',
    name: 'LangChain',
    description: 'Connect to LangChain agents and chains',
    icon: '🔗',
    documentationUrl: 'https://docs.langchain.com',
    configFields: langChainConfigFields,
    testable: true,
    supportsMultiple: true
  }
}

// Helper function to get config fields for a specific transport
export function getConfigFieldsForTransport(
  protocol: string,
  transport?: string
): ConfigField[] {
  const metadata = protocolMetadata[protocol]
  if (!metadata) return []
  
  // Filter fields based on transport type for protocols that have different transports
  if (protocol === 'mcp' && transport) {
    return metadata.configFields.filter(field => {
      if (transport === 'stdio') {
        return !['url', 'headers'].includes(field.name) || field.name === 'transport'
      } else {
        return !['command', 'args', 'env'].includes(field.name) || field.name === 'transport'
      }
    })
  }
  
  return metadata.configFields
}

// Helper to validate config values
export function validateConfigField(
  field: ConfigField,
  value: any
): { valid: boolean; error?: string } {
  // Required field check
  if (field.required && !value) {
    return { valid: false, error: `${field.label} is required` }
  }
  
  // Type-specific validation
  if (value && field.validation) {
    switch (field.type) {
      case 'number':
        const num = Number(value)
        if (field.validation.min !== undefined && num < field.validation.min) {
          return { valid: false, error: field.validation.message || `Must be at least ${field.validation.min}` }
        }
        if (field.validation.max !== undefined && num > field.validation.max) {
          return { valid: false, error: field.validation.message || `Must be at most ${field.validation.max}` }
        }
        break
      
      case 'text':
      case 'password':
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            return { valid: false, error: field.validation.message || 'Invalid format' }
          }
        }
        break
      
      case 'json':
        try {
          JSON.parse(value)
        } catch {
          return { valid: false, error: 'Must be valid JSON' }
        }
        break
    }
  }
  
  return { valid: true }
}