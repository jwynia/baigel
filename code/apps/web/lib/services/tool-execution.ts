/**
 * Service for executing tools through various connection protocols
 */

import type { Connection } from '@/lib/types/connections'
import { 
  initializeMCPSession, 
  getActiveSession, 
  executeToolInSession 
} from './mcp-session'

export async function executeToolInConnection(
  connection: Connection,
  toolId: string,
  parameters: Record<string, any>
): Promise<any> {
  // Check connection status
  if (connection.status !== 'connected') {
    throw new Error('Connection is not active. Please connect first.')
  }
  
  // Route to appropriate protocol handler
  switch (connection.protocol) {
    case 'mcp':
      return executeMCPTool(connection as any, toolId, parameters)
    
    case 'a2a':
      return executeA2ATool(connection as any, toolId, parameters)
    
    case 'ag-ui':
      return executeAGUITool(connection as any, toolId, parameters)
    
    case 'openai':
      return executeOpenAIFunction(connection as any, toolId, parameters)
    
    default:
      throw new Error(`Protocol ${connection.protocol} does not support tool execution`)
  }
}

async function executeMCPTool(
  connection: any,
  toolId: string,
  parameters: Record<string, any>
): Promise<any> {
  const { config, metadata } = connection
  
  if (config.transport === 'http') {
    // For proper MCP endpoints, use session-based execution
    if (metadata?.mcpHttpEndpoint) {
      try {
        // Get or create MCP session
        let session = getActiveSession(connection)
        if (!session) {
          session = await initializeMCPSession(connection)
        }
        
        // Execute tool within the session
        return await executeToolInSession(session, toolId, parameters)
      } catch (error) {
        console.warn('MCP session execution failed, falling back to direct call:', error)
        // Fall through to legacy execution
      }
    }
    
    // Legacy execution for backward compatibility with Mastra tool API and other endpoints
    let url: string
    if (metadata?.executionEndpoint) {
      // Fallback to Mastra tool API for backward compatibility
      url = metadata.executionEndpoint.replace('{toolId}', toolId)
    } else {
      // Fallback for standard MCP servers
      url = `${config.url}/tools/${toolId}/execute`
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add authentication headers if configured
    if (config.headers) {
      Object.assign(headers, config.headers)
    }
    
    // Try different payload formats for backward compatibility
    const payloadFormats = [
      // Mastra tool API format (most common for discovered servers)
      {
        data: parameters,
        runtimeContext: {},
      },
      // Standard MCP tool call format
      {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolId,
          arguments: parameters,
        },
      },
      // Legacy MCP format variations
      {
        tool: toolId,
        arguments: parameters,
      },
      // Some servers expect parameters directly
      parameters,
      // Some servers expect context wrapper
      {
        context: parameters,
      },
      // MCP server might expect tool name and parameters separately
      {
        name: toolId,
        parameters: parameters,
      },
      // Try with input field (some servers use this)
      {
        tool: toolId,
        input: parameters,
      },
      // Try with request wrapper
      {
        request: {
          name: toolId,
          arguments: parameters,
        },
      },
    ]
    
    let lastError: Error | null = null
    let allErrors: string[] = []
    
    // Try each payload format until one works
    for (let i = 0; i < payloadFormats.length; i++) {
      const payload = payloadFormats[i]
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
        
        if (response.ok) {
          const responseData = await response.json()
          
          // Handle JSON-RPC 2.0 response format
          if (responseData.jsonrpc === '2.0') {
            if (responseData.error) {
              throw new Error(`MCP Error (${responseData.error.code}): ${responseData.error.message}`)
            }
            return responseData.result
          }
          
          // Handle non-JSON-RPC responses (Mastra tool API, etc.)
          return responseData
        }
        
        // Collect all errors for debugging
        let errorMessage: string
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`
        } catch {
          errorMessage = await response.text() || `HTTP ${response.status}`
        }
        
        allErrors.push(`Format ${i + 1}: ${errorMessage}`)
        
        // Store the error from the most likely correct format (first one)
        if (!lastError) {
          lastError = new Error(`Tool execution failed: ${errorMessage}`)
        }
      } catch (error) {
        allErrors.push(`Format ${i + 1}: ${(error as Error).message}`)
        if (!lastError) {
          lastError = error as Error
        }
      }
    }
    
    // If all formats failed, throw detailed error
    const detailedError = new Error(
      `All ${payloadFormats.length} payload formats failed. Errors: ${allErrors.join('; ')}`
    )
    throw detailedError
  }
  
  throw new Error('Only HTTP transport is currently supported for MCP tools')
}

async function executeA2ATool(
  connection: any,
  toolId: string,
  parameters: Record<string, any>
): Promise<any> {
  const { config } = connection
  
  // A2A agents use their direct URL from the agent card
  const url = `${config.endpoint}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.authentication?.type === 'api-key' && config.authentication.apiKey) {
    headers['Authorization'] = `Bearer ${config.authentication.apiKey}`
  }
  
  // A2A protocol uses JSON-RPC 2.0 format
  const requestId = Date.now()
  
  // Try multiple method patterns based on A2A protocol variations
  const methodPatterns = [
    // Standard A2A methods
    {
      jsonrpc: '2.0',
      method: 'message.send',
      params: {
        message: generateA2APrompt(toolId, parameters),
      },
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'chat',
      params: {
        message: generateA2APrompt(toolId, parameters),
      },
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'process',
      params: {
        input: generateA2APrompt(toolId, parameters),
      },
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'generate',
      params: {
        prompt: generateA2APrompt(toolId, parameters),
      },
      id: requestId,
    },
    // Mastra-specific patterns
    {
      jsonrpc: '2.0',
      method: 'execute',
      params: {
        skill: toolId,
        parameters,
      },
      id: requestId,
    },
    // Legacy format fallback
    {
      agentId: config.agentId,
      skill: toolId,
      parameters,
    },
  ]
  
  let lastError: Error | null = null
  let allErrors: string[] = []
  
  // Try each method pattern until one works
  for (let i = 0; i < methodPatterns.length; i++) {
    const payload = methodPatterns[i]
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        const responseData = await response.json()
        
        // Handle JSON-RPC 2.0 response format
        if (responseData.jsonrpc === '2.0') {
          if (responseData.error) {
            throw new Error(`A2A Error (${responseData.error.code}): ${responseData.error.message}`)
          }
          return responseData.result
        }
        
        // Handle non-JSON-RPC responses
        return responseData
      }
      
      // Collect all errors for debugging
      let errorMessage: string
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`
      } catch {
        errorMessage = await response.text() || `HTTP ${response.status}`
      }
      
      allErrors.push(`Method ${i + 1}: ${errorMessage}`)
      
      // Store the error from the most likely correct format (first one)
      if (!lastError) {
        lastError = new Error(`A2A execution failed: ${errorMessage}`)
      }
    } catch (error) {
      allErrors.push(`Method ${i + 1}: ${(error as Error).message}`)
      if (!lastError) {
        lastError = error as Error
      }
    }
  }
  
  // If all methods failed, throw detailed error
  const detailedError = new Error(
    `All ${methodPatterns.length} A2A method patterns failed. Errors: ${allErrors.join('; ')}`
  )
  throw detailedError
}

/**
 * Generate an appropriate prompt for A2A agents based on tool and parameters
 */
function generateA2APrompt(toolId: string, parameters: Record<string, any>): string {
  // Create a natural language prompt for the agent
  let prompt = `Please help with the following task: ${toolId}`
  
  if (Object.keys(parameters).length > 0) {
    prompt += '\n\nParameters:'
    for (const [key, value] of Object.entries(parameters)) {
      prompt += `\n- ${key}: ${JSON.stringify(value)}`
    }
  }
  
  return prompt
}

async function executeAGUITool(
  connection: any,
  toolId: string,
  parameters: Record<string, any>
): Promise<any> {
  const { config } = connection
  
  const url = `${config.endpoint}/tools/execute`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      toolId,
      parameters,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AG-UI execution failed: ${error}`)
  }
  
  return response.json()
}

