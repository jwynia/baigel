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
  const { config } = connection
  
  if (config.transport === 'http') {
    const url = `${config.url}/tools/execute`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify({
        tool: toolId,
        arguments: parameters,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Tool execution failed: ${error}`)
    }
    
    return response.json()
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
  const { config } = connection
  
  if (config.transport === 'http') {
    const url = `${config.url}/tools/list`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
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