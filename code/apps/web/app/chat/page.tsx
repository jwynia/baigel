'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { ChatProvider } from '@/components/chat/ChatProvider'
import { AppLayout } from '@/components/layout/AppLayout'

export default function ChatPage() {
  return (
    <AppLayout>
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    </AppLayout>
  )
}