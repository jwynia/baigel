'use client'

import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChat, useChatStore } from './ChatProvider'

export function ChatInterface() {
  const { sendMessage } = useChat()
  const { isStreaming, isConnected } = useChatStore()

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
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
            disabled={!isConnected || isStreaming}
            placeholder={
              !isConnected 
                ? "Connecting..." 
                : isStreaming 
                  ? "AI is responding..." 
                  : "Type a message..."
            }
          />
        </div>
      </div>
    </div>
  )
}