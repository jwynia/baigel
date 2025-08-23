'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea, Button } from '@/components/ui'
import { MessageBubble } from './MessageBubble'
import { useChatStore } from './ChatProvider'
import { useConnectionStore } from '@/lib/stores/connections'
import { Bot, Plus, Search, Wrench, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function MessageList() {
  const { messages } = useChatStore()
  const { connections } = useConnectionStore()
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
    // Check if user has any connections configured
    const hasConnections = connections && connections.length > 0
    
    if (!hasConnections) {
      // No connections - guide user to set them up
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Bot className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                No AI Agents Connected
              </h3>
              <p className="text-muted-foreground">
                You need to connect an AI agent or tool before you can start chatting.
                Choose one of the options below to get started.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/discovery" className="block">
                <Button className="w-full" size="lg">
                  <Search className="h-5 w-5 mr-2" />
                  Discover Available Agents
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/workflows" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <Wrench className="h-5 w-5 mr-2" />
                  Browse Workflow Tools
                </Button>
              </Link>
              
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Connection Manually
                </Button>
              </Link>
            </div>

            <div className="text-xs text-muted-foreground pt-4">
              <p>Popular options include:</p>
              <p className="mt-1">OpenAI GPT-4 • Claude • Local Ollama • MCP Servers</p>
            </div>
          </div>
        </div>
      )
    }
    
    // Has connections - show normal empty state
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