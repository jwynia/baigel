/**
 * MCP Session Management Service
 * Handles JSON-RPC 2.0 session initialization and management for MCP connections
 */

import type { MCPConnection } from '@/lib/types/connections'

interface MCPSession {
  sessionId: string
  connection: MCPConnection
  initialized: boolean
  capabilities?: {
    tools?: boolean
    resources?: boolean
    prompts?: boolean
  }
  tools?: Array<{
    name: string
    description?: string
    inputSchema?: any
  }>
  createdAt: Date
  lastUsed: Date
}

// Session storage (in-memory for now, could be moved to localStorage)
const activeSessions = new Map<string, MCPSession>()

/**
 * Generate a unique session ID for an MCP connection
 */
function generateSessionId(connection: MCPConnection): string {
  const baseUrl = connection.config.url || connection.metadata?.mcpHttpEndpoint || 'unknown'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `mcp-${btoa(baseUrl).slice(0, 8)}-${timestamp}-${random}`
}

/**
 * Initialize an MCP session with proper JSON-RPC 2.0 handshake
 */
export async function initializeMCPSession(connection: MCPConnection): Promise<MCPSession> {
  const sessionId = generateSessionId(connection)
  
  // Check if we already have an active session for this connection
  const existingSessionId = getSessionId(connection)
  if (existingSessionId && activeSessions.has(existingSessionId)) {
    const session = activeSessions.get(existingSessionId)!
    if (session.initialized && (Date.now() - session.lastUsed.getTime()) < 300000) { // 5 minutes
      session.lastUsed = new Date()
      return session
    }
  }

  const session: MCPSession = {
    sessionId,
    connection,
    initialized: false,
    createdAt: new Date(),
    lastUsed: new Date(),
  }

  if (connection.config.transport === 'http') {
    const endpoint = connection.metadata?.mcpHttpEndpoint || `${connection.config.url}/mcp`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add authentication headers if configured
    if (connection.config.headers) {
      Object.assign(headers, connection.config.headers)
    }
    
    try {
      // Step 1: Initialize session with JSON-RPC 2.0 initialize request
      const initResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            clientInfo: {
              name: 'BAIGEL',
              version: '1.0.0',
            },
          },
        }),
      })
      
      if (!initResponse.ok) {
        throw new Error(`MCP initialize failed: HTTP ${initResponse.status}`)
      }
      
      const initData = await initResponse.json()
      
      if (initData.error) {
        throw new Error(`MCP initialize error: ${initData.error.message}`)
      }
      
      // Store server capabilities from initialize response
      session.capabilities = initData.result?.capabilities || {}
      
      // Step 2: Send initialized notification
      const notifyResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      })
      
      // Step 3: Fetch available tools
      if (session.capabilities?.tools) {
        try {
          const toolsResponse = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
            }),
          })
          
          if (toolsResponse.ok) {
            const toolsData = await toolsResponse.json()
            if (!toolsData.error) {
              session.tools = toolsData.result?.tools || []
            }
          }
        } catch (error) {
          console.warn('Failed to fetch tools during session initialization:', error)
        }
      }
      
      session.initialized = true
      activeSessions.set(sessionId, session)
      
      return session
      
    } catch (error) {
      console.error('MCP session initialization failed:', error)
      throw new Error(`Failed to initialize MCP session: ${(error as Error).message}`)
    }
  }
  
  throw new Error('Only HTTP transport is supported for MCP sessions')
}

/**
 * Get the active session for a connection, if any
 */
export function getActiveSession(connection: MCPConnection): MCPSession | null {
  const sessionId = getSessionId(connection)
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)!
    // Check if session is still valid (not older than 30 minutes)
    if (session.initialized && (Date.now() - session.lastUsed.getTime()) < 1800000) {
      return session
    } else {
      // Clean up expired session
      activeSessions.delete(sessionId)
    }
  }
  return null
}

/**
 * Execute a tool call within an MCP session
 */
export async function executeToolInSession(
  session: MCPSession,
  toolName: string,
  parameters: Record<string, any>
): Promise<any> {
  if (!session.initialized) {
    throw new Error('MCP session is not initialized')
  }
  
  session.lastUsed = new Date()
  
  const connection = session.connection
  const endpoint = connection.metadata?.mcpHttpEndpoint || `${connection.config.url}/mcp`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Add authentication headers if configured
  if (connection.config.headers) {
    Object.assign(headers, connection.config.headers)
  }
  
  const requestId = Date.now()
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: parameters,
      },
    }),
  })
  
  if (!response.ok) {
    throw new Error(`MCP tool call failed: HTTP ${response.status}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(`MCP tool error (${data.error.code}): ${data.error.message}`)
  }
  
  return data.result
}

/**
 * Close an MCP session
 */
export async function closeMCPSession(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId)
  if (session) {
    activeSessions.delete(sessionId)
    
    // Optionally notify the server about session closure
    // (Not all MCP servers require this)
    if (session.connection.config.transport === 'http') {
      const endpoint = session.connection.metadata?.mcpHttpEndpoint || `${session.connection.config.url}/mcp`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (session.connection.config.headers) {
        Object.assign(headers, session.connection.config.headers)
      }
      
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/cancelled',
          }),
        })
      } catch (error) {
        // Ignore errors during session closure
        console.warn('Failed to notify server of session closure:', error)
      }
    }
  }
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  const expiredThreshold = 1800000 // 30 minutes
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastUsed.getTime() > expiredThreshold) {
      closeMCPSession(sessionId).catch(() => {
        // Ignore cleanup errors
      })
    }
  }
}

/**
 * Get all active sessions (for debugging)
 */
export function getActiveSessions(): MCPSession[] {
  return Array.from(activeSessions.values())
}

/**
 * Generate a consistent session identifier for a connection
 */
function getSessionId(connection: MCPConnection): string | null {
  const baseUrl = connection.config.url || connection.metadata?.mcpHttpEndpoint
  if (!baseUrl) return null
  
  return `mcp-session-${btoa(baseUrl).slice(0, 12)}`
}

// Cleanup expired sessions every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredSessions, 300000)
}