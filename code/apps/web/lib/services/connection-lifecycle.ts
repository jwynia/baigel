/**
 * Connection Lifecycle Management
 * Handles connection state changes and cleanup
 */

import type { Connection } from '@/lib/types/connections'
import { closeMCPSession, getActiveSession } from './mcp-session'

/**
 * Handle connection removal - cleanup any active sessions
 */
export async function onConnectionRemoved(connection: Connection): Promise<void> {
  if (connection.protocol === 'mcp') {
    const session = getActiveSession(connection as any)
    if (session) {
      await closeMCPSession(session.sessionId)
    }
  }
}

/**
 * Handle connection disconnection - cleanup any active sessions
 */
export async function onConnectionDisconnected(connection: Connection): Promise<void> {
  if (connection.protocol === 'mcp') {
    const session = getActiveSession(connection as any)
    if (session) {
      await closeMCPSession(session.sessionId)
    }
  }
}

/**
 * Handle connection status change
 */
export async function onConnectionStatusChanged(
  connection: Connection, 
  oldStatus: string, 
  newStatus: string
): Promise<void> {
  // Clean up sessions when connections become disconnected or error
  if (connection.protocol === 'mcp' && (newStatus === 'disconnected' || newStatus === 'error')) {
    const session = getActiveSession(connection as any)
    if (session) {
      await closeMCPSession(session.sessionId)
    }
  }
}