'use client'

import { Button, Badge } from '@/components/ui'
import { Plug, Power, RefreshCw } from 'lucide-react'
import { useChatStore, useChat } from '@/components/chat/ChatProvider'
import { cn } from '@/lib/utils'

export function ConnectionStatus() {
  const { isConnected, isStreaming, activeProtocol } = useChatStore()
  const { connect, disconnect } = useChat()

  const getStatusInfo = () => {
    if (isStreaming) {
      return {
        icon: RefreshCw,
        text: 'Streaming',
        variant: 'default' as const,
        className: 'animate-spin'
      }
    }
    
    if (isConnected) {
      return {
        icon: Plug,
        text: 'Connected',
        variant: 'default' as const,
        className: ''
      }
    }
    
    return {
      icon: Power,
      text: 'Disconnected',
      variant: 'destructive' as const,
      className: ''
    }
  }

  const handleToggleConnection = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      await connect()
    }
  }

  const status = getStatusInfo()
  const Icon = status.icon

  return (
    <div className="flex items-center gap-2">
      <Badge variant={status.variant} className="flex items-center gap-1">
        <Icon className={cn("h-3 w-3", status.className)} />
        {status.text}
      </Badge>

      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleConnection}
        disabled={isStreaming}
        className="h-8"
      >
        {isConnected ? (
          <>
            <Power className="h-4 w-4 mr-1" />
            Disconnect
          </>
        ) : (
          <>
            <Plug className="h-4 w-4 mr-1" />
            Connect
          </>
        )}
      </Button>

      {/* Protocol indicator */}
      <Badge variant="outline" className="text-xs">
        {activeProtocol.toUpperCase()}
      </Badge>
    </div>
  )
}