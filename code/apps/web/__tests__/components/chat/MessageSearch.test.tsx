import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageSearch } from '@/components/chat/MessageSearch'
import type { Message } from '@/lib/types'

// Mock messages for testing
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello, how are you today?',
    timestamp: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you for asking! How can I help you?',
    timestamp: new Date('2024-01-01T10:01:00Z')
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you help me with React components?',
    timestamp: new Date('2024-01-01T10:02:00Z')
  },
  {
    id: '4',
    role: 'assistant',
    content: 'Of course! React components are the building blocks of React applications. What specific aspect would you like help with?',
    timestamp: new Date('2024-01-01T10:03:00Z')
  },
  {
    id: '5',
    role: 'user',
    content: 'I need help with state management',
    timestamp: new Date('2024-01-01T10:04:00Z')
  }
]

const mockOnResultSelect = vi.fn()
const mockOnClose = vi.fn()

describe('MessageSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render search input field', () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByPlaceholderText(/search messages/i)).toBeInTheDocument()
    })

    it('should render search icon', () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('button', { name: /close search/i })).toBeInTheDocument()
    })

    it('should show results count when there are matches', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        expect(screen.getByText(/2 of 3 results/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should search for messages containing query text', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        // Should find 3 messages containing 'help'
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })
    })

    it('should perform case-insensitive search', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'REACT')

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 results/i)).toBeInTheDocument()
      })
    })

    it('should show no results for non-matching query', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })

    it('should clear results when search query is empty', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })

      await userEvent.clear(searchInput)

      await waitFor(() => {
        expect(screen.queryByText(/results/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation Controls', () => {
    it('should navigate to next result when next button clicked', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('button', { name: /next result/i })
      await userEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/2 of 3 results/i)).toBeInTheDocument()
      })
    })

    it('should navigate to previous result when previous button clicked', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      // Go to next result first
      const nextButton = screen.getByRole('button', { name: /next result/i })
      await userEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/2 of 3 results/i)).toBeInTheDocument()
      })

      // Then go back to previous
      const prevButton = screen.getByRole('button', { name: /previous result/i })
      await userEvent.click(prevButton)

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })
    })

    it('should wrap around when navigating past last result', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      const nextButton = screen.getByRole('button', { name: /next result/i })

      // Go to last result (3rd)
      await userEvent.click(nextButton)
      await userEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/3 of 3 results/i)).toBeInTheDocument()
      })

      // Click next again should wrap to first
      await userEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate to next result on ArrowDown', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

      await waitFor(() => {
        expect(screen.getByText(/2 of 3 results/i)).toBeInTheDocument()
      })
    })

    it('should navigate to previous result on ArrowUp', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      // Navigate to second result first
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

      await waitFor(() => {
        expect(screen.getByText(/2 of 3 results/i)).toBeInTheDocument()
      })

      // Then navigate back
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' })

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })
    })

    it('should close search on Escape', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      fireEvent.keyDown(searchInput, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledOnce()
    })

    it('should select current result on Enter', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        expect(screen.getByText(/1 of 3 results/i)).toBeInTheDocument()
      })

      fireEvent.keyDown(searchInput, { key: 'Enter' })

      expect(mockOnResultSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          content: expect.stringContaining('help')
        })
      )
    })
  })

  describe('Filter Options', () => {
    it('should filter by message role', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
          showFilters={true}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      // Open filter dropdown
      const filterButton = screen.getByRole('button', { name: /filter/i })
      await userEvent.click(filterButton)

      // Select user messages only
      const userFilter = screen.getByRole('option', { name: /user messages/i })
      await userEvent.click(userFilter)

      await waitFor(() => {
        // Should only find user messages containing 'help'
        expect(screen.getByText(/1 of 2 results/i)).toBeInTheDocument()
      })
    })

    it('should filter by assistant messages', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
          showFilters={true}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      const filterButton = screen.getByRole('button', { name: /filter/i })
      await userEvent.click(filterButton)

      const assistantFilter = screen.getByRole('option', { name: /assistant messages/i })
      await userEvent.click(assistantFilter)

      await waitFor(() => {
        // Should only find assistant messages containing 'help'
        expect(screen.getByText(/1 of 1 results/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/search messages/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close search/i })).toBeInTheDocument()
    })

    it('should announce search results to screen readers', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, 'help')

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/3 results found/i)
      })
    })

    it('should support screen reader navigation', async () => {
      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      expect(searchInput).toHaveAttribute('role', 'searchbox')
      expect(searchInput).toHaveAttribute('aria-label', 'Search messages')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty messages array', () => {
      render(
        <MessageSearch
          messages={[]}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByPlaceholderText(/search messages/i)).toBeInTheDocument()
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000)

      render(
        <MessageSearch
          messages={mockMessages}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, longQuery)

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })

    it('should handle special characters in search', async () => {
      render(
        <MessageSearch
          messages={[{
            id: '1',
            role: 'user',
            content: 'Hello! How are you? (I hope well)',
            timestamp: new Date()
          }]}
          onResultSelect={mockOnResultSelect}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await userEvent.type(searchInput, '(I hope')

      await waitFor(() => {
        expect(screen.getByText(/1 of 1 results/i)).toBeInTheDocument()
      })
    })
  })
})