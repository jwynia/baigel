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

// Mock connection templates for demo
const mockConnections: Connection[] = [
  {
    id: 'demo-mcp-1',
    name: 'Local MCP Server',
    protocol: 'mcp',
    status: 'disconnected',
    createdAt: new Date('2025-01-01'),
    config: {
      transport: 'stdio',
      command: 'mcp-server',
      args: ['--port', '3001'],
      env: { DEBUG: 'true' }
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false
    },
    tags: ['local', 'development'],
    isDefault: true
  } as any,
  {
    id: 'demo-openai-1',
    name: 'OpenAI GPT-4',
    protocol: 'openai',
    status: 'disconnected',
    createdAt: new Date('2025-01-02'),
    config: {
      apiKey: 'sk-...',
      model: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      temperature: 0.7
    },
    tags: ['production', 'gpt-4']
  } as any,
  {
    id: 'demo-agui-1',
    name: 'AG-UI WebSocket',
    protocol: 'ag-ui',
    status: 'disconnected',
    createdAt: new Date('2025-01-03'),
    config: {
      transport: 'websocket',
      endpoint: 'wss://api.example.com/agent',
      streaming: true,
      reconnect: true,
      reconnectInterval: 5000
    },
    features: {
      streaming: true,
      tools: true,
      multiModal: false
    },
    tags: ['websocket', 'streaming']
  } as any
]

export const useConnectionStore = create<ConnectionStore>()(
  devtools(
    persist(
      (set, get) => ({
        connections: mockConnections,
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

// Mock connection testing function
export async function testConnection(connection: Connection): Promise<ConnectionTestResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
  
  // Mock different test results based on protocol
  const successRate = 0.8 // 80% success rate for demo
  const success = Math.random() < successRate
  
  if (!success) {
    return {
      success: false,
      error: 'Connection timeout: Unable to reach the server'
    }
  }
  
  // Return protocol-specific test results
  switch (connection.protocol) {
    case 'mcp':
      return {
        success: true,
        latency: Math.floor(50 + Math.random() * 100),
        capabilities: {
          tools: true,
          resources: true,
          prompts: Math.random() > 0.5
        },
        info: {
          version: '1.0.0',
          name: 'MCP Test Server',
          description: 'A mock MCP server for testing'
        }
      }
    
    case 'openai':
      return {
        success: true,
        latency: Math.floor(100 + Math.random() * 200),
        info: {
          version: 'v1',
          name: 'OpenAI API',
          description: 'GPT-4 Turbo Preview'
        }
      }
    
    case 'ag-ui':
      return {
        success: true,
        latency: Math.floor(30 + Math.random() * 70),
        capabilities: {
          streaming: true,
          tools: true,
          multiModal: false
        },
        info: {
          version: '2.0.0',
          name: 'AG-UI Server'
        }
      }
    
    default:
      return {
        success: true,
        latency: Math.floor(50 + Math.random() * 150)
      }
  }
}

// Mock connect function
export async function connectToService(connection: Connection): Promise<void> {
  const store = useConnectionStore.getState()
  
  // Set connecting status
  store.updateConnectionStatus(connection.id, 'connecting')
  
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500))
  
  // 90% success rate for connections
  const success = Math.random() < 0.9
  
  if (success) {
    store.updateConnectionStatus(connection.id, 'connected')
    store.setActiveConnection(connection.id)
  } else {
    store.updateConnectionStatus(
      connection.id, 
      'error', 
      'Failed to establish connection: Connection refused'
    )
  }
}

// Mock disconnect function
export async function disconnectFromService(connectionId: string): Promise<void> {
  const store = useConnectionStore.getState()
  
  // Simulate disconnect delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  store.updateConnectionStatus(connectionId, 'disconnected')
  
  // Clear active connection if it was this one
  if (store.activeConnectionId === connectionId) {
    store.setActiveConnection(null)
  }
}