import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  Connection, 
  ConnectionStatus, 
  ConnectionTestResult,
  ProtocolType 
} from '@/lib/types/connections'

interface ConnectionStore {
  connections: Connection[]
  activeConnectionId: string | null
  
  // CRUD operations
  addConnection: (connection: Omit<Connection, 'id' | 'createdAt' | 'status'>) => Connection
  updateConnection: (id: string, updates: Partial<Connection>) => void
  deleteConnection: (id: string) => void
  
  // Connection operations
  setActiveConnection: (id: string | null) => void
  updateConnectionStatus: (id: string, status: ConnectionStatus, error?: string) => void
  
  // Bulk operations
  importConnections: (connections: Connection[]) => void
  clearConnections: () => void
  
  // Getters
  getConnection: (id: string) => Connection | undefined
  getActiveConnection: () => Connection | undefined
  getConnectionsByProtocol: (protocol: ProtocolType) => Connection[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

// Mock connections removed - start with empty state for proper onboarding flow
// Users should discover or manually add their own connections

export const useConnectionStore = create<ConnectionStore>()(
  devtools(
    persist(
      (set, get) => ({
        connections: [],  // Start with empty connections, not mock data
        activeConnectionId: null,

        addConnection: (connectionData) => {
          const newConnection: Connection = {
            ...connectionData,
            id: generateId(),
            createdAt: new Date(),
            status: 'disconnected'
          } as Connection

          set((state) => ({
            connections: [...state.connections, newConnection]
          }), false, 'addConnection')

          return newConnection
        },

        updateConnection: (id, updates) => {
          set((state) => ({
            connections: state.connections.map(conn =>
              conn.id === id ? { ...conn, ...updates } as Connection : conn
            )
          }), false, 'updateConnection')
        },

        deleteConnection: (id) => {
          set((state) => ({
            connections: state.connections.filter(conn => conn.id !== id),
            activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId
          }), false, 'deleteConnection')
        },

        setActiveConnection: (id) => {
          set({ activeConnectionId: id }, false, 'setActiveConnection')
        },

        updateConnectionStatus: (id, status, error) => {
          set((state) => ({
            connections: state.connections.map(conn =>
              conn.id === id 
                ? { 
                    ...conn, 
                    status, 
                    error,
                    lastConnected: status === 'connected' ? new Date() : conn.lastConnected 
                  } 
                : conn
            )
          }), false, 'updateConnectionStatus')
        },

        importConnections: (connections) => {
          set({ connections }, false, 'importConnections')
        },

        clearConnections: () => {
          set({ connections: [], activeConnectionId: null }, false, 'clearConnections')
        },

        getConnection: (id) => {
          return get().connections.find(conn => conn.id === id)
        },

        getActiveConnection: () => {
          const { activeConnectionId, connections } = get()
          return activeConnectionId 
            ? connections.find(conn => conn.id === activeConnectionId)
            : undefined
        },

        getConnectionsByProtocol: (protocol) => {
          return get().connections.filter(conn => conn.protocol === protocol)
        }
      }),
      {
        name: 'connection-storage',
        // Only persist connections, not runtime state
        partialize: (state) => ({ 
          connections: state.connections.map(conn => ({
            ...conn,
            status: 'disconnected' as ConnectionStatus,
            error: undefined
          }))
        })
      }
    ),
    {
      name: 'connection-store'
    }
  )
)

// Real connection testing function using protocol adapters
export async function testConnection(connection: Connection): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  
  try {
    // Import protocol adapters dynamically to avoid circular imports
    const { ProtocolAdapterFactory } = await import('@/lib/protocol-adapters')
    
    // Create adapter for the connection
    const adapter = ProtocolAdapterFactory.create(connection)
    
    // Attempt to connect
    await adapter.connect()
    
    const latency = Date.now() - startTime
    
    // Get connection info and available tools
    const connectionInfo = adapter.getConnectionInfo()
    const tools = await adapter.getAvailableTools()
    
    // Disconnect after testing
    await adapter.disconnect()
    
    // Build capabilities based on what we discovered
    const capabilities: Record<string, boolean> = {
      tools: tools.length > 0
    }
    
    // Add protocol-specific capabilities
    switch (connection.protocol) {
      case 'mcp':
        capabilities.resources = true
        capabilities.prompts = true
        break
      case 'openai':
        capabilities.streaming = true
        break
      case 'a2a':
        capabilities.agents = true
        capabilities.delegation = true
        break
      case 'ag-ui':
        capabilities.streaming = true
        capabilities.multiModal = true
        break
    }
    
    return {
      success: true,
      latency,
      capabilities,
      info: {
        name: connection.name,
        description: `Connected to ${connectionInfo}`
      }
    }
    
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      success: false,
      latency,
      error: error instanceof Error ? error.message : 'Connection test failed'
    }
  }
}

// Real connect function using protocol adapters
export async function connectToService(connection: Connection): Promise<void> {
  const store = useConnectionStore.getState()
  
  // Set connecting status
  store.updateConnectionStatus(connection.id, 'connecting')
  
  try {
    // Import protocol adapters dynamically to avoid circular imports
    const { ProtocolAdapterFactory } = await import('@/lib/protocol-adapters')
    
    // Create and connect using the appropriate adapter
    const adapter = ProtocolAdapterFactory.create(connection)
    await adapter.connect()
    
    // Connection successful
    store.updateConnectionStatus(connection.id, 'connected')
    store.setActiveConnection(connection.id)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection failed'
    store.updateConnectionStatus(connection.id, 'error', errorMessage)
    throw error // Re-throw so caller can handle the error
  }
}

// Real disconnect function
export async function disconnectFromService(connectionId: string): Promise<void> {
  const store = useConnectionStore.getState()
  const connection = store.getConnection(connectionId)
  
  if (!connection) {
    throw new Error(`Connection ${connectionId} not found`)
  }
  
  try {
    // Import protocol adapters dynamically to avoid circular imports
    const { ProtocolAdapterFactory } = await import('@/lib/protocol-adapters')
    
    // Create adapter and disconnect
    const adapter = ProtocolAdapterFactory.create(connection)
    await adapter.disconnect()
    
  } catch (error) {
    // Log error but don't throw - disconnection should always succeed from UI perspective
    console.error('Error during disconnect:', error)
  } finally {
    // Always update status and clear active connection
    store.updateConnectionStatus(connectionId, 'disconnected')
    
    // Clear active connection if it was this one
    if (store.activeConnectionId === connectionId) {
      store.setActiveConnection(null)
    }
  }
}