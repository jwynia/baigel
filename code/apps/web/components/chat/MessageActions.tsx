'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  Copy, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Reply,
  AlertCircle,
  Check,
  Undo2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface MessageActionsProps {
  message: Message
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  onRegenerate: () => void
  onReply: () => void
  canEdit?: boolean
  canDelete?: boolean
}

export function MessageActions({
  message,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  onReply,
  canEdit = message.role === 'user',
  canDelete = true
}: MessageActionsProps) {
  const [open, setOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<'success' | 'error' | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when the component is focused
      if (document.activeElement?.closest('[data-message-actions]') !== document.querySelector(`[data-message-id="${message.id}"]`)) {
        return
      }

      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        handleCopy()
      } else if (e.key === 'Delete' && canDelete) {
        e.preventDefault()
        setDeleteConfirmOpen(true)
      } else if (e.key === 'r' && message.role === 'assistant') {
        e.preventDefault()
        handleRegenerate()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [message.id, message.role, canDelete])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopyFeedback('success')
      onCopy()
    } catch (err) {
      setCopyFeedback('error')
    }

    // Clear feedback after 2 seconds
    setTimeout(() => setCopyFeedback(null), 2000)
    setOpen(false)
  }, [message.content, onCopy])

  const handleEdit = useCallback(() => {
    onEdit()
    setOpen(false)
  }, [onEdit])

  const handleDelete = useCallback(() => {
    setDeleteConfirmOpen(true)
    setOpen(false)
  }, [])

  const confirmDelete = useCallback(() => {
    onDelete()
    setDeleteConfirmOpen(false)
    
    // Show undo option
    setShowUndo(true)
    const timeout = setTimeout(() => {
      setShowUndo(false)
    }, 5000)
    setUndoTimeout(timeout)
  }, [onDelete])

  const handleUndo = useCallback(() => {
    if (undoTimeout) {
      clearTimeout(undoTimeout)
      setUndoTimeout(null)
    }
    setShowUndo(false)
    // Note: Undo logic would need to be implemented by parent component
    // This is just the UI for undo functionality
  }, [undoTimeout])

  const handleRegenerate = useCallback(() => {
    onRegenerate()
    setOpen(false)
  }, [onRegenerate])

  const handleReply = useCallback(() => {
    onReply()
    setOpen(false)
  }, [onReply])

  return (
    <>
      <div data-message-actions data-message-id={message.id}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Message actions"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" role="menu">
            <DropdownMenuItem onClick={handleCopy} role="menuitem">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleReply} role="menuitem">
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </DropdownMenuItem>

            {canEdit && (
              <DropdownMenuItem onClick={handleEdit} role="menuitem">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}

            {message.role === 'assistant' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRegenerate} role="menuitem">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </DropdownMenuItem>
              </>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete} 
                  className="text-destructive focus:text-destructive"
                  role="menuitem"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Copy Feedback */}
      {copyFeedback && (
        <div 
          className={cn(
            "fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 flex items-center gap-2",
            copyFeedback === 'success' 
              ? "bg-green-100 border border-green-200 text-green-800" 
              : "bg-red-100 border border-red-200 text-red-800"
          )}
          role="status"
          aria-live="polite"
        >
          {copyFeedback === 'success' ? (
            <>
              <Check className="h-4 w-4" />
              Copied to clipboard
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              Copy failed
            </>
          )}
        </div>
      )}

      {/* Undo Notification */}
      {showUndo && (
        <div className="fixed bottom-4 left-4 p-3 bg-background border rounded-lg shadow-lg z-50 flex items-center gap-3">
          <span className="text-sm">Message deleted</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            className="h-7"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Undo
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm">
                  Are you sure you want to delete this message?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This action can be undone within 5 seconds.
                </p>
              </div>
            </div>
            <div className="bg-muted p-3 rounded text-xs text-muted-foreground max-h-32 overflow-y-auto">
              {message.content}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}