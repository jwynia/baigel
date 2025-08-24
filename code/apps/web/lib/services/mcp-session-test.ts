/**
 * MCP Session Testing Utilities
 * Utilities for testing MCP session functionality
 */

import type { MCPConnection } from '@/lib/types/connections'
import { initializeMCPSession, getActiveSession } from './mcp-session'

/**
 * Test MCP session initialization with a connection
 */
export async function testMCPSession(connection: MCPConnection): Promise<{
  success: boolean
  sessionId?: string
  capabilities?: any
  tools?: any[]
  error?: string
}> {
  try {
    const session = await initializeMCPSession(connection)
    
    return {
      success: true,
      sessionId: session.sessionId,
      capabilities: session.capabilities,
      tools: session.tools,
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

/**
 * Get session info for a connection
 */
export function getSessionInfo(connection: MCPConnection): {
  hasActiveSession: boolean
  sessionId?: string
  initialized?: boolean
  toolCount?: number
  lastUsed?: Date
} {
  const session = getActiveSession(connection)
  
  if (!session) {
    return { hasActiveSession: false }
  }
  
  return {
    hasActiveSession: true,
    sessionId: session.sessionId,
    initialized: session.initialized,
    toolCount: session.tools?.length || 0,
    lastUsed: session.lastUsed,
  }
}