async function executeOpenAIFunction(
  connection: any,
  toolId: string,
  parameters: Record<string, any>
): Promise<any> {
  const { config } = connection
  
  const baseUrl = config.baseUrl || 'https://api.openai.com'
  const url = `${baseUrl}/v1/chat/completions`
  
  // OpenAI function calling requires a conversation context
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.organizationId && { 'OpenAI-Organization': config.organizationId }),
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Execute the requested function and return the result.',
        },
        {
          role: 'user',
          content: `Execute function ${toolId} with parameters: ${JSON.stringify(parameters)}`,
        },
      ],
      functions: [
        {
          name: toolId,
          parameters: {
            type: 'object',
            properties: parameters,
          },
        },
      ],
      function_call: { name: toolId },
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI execution failed: ${error}`)
  }
  
  const data = await response.json()
  
  // Extract function call result
  if (data.choices?.[0]?.message?.function_call) {
    return JSON.parse(data.choices[0].message.function_call.arguments)
  }
  
  // Fallback to regular content
  return { result: data.choices?.[0]?.message?.content || 'No result' }
}

/**
 * Fetch available tools for a connection
 */
export async function fetchToolsForConnection(connection: Connection): Promise<any[]> {
  switch (connection.protocol) {
    case 'mcp':
      return fetchMCPTools(connection as any)
    
    case 'a2a':
      return fetchA2ATools(connection as any)
    
    default:
      return []
  }
}

async function fetchMCPTools(connection: any): Promise<any[]> {
  const { config, metadata } = connection
  
  if (config.transport === 'http') {
    // For proper MCP endpoints, use session-based tool discovery
    if (metadata?.mcpHttpEndpoint) {
      try {
        // Get or create MCP session
        let session = getActiveSession(connection)
        if (!session) {
          session = await initializeMCPSession(connection)
        }
        
        // Return tools from session (already fetched during initialization)
        return session.tools || []
      } catch (error) {
        console.warn('MCP session tool discovery failed, falling back to direct call:', error)
        // Fall through to legacy discovery
      }
    }
    
    // Legacy tool discovery for Mastra and other endpoints
    const url = metadata?.mastraEndpoint || `${config.url}/tools`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add authentication headers if configured
    if (config.headers) {
      Object.assign(headers, config.headers)
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.tools || []
  }
  
  return []
}

async function fetchA2ATools(connection: any): Promise<any[]> {
  const { config } = connection
  
  // For A2A agents, tools/skills are typically defined in the agent card
  // Check if we have them in metadata first
  if (connection.tools && connection.tools.length > 0) {
    return connection.tools
  }
  
  // Try to fetch skills/capabilities from the agent
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.authentication?.type === 'api-key' && config.authentication.apiKey) {
    headers['Authorization'] = `Bearer ${config.authentication.apiKey}`
  }
  
  const requestId = Date.now()
  
  // Try different methods to get available skills/capabilities
  const methodPatterns = [
    {
      jsonrpc: '2.0',
      method: 'capabilities.list',
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'skills.list',
      id: requestId,
    },
    {
      jsonrpc: '2.0',
      method: 'methods.list',
      id: requestId,
    },
  ]
  
  for (const payload of methodPatterns) {
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.jsonrpc === '2.0' && !data.error && data.result) {
          // Handle different response formats
          if (Array.isArray(data.result)) {
            return data.result
          }
          if (data.result.skills) {
            return data.result.skills
          }
          if (data.result.capabilities) {
            return data.result.capabilities
          }
          if (data.result.methods) {
            return data.result.methods.map((method: string) => ({
              name: method,
              description: `A2A method: ${method}`,
            }))
          }
        }
      }
    } catch (error) {
      // Continue to next method
      continue
    }
  }
  
  // If no skills can be fetched, create a generic chat tool for A2A agents
  return [
    {
      id: 'chat',
      name: 'Chat',
      description: 'Send a message to this A2A agent',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to send to the agent',
          },
        },
        required: ['message'],
      },
    },
  ]
}