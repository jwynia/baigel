'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  MessageSquare, 
  Search, 
  Settings, 
  Bot,
  Zap
} from 'lucide-react'
import { useConnectionStore } from '@/lib/stores/connections'
import { useChatStore } from '@/components/chat/ChatProvider'
import { ConnectionSelector } from '@/components/connections/ConnectionSelector'

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    name: 'Discovery',
    href: '/discovery',
    icon: Search,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { connections, getActiveConnection } = useConnectionStore()
  const { messages } = useChatStore()

  const activeConnection = getActiveConnection()
  const connectedCount = connections.filter(c => c.status === 'connected').length
  const messageCount = messages.length

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">BAIGEL</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
                {item.name === 'Chat' && messageCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {messageCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Connection Selector */}
      <div className="border-t px-3 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Connection</span>
            <Badge variant="outline">
              {connectedCount}/{connections.length}
            </Badge>
          </div>
          
          <div className="w-full">
            <ConnectionSelector />
          </div>
          
          {activeConnection && (
            <div className="flex items-center justify-center space-x-2 text-xs">
              <div className={cn(
                'h-2 w-2 rounded-full',
                activeConnection.status === 'connected' ? 'bg-green-500' :
                activeConnection.status === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              )} />
              <span className="text-muted-foreground">
                {activeConnection.status === 'connected' ? 'Connected' :
                 activeConnection.status === 'connecting' ? 'Connecting' :
                 'Disconnected'}
              </span>
              {activeConnection.tools && activeConnection.tools.length > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {activeConnection.tools.length} tools
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}