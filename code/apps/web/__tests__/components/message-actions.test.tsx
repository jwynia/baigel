import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageActions } from '@/components/chat/MessageActions'
import type { Message } from '@/lib/types'

const mockMessage: Message = {
  id: 'msg-123',
  role: 'assistant',
  content: 'This is a test message',
  timestamp: new Date('2025-01-01T12:00:00Z')
}

const mockUserMessage: Message = {
  id: 'msg-456',
  role: 'user',
  content: 'This is a user message',
  timestamp: new Date('2025-01-01T12:01:00Z')
}

describe('MessageActions Component', () => {
  const mockOnCopy = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnRegenerate = vi.fn()
  const mockOnReply = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  describe('Basic Rendering', () => {
    it('should render trigger button', () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      expect(screen.getByRole('button', { name: /message actions/i })).toBeInTheDocument()
    })

    it('should open dropdown when trigger is clicked', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('should close dropdown when clicking outside', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      await user.click(document.body)
      
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('Copy Action', () => {
    it('should show copy option in dropdown', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.getByRole('menuitem', { name: /copy/i })).toBeInTheDocument()
    })

    it('should call onCopy when copy is clicked', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const copyItem = screen.getByRole('menuitem', { name: /copy/i })
      await user.click(copyItem)
      
      expect(mockOnCopy).toHaveBeenCalledTimes(1)
    })

    it('should copy to clipboard and show success feedback', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const copyItem = screen.getByRole('menuitem', { name: /copy/i })
      await user.click(copyItem)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMessage.content)
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
    })

    it('should handle clipboard error gracefully', async () => {
      const clipboardError = new Error('Clipboard not available')
      navigator.clipboard.writeText = vi.fn().mockRejectedValue(clipboardError)
      
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const copyItem = screen.getByRole('menuitem', { name: /copy/i })
      await user.click(copyItem)
      
      expect(screen.getByText(/copy failed/i)).toBeInTheDocument()
    })
  })

  describe('Edit Action', () => {
    it('should show edit option for user messages', async () => {
      render(
        <MessageActions
          message={mockUserMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canEdit={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    })

    it('should not show edit option when canEdit is false', async () => {
      render(
        <MessageActions
          message={mockUserMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canEdit={false}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument()
    })

    it('should call onEdit when edit is clicked', async () => {
      render(
        <MessageActions
          message={mockUserMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canEdit={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const editItem = screen.getByRole('menuitem', { name: /edit/i })
      await user.click(editItem)
      
      expect(mockOnEdit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Delete Action', () => {
    it('should show delete option when canDelete is true', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
    })

    it('should show confirmation dialog when delete is clicked', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteItem)
      
      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should call onDelete when deletion is confirmed', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteItem)
      
      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmBtn)
      
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('should not call onDelete when deletion is cancelled', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteItem)
      
      const cancelBtn = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelBtn)
      
      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('Regenerate Action', () => {
    it('should show regenerate option for assistant messages', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.getByRole('menuitem', { name: /regenerate/i })).toBeInTheDocument()
    })

    it('should not show regenerate option for user messages', async () => {
      render(
        <MessageActions
          message={mockUserMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.queryByRole('menuitem', { name: /regenerate/i })).not.toBeInTheDocument()
    })

    it('should call onRegenerate when regenerate is clicked', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const regenerateItem = screen.getByRole('menuitem', { name: /regenerate/i })
      await user.click(regenerateItem)
      
      expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Reply Action', () => {
    it('should show reply option', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(screen.getByRole('menuitem', { name: /reply/i })).toBeInTheDocument()
    })

    it('should call onReply when reply is clicked', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const replyItem = screen.getByRole('menuitem', { name: /reply/i })
      await user.click(replyItem)
      
      expect(mockOnReply).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should support Ctrl+C for copy', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      // Focus the component
      const trigger = screen.getByRole('button', { name: /message actions/i })
      trigger.focus()
      
      await user.keyboard('{Control>}c{/Control}')
      
      expect(mockOnCopy).toHaveBeenCalledTimes(1)
    })

    it('should support Delete key for delete action', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      trigger.focus()
      
      await user.keyboard('{Delete}')
      
      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument()
    })

    it('should support R key for regenerate', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      trigger.focus()
      
      await user.keyboard('r')
      
      expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when menu opens', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('should support keyboard navigation in menu', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /copy/i })).toHaveFocus()
      
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /reply/i })).toHaveFocus()
    })

    it('should close menu with Escape key', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      await user.keyboard('{Escape}')
      
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('Undo Functionality', () => {
    it('should show undo option after destructive action', async () => {
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteItem)
      
      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmBtn)
      
      expect(screen.getByText(/undo/i)).toBeInTheDocument()
    })

    it('should auto-hide undo after timeout', async () => {
      vi.useFakeTimers()
      
      render(
        <MessageActions
          message={mockMessage}
          onCopy={mockOnCopy}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRegenerate={mockOnRegenerate}
          onReply={mockOnReply}
          canDelete={true}
        />
      )
      
      const trigger = screen.getByRole('button', { name: /message actions/i })
      await user.click(trigger)
      
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteItem)
      
      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmBtn)
      
      vi.advanceTimersByTime(5000)
      
      await waitFor(() => {
        expect(screen.queryByText(/undo/i)).not.toBeInTheDocument()
      })
      
      vi.useRealTimers()
    })
  })
})