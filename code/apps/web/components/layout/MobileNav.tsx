'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Menu, 
  Home, 
  MessageSquare, 
  Search, 
  Settings,
  Bot
} from 'lucide-react'
import { useConnectionStore } from '@/lib/stores/connections'
import { useChatStore } from '@/components/chat/ChatProvider'

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

export function MobileNav() {
  const pathname = usePathname()
  const { connections, getActiveConnection } = useConnectionStore()
  const { messages } = useChatStore()

  const activeConnection = getActiveConnection()
  const messageCount = messages.length

  return (
    <div className="flex h-16 items-center justify-between px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo and Menu */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} className="flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                    {item.name === 'Chat' && messageCount > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {messageCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">BAIGEL</span>
        </div>
      </div>

      {/* Connection Status (Mobile) */}
      <div className="flex items-center space-x-2">
        {activeConnection && (
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${
              activeConnection.status === 'connected' ? 'bg-green-500' :
              activeConnection.status === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="text-xs font-medium hidden sm:inline">
              {activeConnection.name}
            </span>
          </div>
        )}
        
        {connections.length > 0 && (
          <Badge variant="outline">
            {connections.filter(c => c.status === 'connected').length}/{connections.length}
          </Badge>
        )}
      </div>
    </div>
  )
}