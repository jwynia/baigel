import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChatState, Message, ProtocolType, Tool, ToolCall, ConnectionConfig } from '@/lib/types'
import { useConnectionStore } from './connections'

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

      // Mock implementation for now - will be replaced with actual protocol adapters
      sendMessage: async (content) => {
        const { addMessage, setStreaming } = get()
        const connectionStore = useConnectionStore.getState()
        const activeConnection = connectionStore.getActiveConnection()
        
        // Add user message
        const userMessage: Omit<Message, 'timestamp'> = {
          id: generateId(),
          role: 'user',
          content,
          status: 'sent'
        }
        addMessage(userMessage)

        // Mock assistant response
        setStreaming(true)
        const assistantId = generateId()
        
        // Add empty assistant message
        addMessage({
          id: assistantId,
          role: 'assistant',
          content: '',
          isStreaming: true
        })

        // Simulate streaming response with connection info
        const connectionInfo = activeConnection 
          ? `${activeConnection.name} (${activeConnection.protocol.toUpperCase()})`
          : 'no active connection'
        const mockResponse = `I received your message: "${content}". This is a mock response from ${connectionInfo}.`
        
        for (let i = 0; i <= mockResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20))
          get().updateMessage(assistantId, {
            content: mockResponse.slice(0, i),
            isStreaming: i < mockResponse.length
          })
        }

        setStreaming(false)
      },

      connect: async () => {
        const { setConnected } = get()
        const connectionStore = useConnectionStore.getState()
        const activeConnection = connectionStore.getActiveConnection()
        
        if (!activeConnection) {
          console.warn('No active connection to connect to')
          return
        }
        
        // Mock connection logic
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setConnected(true)
        
        // Mock available tools based on connection's protocol
        const mockTools: Tool[] = []
        
        switch (activeConnection.protocol) {
          case 'mcp':
            mockTools.push(
              { name: 'read_file', description: 'Read file contents', parameters: { path: 'string' } },
              { name: 'write_file', description: 'Write file contents', parameters: { path: 'string', content: 'string' } },
              { name: 'list_directory', description: 'List directory contents', parameters: { path: 'string' } }
            )
            break
          case 'openai':
            mockTools.push(
              { name: 'dall_e', description: 'Generate images', parameters: { prompt: 'string' } },
              { name: 'code_interpreter', description: 'Execute Python code', parameters: { code: 'string' } }
            )
            break
          case 'langchain':
            mockTools.push(
              { name: 'search', description: 'Search for information', parameters: { query: 'string' } },
              { name: 'calculator', description: 'Perform calculations', parameters: { expression: 'string' } },
              { name: 'weather', description: 'Get weather information', parameters: { location: 'string' } }
            )
            break
          default:
            mockTools.push(
              { name: 'generic_tool', description: 'Generic tool', parameters: { input: 'string' } }
            )
        }
        
        get().setAvailableTools(mockTools)
      },

      disconnect: async () => {
        set({
          isConnected: false,
          availableTools: [],
          activeToolCalls: []
        }, false, 'disconnect')
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
      }
    }),
    {
      name: 'chat-store'
    }
  )
)