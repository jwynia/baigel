'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui'
import { MessageBubble } from './MessageBubble'
import { useChatStore } from './ChatProvider'

export function MessageList() {
  const { messages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            Start a conversation
          </h3>
          <p className="text-sm text-muted-foreground">
            Send a message to begin chatting with the AI agent
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}
        <div ref={bottomRef} className="h-1" />
      </div>
    </ScrollArea>
  )
}