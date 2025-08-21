'use client'

import { Badge } from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConnectionSelector } from '../connections/ConnectionSelector'
import { useChatStore } from './ChatProvider'
import { useConnectionStore } from '@/lib/stores/connections'
import { Menu, Search, Settings, Home, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export function ChatHeader() {
  const { messages } = useChatStore()
  const { getActiveConnection } = useConnectionStore()

  const messageCount = messages.length
  const activeConnection = getActiveConnection()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <div className="flex items-center justify-between">
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
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/chat" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Chat</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/discovery" className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  <span>Discovery</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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