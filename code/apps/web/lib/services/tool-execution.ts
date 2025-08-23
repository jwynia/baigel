/**
 * Service for executing tools through various connection protocols
 */

import type { Connection } from '@/lib/types/connections'

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
    // Use proper MCP HTTP endpoint (JSON-RPC 2.0) if available
    let url: string
    if (metadata?.mcpHttpEndpoint) {
      url = metadata.mcpHttpEndpoint
    } else if (metadata?.executionEndpoint) {
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
    
    // Determine which payload formats to try based on endpoint type
    const isStandardMcp = metadata?.mcpHttpEndpoint
    const payloadFormats = []
    
    if (isStandardMcp) {
      // For proper MCP endpoints, use JSON-RPC 2.0 format first
      payloadFormats.push({
        jsonrpc: '2.0',
        id: Date.now(), // Simple ID generation
        method: 'tools/call',
        params: {
          name: toolId,
          arguments: parameters,
        },
      })
    } else {
      // For Mastra tool API endpoints, use their format first
      payloadFormats.push({
        data: parameters,
        runtimeContext: {},
      })
    }
    
    // Add fallback formats for compatibility
    payloadFormats.push(
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
      // Mastra format (for backward compatibility)
      {
        data: parameters,
        runtimeContext: {},
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
    )
    
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
  
  const url = `${config.endpoint}/execute`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.authentication?.type === 'api-key' && config.authentication.apiKey) {
    headers['Authorization'] = `Bearer ${config.authentication.apiKey}`
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      agentId: config.agentId,
      skill: toolId,
      parameters,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`A2A execution failed: ${error}`)
  }
  
  return response.json()
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
    // Use tools endpoint from metadata if available (Mastra MCP servers)
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
  
  const url = `${config.endpoint}/skills`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.authentication?.type === 'api-key' && config.authentication.apiKey) {
    headers['Authorization'] = `Bearer ${config.authentication.apiKey}`
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })
  
  if (!response.ok) {
    return []
  }
  
  const data = await response.json()
  return data.skills || []
}