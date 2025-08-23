/**
 * Utilities for detecting connection capabilities and determining appropriate interface types
 */

import type { Connection } from '@/lib/types/connections'

export type InterfaceType = 'chat' | 'tools' | 'hybrid'

/**
 * Determine the appropriate interface type for a connection
 */
export function getConnectionInterfaceType(connection: Connection): InterfaceType {
  const hasTools = connection.tools && connection.tools.length > 0
  const hasChat = supportsChat(connection)
  
  if (hasTools && hasChat) return 'hybrid'
  if (hasTools) return 'tools'
  return 'chat'
}

/**
 * Check if a connection supports chat functionality
 */
export function supportsChat(connection: Connection): boolean {
  // OpenAI connections are primarily for chat
  if (connection.protocol === 'openai') return true
  
  // A2A agents typically support chat
  if (connection.protocol === 'a2a') return true
  
  // AG-UI connections support chat
  if (connection.protocol === 'ag-ui') return true
  
  // Check explicit capabilities
  if (connection.capabilities) {
    // String array format
    if (Array.isArray(connection.capabilities)) {
      return connection.capabilities.includes('chat') || 
             connection.capabilities.includes('conversation') ||
             connection.capabilities.includes('messaging')
    }
    
    // Object format (for MCP)
    if (typeof connection.capabilities === 'object' && 'chat' in connection.capabilities) {
      return true
    }
  }
  
  // MCP connections are typically tool-only, not conversational
  // Only consider MCP as chat-capable if explicitly marked as such
  if (connection.protocol === 'mcp') {
    // Check if this MCP server explicitly supports chat/conversation
    if (connection.capabilities) {
      if (Array.isArray(connection.capabilities)) {
        return connection.capabilities.includes('chat') || 
               connection.capabilities.includes('conversation') ||
               connection.capabilities.includes('messaging')
      }
      if (typeof connection.capabilities === 'object' && 'chat' in connection.capabilities) {
        return connection.capabilities.chat === true
      }
    }
    return false // MCP servers are typically tools-only
  }
  
  return false
}

/**
 * Check if a connection has executable tools
 */
export function hasExecutableTools(connection: Connection): boolean {
  return connection.tools !== undefined && connection.tools.length > 0
}

/**
 * Get the default tab for a hybrid interface
 */
export function getDefaultTab(connection: Connection): 'chat' | 'tools' {
  // If it's primarily a tool service with schemas, default to tools
  if (hasExecutableTools(connection)) {
    // Check if tools have schemas - if so, prioritize tools interface
    const hasSchemas = connection.tools?.some(toolHasSchema) || false
    if (hasSchemas) {
      return 'tools'
    }
  }
  
  // For A2A and OpenAI, default to chat
  if (connection.protocol === 'a2a' || connection.protocol === 'openai') {
    return 'chat'
  }
  
  // For MCP with tools but no schemas, still default to tools
  if (connection.protocol === 'mcp' && hasExecutableTools(connection)) {
    return 'tools'
  }
  
  return 'chat'
}

/**
 * Get a human-readable description of the connection's capabilities
 */
export function getCapabilityDescription(connection: Connection): string {
  const interfaceType = getConnectionInterfaceType(connection)
  const toolCount = connection.tools?.length || 0
  
  switch (interfaceType) {
    case 'chat':
      return 'Conversational AI agent'
    case 'tools':
      return `${toolCount} executable tool${toolCount !== 1 ? 's' : ''}`
    case 'hybrid':
      return `Chat agent with ${toolCount} tool${toolCount !== 1 ? 's' : ''}`
    default:
      return 'AI service'
  }
}

/**
 * Check if a tool has a form schema for input
 */
export function toolHasSchema(tool: { inputSchema?: any }): boolean {
  return tool.inputSchema && 
         typeof tool.inputSchema === 'object' && 
         (tool.inputSchema.properties || tool.inputSchema.type)
}

/**
 * Determine if a connection is primarily form-based (tools with schemas)
 */
export function isFormBasedConnection(connection: Connection): boolean {
  if (!hasExecutableTools(connection)) return false
  
  // Check if most tools have schemas
  const toolsWithSchemas = connection.tools?.filter(toolHasSchema).length || 0
  const totalTools = connection.tools?.length || 0
  
  return toolsWithSchemas > 0 && (toolsWithSchemas / totalTools) >= 0.5
}

/**
 * Get the primary action for a connection (what users should do first)
 */
export function getPrimaryAction(connection: Connection): 'chat' | 'select-tool' | 'configure' {
  if (connection.status !== 'connected') return 'configure'
  
  const interfaceType = getConnectionInterfaceType(connection)
  
  switch (interfaceType) {
    case 'chat':
      return 'chat'
    case 'tools':
      return 'select-tool'
    case 'hybrid':
      return getDefaultTab(connection) === 'chat' ? 'chat' : 'select-tool'
    default:
      return 'configure'
  }
}