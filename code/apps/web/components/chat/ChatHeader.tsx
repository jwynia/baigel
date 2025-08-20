'use client'

import { Badge } from '@/components/ui'
import { ProtocolSelector } from '../protocols/ProtocolSelector'
import { ConnectionStatus } from '../connection/ConnectionStatus'
import { useChatStore } from './ChatProvider'

export function ChatHeader() {
  const { activeProtocol, isConnected, messages } = useChatStore()

  const messageCount = messages.length

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold">BAIGEL Agent Chat</h1>
            <p className="text-sm text-muted-foreground">
              Protocol-agnostic AI agent interface
            </p>
          </div>
          
          {messageCount > 0 && (
            <Badge variant="secondary">
              {messageCount} message{messageCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ProtocolSelector />
          <ConnectionStatus />
        </div>
      </div>
    </header>
  )
}