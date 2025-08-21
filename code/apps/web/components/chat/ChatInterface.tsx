'use client'

import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChat, useChatStore } from './ChatProvider'
import { useConnectionStore } from '@/lib/stores/connections'

export function ChatInterface() {
  const { sendMessage } = useChat()
  const { isStreaming, isConnected } = useChatStore()
  const { getActiveConnection } = useConnectionStore()
  
  const activeConnection = getActiveConnection()
  const canSendMessage = activeConnection && activeConnection.status === 'connected' && !isStreaming

  const handleSendMessage = async (content: string) => {
    if (canSendMessage) {
      await sendMessage(content)
    }
  }

  const getPlaceholderText = () => {
    if (!activeConnection) {
      return "Select a connection to start chatting..."
    }
    if (activeConnection.status === 'connecting') {
      return "Connecting..."
    }
    if (activeConnection.status === 'error') {
      return "Connection error. Please check your settings..."
    }
    if (activeConnection.status === 'disconnected') {
      return "Connection disconnected. Click connect to start..."
    }
    if (isStreaming) {
      return "AI is responding..."
    }
    return "Type a message..."
  }

  return (
    <div 
      className="flex flex-col h-full bg-background"
      role="application"
      aria-label="AI Chat Interface"
    >
      <ChatHeader />
      
      <div className="flex-1 flex flex-col min-h-0">
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="flex-1"
        >
          <MessageList />
        </div>
        
        <div
          role="form"
          aria-label="Message input"
          className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <MessageInput 
            onSend={handleSendMessage}
            disabled={!canSendMessage}
            placeholder={getPlaceholderText()}
          />
        </div>
      </div>
    </div>
  )
}