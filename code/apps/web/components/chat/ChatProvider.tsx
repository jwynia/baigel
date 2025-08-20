'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useChatStore } from '@/lib/stores/chat'
import type { ProtocolType } from '@/lib/types'

interface ChatContextType {
  // Re-export store methods for easier access
  sendMessage: (content: string) => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  setProtocol: (protocol: ProtocolType) => void
  clearMessages: () => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const {
    sendMessage,
    connect,
    disconnect,
    setProtocol,
    clearMessages
  } = useChatStore()

  // Initialize connection on mount
  useEffect(() => {
    // Auto-connect with default protocol
    connect()
  }, [connect])

  const contextValue: ChatContextType = {
    sendMessage,
    connect,
    disconnect,
    setProtocol,
    clearMessages
  }

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

// Also export store hook for direct access to state
export { useChatStore }