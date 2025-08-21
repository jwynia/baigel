'use client'

import { Badge } from '@/components/ui'
import { ConnectionSelector } from '../connections/ConnectionSelector'
import { useChatStore } from './ChatProvider'
import { useConnectionStore } from '@/lib/stores/connections'

export function ChatHeader() {
  const { messages } = useChatStore()
  const { getActiveConnection } = useConnectionStore()

  const messageCount = messages.length
  const activeConnection = getActiveConnection()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold">BAIGEL Agent Chat</h1>
            <p className="text-sm text-muted-foreground">
              {activeConnection 
                ? `Connected to ${activeConnection.name}` 
                : 'Protocol-agnostic AI agent interface'}
            </p>
          </div>
          
          {messageCount > 0 && (
            <Badge variant="secondary">
              {messageCount} message{messageCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ConnectionSelector />
        </div>
      </div>
    </header>
  )
}