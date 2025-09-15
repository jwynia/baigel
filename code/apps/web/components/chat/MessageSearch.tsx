'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, ChevronUp, ChevronDown, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Message } from '@/lib/types'

interface MessageSearchProps {
  messages: Message[]
  onResultSelect: (message: Message) => void
  onClose: () => void
  showFilters?: boolean
}

type MessageRole = 'all' | 'user' | 'assistant'

interface SearchResult {
  message: Message
  index: number
}

export function MessageSearch({
  messages,
  onResultSelect,
  onClose,
  showFilters = false
}: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [roleFilter, setRoleFilter] = useState<MessageRole>('all')

  // Search functionality
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      return []
    }

    const queryLower = query.toLowerCase()
    const filtered = messages.filter((message, index) => {
      const matchesQuery = message.content.toLowerCase().includes(queryLower)
      const matchesRole = roleFilter === 'all' || message.role === roleFilter
      return matchesQuery && matchesRole
    })

    return filtered.map((message) => ({
      message,
      index: messages.findIndex(m => m.id === message.id)
    }))
  }, [messages, query, roleFilter])

  // Reset current result index when search results change
  useEffect(() => {
    setCurrentResultIndex(0)
  }, [searchResults])

  // Navigation functions
  const navigateToNext = useCallback(() => {
    if (searchResults.length === 0) return
    setCurrentResultIndex((prev) => (prev + 1) % searchResults.length)
  }, [searchResults.length])

  const navigateToPrevious = useCallback(() => {
    if (searchResults.length === 0) return
    setCurrentResultIndex((prev) =>
      prev === 0 ? searchResults.length - 1 : prev - 1
    )
  }, [searchResults.length])

  const selectCurrentResult = useCallback(() => {
    if (searchResults.length > 0 && searchResults[currentResultIndex]) {
      onResultSelect(searchResults[currentResultIndex].message)
    }
  }, [searchResults, currentResultIndex, onResultSelect])

  // Keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        navigateToNext()
        break
      case 'ArrowUp':
        e.preventDefault()
        navigateToPrevious()
        break
      case 'Enter':
        e.preventDefault()
        selectCurrentResult()
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [navigateToNext, navigateToPrevious, selectCurrentResult, onClose])

  // Results summary text
  const resultsSummary = useMemo(() => {
    if (!query.trim()) return ''
    if (searchResults.length === 0) return 'No results found'
    return `${currentResultIndex + 1} of ${searchResults.length} results`
  }, [query, searchResults.length, currentResultIndex])

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8 pr-4"
          aria-label="Search messages"
          role="searchbox"
          autoFocus
        />
      </div>

      {/* Filter Options */}
      {showFilters && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Filter">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => setRoleFilter('all')}
              role="option"
            >
              All messages
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setRoleFilter('user')}
              role="option"
            >
              User messages
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setRoleFilter('assistant')}
              role="option"
            >
              Assistant messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Navigation Controls */}
      {searchResults.length > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToPrevious}
            disabled={searchResults.length === 0}
            aria-label="Previous result"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToNext}
            disabled={searchResults.length === 0}
            aria-label="Next result"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Results Summary */}
      {query.trim() && (
        <div className="text-sm text-muted-foreground min-w-0 whitespace-nowrap">
          {resultsSummary}
        </div>
      )}

      {/* Results Status for Screen Readers */}
      {query.trim() && (
        <div className="sr-only" role="status" aria-live="polite">
          {searchResults.length > 0
            ? `${searchResults.length} results found`
            : 'No results found'
          }
        </div>
      )}

      {/* Close Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        aria-label="Close search"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Search Button (for accessibility) */}
      <Button
        variant="outline"
        size="sm"
        onClick={selectCurrentResult}
        disabled={searchResults.length === 0}
        aria-label="Search"
        className="hidden" // Hidden by default, but available for screen readers
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  )
}