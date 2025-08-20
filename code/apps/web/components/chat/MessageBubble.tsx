'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, Badge } from '@/components/ui'
import { User, Bot, Clock, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [displayContent, setDisplayContent] = useState('')
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Handle streaming display for assistant messages
  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayContent(message.content)
      return
    }

    // Simulate typing effect for streaming messages
    let index = 0
    const interval = setInterval(() => {
      if (index < message.content.length) {
        setDisplayContent(message.content.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 10)

    return () => clearInterval(interval)
  }, [message.content, message.isStreaming])

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'sent':
        return <Check className="h-3 w-3 text-green-500" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />
      default:
        return null
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col space-y-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-3 py-2",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted border"
        )}>
          {message.type === 'tool' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {message.tool}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Tool execution
                </span>
              </div>
              
              {message.arguments && (
                <details className="text-xs">
                  <summary className="cursor-pointer">Arguments</summary>
                  <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(message.arguments, null, 2)}
                  </pre>
                </details>
              )}
              
              {message.result !== undefined && (
                <details className="text-xs">
                  <summary className="cursor-pointer">Result</summary>
                  <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                    {typeof message.result === 'string' 
                      ? message.result 
                      : JSON.stringify(message.result, null, 2)
                    }
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isAssistant ? (
                <>
                  <ReactMarkdown>{displayContent}</ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </>
              ) : (
                <p className="m-0">{displayContent}</p>
              )}
            </div>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-1 text-xs text-muted-foreground",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{formatTime(message.timestamp)}</span>
          {getStatusIcon()}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}