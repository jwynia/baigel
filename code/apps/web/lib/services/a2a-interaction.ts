/**
 * A2A (Agent-to-Agent) Interaction Service
 * Handles communication with A2A agents following the A2A protocol specification
 */

import type { A2AConnection } from '@/lib/types/connections'

export interface A2AMessage {
  content: string
  role?: 'user' | 'assistant' | 'system'
  timestamp?: Date
}

export interface A2AResponse {
  success: boolean
  content?: string
  error?: string
  metadata?: Record<string, any>
}

/**
 * Send a message to an A2A agent using various protocol methods
 */
export async function sendMessageToA2AAgent(
  connection: A2AConnection,
  message: string
): Promise<A2AResponse> {
  const { config } = connection
  const endpoint = config.endpoint
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.authentication?.type === 'api-key' && config.authentication.apiKey) {
    headers['Authorization'] = `Bearer ${config.authentication.apiKey}`
  }
  
  const requestId = Date.now()
  
  // Try different A2A protocol methods
  const methodAttempts = [
    // Standard A2A protocol methods
    {
      name: 'message.send',
      payload: {
        jsonrpc: '2.0',
        method: 'message.send',
        params: { message },
        id: requestId,
      },
    },
    {
      name: 'chat',
      payload: {
        jsonrpc: '2.0',
        method: 'chat',
        params: { message },
        id: requestId,
      },
    },
    {
      name: 'process',
      payload: {
        jsonrpc: '2.0',
        method: 'process',
        params: { input: message },
        id: requestId,
      },
    },
    {
      name: 'generate',
      payload: {
        jsonrpc: '2.0',
        method: 'generate',
        params: { prompt: message },
        id: requestId,
      },
    },
    // Mastra-specific methods
    {
      name: 'invoke',
      payload: {
        jsonrpc: '2.0',
        method: 'invoke',
        params: { text: message },
        id: requestId,
      },
    },
    // Simple conversation methods
    {
      name: 'converse',
      payload: {
        jsonrpc: '2.0',
        method: 'converse',
        params: { message },
        id: requestId,
      },
    },
  ]
  
  let allErrors: string[] = []
  
  for (const attempt of methodAttempts) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(attempt.payload),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Handle JSON-RPC 2.0 response
        if (data.jsonrpc === '2.0') {
          if (data.error) {
            allErrors.push(`${attempt.name}: ${data.error.message}`)
            continue
          }
          
          return {
            success: true,
            content: data.result?.content || data.result?.message || JSON.stringify(data.result),
            metadata: {
              method: attempt.name,
              requestId,
            },
          }
        }
        
        // Handle non-JSON-RPC response
        return {
          success: true,
          content: data.content || data.message || JSON.stringify(data),
          metadata: {
            method: attempt.name,
            requestId,
          },
        }
      }
      
      // Handle HTTP errors
      const errorText = await response.text()
      allErrors.push(`${attempt.name}: HTTP ${response.status} - ${errorText}`)
      
    } catch (error) {
      allErrors.push(`${attempt.name}: ${(error as Error).message}`)
    }
  }
  
  // All methods failed
  return {
    success: false,
    error: `All A2A method attempts failed: ${allErrors.join('; ')}`,
  }
}

/**
 * Discover available capabilities from an A2A agent
 */
export async function discoverA2ACapabilities(
  connection: A2AConnection
): Promise<{
  capabilities?: string[]
  methods?: string[]
  skills?: any[]
  error?: string
}> {
  const { config } = connection
  const endpoint = config.endpoint
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.authentication?.type === 'api-key' && config.authentication.apiKey) {
    headers['Authorization'] = `Bearer ${config.authentication.apiKey}`
  }
  
  const requestId = Date.now()
  
  // Try different discovery methods
  const discoveryMethods = [
    {
      jsonrpc: '2.0',
      method: 'capabilities.list',
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'methods.list',
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'skills.list',
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'info',
      id: requestId,
    },
  ]
  
  for (const payload of discoveryMethods) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.jsonrpc === '2.0' && !data.error && data.result) {
          return {
            capabilities: data.result.capabilities,
            methods: data.result.methods,
            skills: data.result.skills,
          }
        }
      }
    } catch (error) {
      continue
    }
  }
  
  return {
    error: 'Could not discover A2A agent capabilities',
  }
}

/**
 * Test A2A agent connectivity and basic functionality
 */
export async function testA2AAgent(connection: A2AConnection): Promise<{
  success: boolean
  responseTime?: number
  supportedMethod?: string
  error?: string
}> {
  const startTime = Date.now()
  
  // Try a simple test message
  const result = await sendMessageToA2AAgent(connection, 'Hello, this is a connectivity test.')
  
  const responseTime = Date.now() - startTime
  
  if (result.success) {
    return {
      success: true,
      responseTime,
      supportedMethod: result.metadata?.method,
    }
  }
  
  return {
    success: false,
    responseTime,
    error: result.error,
  }
}

/**
 * Create a chat-style interaction with an A2A agent
 */
export async function chatWithA2AAgent(
  connection: A2AConnection,
  messages: A2AMessage[]
): Promise<A2AResponse> {
  // Convert message history to a single prompt
  const prompt = messages
    .map((msg) => `${msg.role || 'user'}: ${msg.content}`)
    .join('\n')
  
  return sendMessageToA2AAgent(connection, prompt)
}