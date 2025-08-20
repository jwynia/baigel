'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { ChatProvider } from '@/components/chat/ChatProvider'

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    </div>
  )
}