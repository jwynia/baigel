'use client'

import React, { useEffect, useCallback, useRef } from 'react'
import { useChatHistoryStore } from '@/lib/stores/chat-history'
import type { ChatHistoryProps, Conversation } from '@/lib/types/chat-history'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  X,
  Download,
  Archive,
  Trash2,
  MoreHorizontal,
  Loader2,
  MessageSquare,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: (conversation: Conversation) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  showActions?: boolean
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onArchive,
  onDelete,
  showActions = true
}) => {
  const [showActionsMenu, setShowActionsMenu] = React.useState(false)

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60)
        return `${Math.floor(diffInMinutes)} minutes ago`
      }
      return `${Math.floor(diffInHours)} hours ago`
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div
      data-testid={`conversation-${conversation.id}`}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50',
        isSelected && 'bg-accent border-primary'
      )}
      onClick={() => onSelect(conversation)}
      onMouseEnter={() => setShowActionsMenu(true)}
      onMouseLeave={() => setShowActionsMenu(false)}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(conversation)
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {conversation.protocol}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {conversation.messageCount} messages
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(conversation.lastMessageAt)}
          </span>
        </div>
      </div>

      {showActions && showActionsMenu && (
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onArchive(conversation.id)
            }}
            aria-label="Archive conversation"
            className="h-8 w-8 p-0"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(conversation.id)
            }}
            aria-label="Delete conversation"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  onConversationSelect,
  onConversationCreate,
  showCreateButton = true,
  showExportButton = true,
  showArchiveToggle = true,
  maxHeight = '600px',
  className
}) => {
  const {
    conversations,
    filteredConversations,
    selectedConversation,
    searchQuery,
    isLoading,
    error,
    showArchived,

    loadConversations,
    setSearchQuery,
    setSelectedConversation,
    archiveConversation,
    deleteConversation,
    exportConversations,
    exportConversation,
    toggleShowArchived,
    clearError
  } = useChatHistoryStore()

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with Ctrl+F
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // Delete selected conversation with Delete key
      if (e.key === 'Delete' && selectedConversation) {
        e.preventDefault()
        handleDeleteConversation(selectedConversation.id)
        return
      }

      // Handle arrow navigation when list is focused
      if (listRef.current?.contains(document.activeElement)) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIndex = Math.min(selectedIndex + 1, filteredConversations.length - 1)
          setSelectedIndex(nextIndex)
          if (filteredConversations[nextIndex]) {
            setSelectedConversation(filteredConversations[nextIndex])
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prevIndex = Math.max(selectedIndex - 1, 0)
          setSelectedIndex(prevIndex)
          if (filteredConversations[prevIndex]) {
            setSelectedConversation(filteredConversations[prevIndex])
          }
        } else if (e.key === 'Enter' && selectedConversation) {
          e.preventDefault()
          onConversationSelect?.(selectedConversation)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filteredConversations, selectedConversation, setSelectedConversation, onConversationSelect])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [setSearchQuery])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }, [setSearchQuery])

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation)
    const index = filteredConversations.findIndex(c => c.id === conversation.id)
    setSelectedIndex(index)
    onConversationSelect?.(conversation)
  }, [setSelectedConversation, filteredConversations, onConversationSelect])

  const handleArchiveConversation = useCallback(async (id: string) => {
    try {
      await archiveConversation(id)
    } catch (error) {
      console.error('Failed to archive conversation:', error)
    }
  }, [archiveConversation])

  const handleDeleteConversation = useCallback((id: string) => {
    setConversationToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete)
        setDeleteDialogOpen(false)
        setConversationToDelete(null)
      } catch (error) {
        console.error('Failed to delete conversation:', error)
      }
    }
  }, [conversationToDelete, deleteConversation])

  const handleExport = useCallback(async (format: 'json' | 'markdown' | 'csv' | 'txt') => {
    try {
      const exported = await exportConversations(format)
      const blob = new Blob([exported], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-history.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export conversations:', error)
    }
  }, [exportConversations])

  const handleExportSelected = useCallback(async () => {
    if (selectedConversation) {
      try {
        const exported = await exportConversation(selectedConversation.id, 'json')
        const blob = new Blob([exported], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to export conversation:', error)
      }
    }
  }, [selectedConversation, exportConversation])

  // Virtual scrolling for large lists
  const shouldUseVirtualization = filteredConversations.length > 100

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Chat History</CardTitle>
          <div className="flex items-center gap-2">
            {showArchiveToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleShowArchived}
                className="text-xs"
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            )}
            {showExportButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Export">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('json')} role="menuitem">
                    Export All as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('markdown')} role="menuitem">
                    Export All as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')} role="menuitem">
                    Export All as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('txt')} role="menuitem">
                    Export All as Text
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleExportSelected}
                    disabled={!selectedConversation}
                    aria-disabled={!selectedConversation}
                    role="menuitem"
                  >
                    Export Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showCreateButton && (
              <Button size="sm" onClick={onConversationCreate}>
                New Chat
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Search conversations"
            role="searchbox"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div
          className="space-y-1"
          style={{ maxHeight }}
          role="region"
          aria-label="Chat history"
        >
          {/* Live announcements for screen readers */}
          <div
            role="status"
            aria-live="polite"
            aria-label="Live announcements"
            className="sr-only"
          >
            {isLoading && 'Loading conversations...'}
            {error && `Error: ${error}`}
            {!isLoading && !error && `${filteredConversations.length} conversations found`}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-spinner" />
                <span>Loading...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Failed to load conversations</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError()
                  loadConversations()
                }}
                aria-label="Retry"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && filteredConversations.length === 0 && searchQuery === '' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-sm mb-1">No conversations yet</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Start a new conversation to see your chat history here
                </p>
                {showCreateButton && (
                  <Button size="sm" onClick={onConversationCreate}>
                    Start New Conversation
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* No search results */}
          {!isLoading && !error && filteredConversations.length === 0 && searchQuery !== '' && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-sm mb-1">No conversations found</h3>
                <p className="text-xs text-muted-foreground">
                  Try a different search term or clear your search
                </p>
              </div>
            </div>
          )}

          {/* Conversation list */}
          {!isLoading && !error && filteredConversations.length > 0 && (
            <ScrollArea style={{ height: maxHeight }}>
              <div
                ref={listRef}
                className="space-y-2"
                role="list"
                aria-label="Conversations"
                tabIndex={0}
                data-testid={shouldUseVirtualization ? "virtual-conversation-list" : "conversation-list"}
              >
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={handleConversationSelect}
                    onArchive={handleArchiveConversation}
                    onDelete={handleDeleteConversation}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent role="dialog" aria-label="Delete conversation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              aria-label="Confirm delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}