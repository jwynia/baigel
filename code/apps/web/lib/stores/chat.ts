import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChatState, Message, ProtocolType, Tool, ToolCall, ConnectionConfig } from '@/lib/types'
import { useConnectionStore } from './connections'
import { ProtocolAdapterFactory, type ProtocolAdapter } from '@/lib/protocol-adapters'

interface ChatStore extends ChatState {
  // Actions
  addMessage: (message: Omit<Message, 'timestamp'>) => void
  updateMessage: (id: string, update: Partial<Message>) => void
  removeMessage: (id: string) => void
  clearMessages: () => void
  
  setProtocol: (protocol: ProtocolType) => void
  setConnected: (connected: boolean) => void
  setStreaming: (streaming: boolean) => void
  setConnectionConfig: (config: ConnectionConfig) => void
  
  sendMessage: (content: string) => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  setAvailableTools: (tools: Tool[]) => void
  addToolCall: (toolCall: ToolCall) => void
  updateToolCall: (id: string, update: Partial<ToolCall>) => void
  
  // Protocol adapter management
  getCurrentAdapter: () => ProtocolAdapter | null
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      messages: [],
      activeProtocol: 'ag-ui',
      isConnected: false,
      isStreaming: false,
      connectionConfig: undefined,
      availableTools: [],
      activeToolCalls: [],

      // Protocol adapter cache
      currentAdapter: null as ProtocolAdapter | null,

      // Message actions
      addMessage: (message) => {
        const fullMessage: Message = {
          ...message,
          timestamp: new Date(),
          id: message.id || generateId(),
        }
        set((state) => ({
          messages: [...state.messages, fullMessage]
        }), false, 'addMessage')
      },

      updateMessage: (id, update) => {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === id ? { ...msg, ...update } : msg
          )
        }), false, 'updateMessage')
      },

      removeMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== id)
        }), false, 'removeMessage')
      },

      clearMessages: () => {
        set({ messages: [] }, false, 'clearMessages')
      },

      // Protocol actions
      setProtocol: (protocol) => {
        set({ activeProtocol: protocol }, false, 'setProtocol')
      },

      setConnected: (connected) => {
        set({ isConnected: connected }, false, 'setConnected')
      },

      setStreaming: (streaming) => {
        set({ isStreaming: streaming }, false, 'setStreaming')
      },

      setConnectionConfig: (config) => {
        set({ connectionConfig: config }, false, 'setConnectionConfig')
      },

      // Real protocol adapter implementation
      sendMessage: async (content) => {
        const { addMessage, setStreaming, getCurrentAdapter } = get()
        const connectionStore = useConnectionStore.getState()
        const activeConnection = connectionStore.getActiveConnection()
        
        if (!activeConnection) {
          addMessage({
            id: generateId(),
            role: 'assistant',
            content: 'No active connection. Please connect to a protocol first.',
            status: 'error'
          })
          return
        }

        // Add user message
        const userMessage: Omit<Message, 'timestamp'> = {
          id: generateId(),
          role: 'user',
          content,
          status: 'sent'
        }
        addMessage(userMessage)

        try {
          const adapter = getCurrentAdapter()
          if (!adapter || !adapter.isConnected()) {
            throw new Error('Protocol adapter not connected')
          }

          setStreaming(true)
          const assistantId = generateId()
          
          // Add empty assistant message for streaming
          addMessage({
            id: assistantId,
            role: 'assistant',
            content: '',
            isStreaming: true
          })

          // Try streaming first, fall back to regular message if not supported
          try {
            for await (const message of adapter.sendMessageStream(content)) {
              get().updateMessage(assistantId, {
                content: message.content,
                isStreaming: true
              })
            }
            
            // Mark as complete
            get().updateMessage(assistantId, {
              isStreaming: false
            })
          } catch (streamError) {
            // Fall back to non-streaming
            const response = await adapter.sendMessage(content)
            get().updateMessage(assistantId, {
              content: response.content,
              isStreaming: false
            })
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          addMessage({
            id: generateId(),
            role: 'assistant',
            content: `Error: ${errorMessage}`,
            status: 'error'
          })
        } finally {
          setStreaming(false)
        }
      },

      connect: async () => {
        const { setConnected, setAvailableTools } = get()
        const connectionStore = useConnectionStore.getState()
        const activeConnection = connectionStore.getActiveConnection()
        
        if (!activeConnection) {
          console.warn('No active connection to connect to')
          return
        }

        try {
          // Create protocol adapter
          const adapter = ProtocolAdapterFactory.create(activeConnection)
          
          // Update connection status in connection store
          connectionStore.updateConnectionStatus(activeConnection.id, 'connecting')
          
          // Connect using the adapter
          await adapter.connect()
          
          // Cache the adapter and update state
          set({ currentAdapter: adapter } as any, false, 'setCurrentAdapter')
          setConnected(true)
          
          // Update connection status to connected
          connectionStore.updateConnectionStatus(activeConnection.id, 'connected')
          
          // Fetch available tools
          const tools = await adapter.getAvailableTools()
          setAvailableTools(tools)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed'
          console.error('Connection error:', errorMessage)
          
          // Update connection status to error
          connectionStore.updateConnectionStatus(activeConnection.id, 'error', errorMessage)
          
          setConnected(false)
          throw error
        }
      },

      disconnect: async () => {
        const { currentAdapter } = get() as any
        const connectionStore = useConnectionStore.getState()
        const activeConnection = connectionStore.getActiveConnection()
        
        try {
          if (currentAdapter) {
            await currentAdapter.disconnect()
          }
        } catch (error) {
          console.error('Disconnect error:', error)
        } finally {
          set({
            isConnected: false,
            availableTools: [],
            activeToolCalls: [],
            currentAdapter: null
          } as any, false, 'disconnect')
          
          if (activeConnection) {
            connectionStore.updateConnectionStatus(activeConnection.id, 'disconnected')
          }
        }
      },

      // Tool actions
      setAvailableTools: (tools) => {
        set({ availableTools: tools }, false, 'setAvailableTools')
      },

      addToolCall: (toolCall) => {
        set((state) => ({
          activeToolCalls: [...state.activeToolCalls, toolCall]
        }), false, 'addToolCall')
      },

      updateToolCall: (id, update) => {
        set((state) => ({
          activeToolCalls: state.activeToolCalls.map(call =>
            call.id === id ? { ...call, ...update } : call
          )
        }), false, 'updateToolCall')
      },

      // Protocol adapter management
      getCurrentAdapter: () => {
        const state = get() as any
        return state.currentAdapter
      }
    }),
    {
      name: 'chat-store'
    }
  )
)