import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatHistory } from '@/components/chat/ChatHistory'
import { useChatHistoryStore } from '@/lib/stores/chat-history'
import type { Conversation } from '@/lib/types/chat-history'

// Mock the store
vi.mock('@/lib/stores/chat-history', () => ({
  useChatHistoryStore: vi.fn()
}))

const mockStore = {
  conversations: [],
  filteredConversations: [],
  searchQuery: '',
  isLoading: false,
  selectedConversation: null,

  // Actions
  loadConversations: vi.fn(),
  createConversation: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
  archiveConversation: vi.fn(),
  restoreConversation: vi.fn(),
  setSearchQuery: vi.fn(),
  setSelectedConversation: vi.fn(),
  exportConversations: vi.fn(),
  exportConversation: vi.fn()
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'First conversation',
    protocol: 'openai',
    messageCount: 5,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    lastMessageAt: new Date('2024-01-01T10:30:00Z'),
    isArchived: false,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date('2024-01-01T10:30:00Z')
      }
    ]
  },
  {
    id: '2',
    title: 'Development help',
    protocol: 'mcp',
    messageCount: 12,
    createdAt: new Date('2024-01-02T14:00:00Z'),
    lastMessageAt: new Date('2024-01-02T15:45:00Z'),
    isArchived: false,
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'How do I implement a React component?',
        timestamp: new Date('2024-01-02T14:00:00Z')
      }
    ]
  },
  {
    id: '3',
    title: 'Archived conversation',
    protocol: 'a2a',
    messageCount: 3,
    createdAt: new Date('2024-01-03T09:00:00Z'),
    lastMessageAt: new Date('2024-01-03T09:15:00Z'),
    isArchived: true,
    messages: []
  }
]

describe('ChatHistory', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useChatHistoryStore as any).mockReturnValue({
      ...mockStore,
      conversations: mockConversations,
      filteredConversations: mockConversations.filter(c => !c.isArchived)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the chat history component', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: [],
        filteredConversations: [],
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      expect(screen.getByRole('region', { name: /chat history/i })).toBeInTheDocument()
      expect(screen.getByRole('searchbox', { name: /search conversations/i })).toBeInTheDocument()
    })

    it('should display conversation list when conversations exist', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      expect(screen.getByText('First conversation')).toBeInTheDocument()
      expect(screen.getByText('Development help')).toBeInTheDocument()
      expect(screen.queryByText('Archived conversation')).not.toBeInTheDocument()
    })

    it('should show empty state when no conversations exist', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: [],
        filteredConversations: []
      })

      render(<ChatHistory />)

      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument()
      expect(screen.getByText(/start a new conversation/i)).toBeInTheDocument()
    })

    it('should show loading state', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        isLoading: true,
        conversations: [],
        filteredConversations: []
      })

      render(<ChatHistory />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      // Check for the visible loading text (not the screen reader text)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      // Check for screen reader announcement
      expect(screen.getByText('Loading conversations...')).toBeInTheDocument()
    })
  })

  describe('Conversation Display', () => {
    it('should display conversation metadata correctly', () => {
      render(<ChatHistory />)

      const firstConversation = screen.getByTestId('conversation-1')
      expect(firstConversation).toHaveTextContent('First conversation')
      expect(firstConversation).toHaveTextContent('5 messages')
      expect(firstConversation).toHaveTextContent('openai')
      expect(firstConversation).toHaveTextContent('Jan 1, 2024')
    })

    it('should show relative time for recent conversations', () => {
      const recentConversation: Conversation = {
        ...mockConversations[0],
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }

      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: [recentConversation],
        filteredConversations: [recentConversation]
      })

      render(<ChatHistory />)

      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument()
    })

    it('should highlight selected conversation', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        selectedConversation: mockConversations[0]
      })

      render(<ChatHistory />)

      const selectedItem = screen.getByTestId('conversation-1')
      expect(selectedItem).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Search Functionality', () => {
    it('should update search query when typing in search input', async () => {
      render(<ChatHistory />)

      const searchInput = screen.getByRole('searchbox', { name: /search conversations/i })
      await user.type(searchInput, 'development')

      // Check that the final call was with the complete word
      expect(mockStore.setSearchQuery).toHaveBeenLastCalledWith('development')
    })

    it('should filter conversations based on search query', () => {
      const filteredConversations = [mockConversations[1]]
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations,
        searchQuery: 'development'
      })

      render(<ChatHistory />)

      expect(screen.getByText('Development help')).toBeInTheDocument()
      expect(screen.queryByText('First conversation')).not.toBeInTheDocument()
    })

    it('should show no results message when search yields no matches', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: [],
        searchQuery: 'nonexistent'
      })

      render(<ChatHistory />)

      expect(screen.getByText(/no conversations found/i)).toBeInTheDocument()
      expect(screen.getByText(/try a different search term/i)).toBeInTheDocument()
    })

    it('should clear search when clear button is clicked', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        searchQuery: 'development'
      })

      render(<ChatHistory />)

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(mockStore.setSearchQuery).toHaveBeenCalledWith('')
    })
  })

  describe('Archive/Delete Functionality', () => {
    it('should show archive button on conversation hover', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      const conversation = screen.getByTestId('conversation-1')
      await user.hover(conversation)

      expect(screen.getByRole('button', { name: /archive conversation/i })).toBeInTheDocument()
    })

    it('should archive conversation when archive button is clicked', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      const conversation = screen.getByTestId('conversation-1')
      await user.hover(conversation)

      const archiveButton = screen.getByRole('button', { name: /archive conversation/i })
      await user.click(archiveButton)

      expect(mockStore.archiveConversation).toHaveBeenCalledWith('1')
    })

    it('should show delete confirmation dialog when delete is clicked', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      const conversation = screen.getByTestId('conversation-1')
      await user.hover(conversation)

      const deleteButton = screen.getByRole('button', { name: /delete conversation/i })
      await user.click(deleteButton)

      expect(screen.getByRole('dialog', { name: /delete conversation/i })).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    })

    it('should delete conversation when confirmed', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      const conversation = screen.getByTestId('conversation-1')
      await user.hover(conversation)

      const deleteButton = screen.getByRole('button', { name: /delete conversation/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      expect(mockStore.deleteConversation).toHaveBeenCalledWith('1')
    })

    it('should cancel delete when cancel is clicked', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        isLoading: false,
        error: null
      })

      render(<ChatHistory />)

      const conversation = screen.getByTestId('conversation-1')
      await user.hover(conversation)

      const deleteButton = screen.getByRole('button', { name: /delete conversation/i })
      await user.click(deleteButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockStore.deleteConversation).not.toHaveBeenCalled()
    })
  })

  describe('Export Functionality', () => {
    it('should show export options in dropdown menu', async () => {
      render(<ChatHistory />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(screen.getByRole('menuitem', { name: /export all as json/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /export all as markdown/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /export selected/i })).toBeInTheDocument()
    })

    it('should export all conversations as JSON', async () => {
      render(<ChatHistory />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      const jsonExportOption = screen.getByRole('menuitem', { name: /export all as json/i })
      await user.click(jsonExportOption)

      expect(mockStore.exportConversations).toHaveBeenCalledWith('json')
    })

    it('should export single conversation when selected', async () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        selectedConversation: mockConversations[0]
      })

      render(<ChatHistory />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      const selectedExportOption = screen.getByRole('menuitem', { name: /export selected/i })
      await user.click(selectedExportOption)

      expect(mockStore.exportConversation).toHaveBeenCalledWith('1', 'json')
    })

    it('should disable export selected when no conversation is selected', async () => {
      render(<ChatHistory />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      const selectedExportOption = screen.getByRole('menuitem', { name: /export selected/i })
      expect(selectedExportOption).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate conversations with arrow keys', async () => {
      render(<ChatHistory />)

      const conversationList = screen.getByRole('list', { name: /conversations/i })
      conversationList.focus()

      await user.keyboard('{ArrowDown}')
      expect(mockStore.setSelectedConversation).toHaveBeenCalledWith(mockConversations[0])

      await user.keyboard('{ArrowDown}')
      expect(mockStore.setSelectedConversation).toHaveBeenCalledWith(mockConversations[1])

      await user.keyboard('{ArrowUp}')
      expect(mockStore.setSelectedConversation).toHaveBeenCalledWith(mockConversations[0])
    })

    it('should support keyboard shortcuts', async () => {
      render(<ChatHistory />)

      // Focus search with Ctrl+F
      await user.keyboard('{Control>}f{/Control}')
      expect(screen.getByRole('searchbox')).toHaveFocus()

      // Delete selected conversation with Delete key
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        selectedConversation: mockConversations[0]
      })

      await user.keyboard('{Delete}')
      expect(screen.getByRole('dialog', { name: /delete conversation/i })).toBeInTheDocument()
    })

    it('should handle Enter key to open conversation', async () => {
      const onConversationSelect = vi.fn()
      render(<ChatHistory onConversationSelect={onConversationSelect} />)

      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: mockConversations,
        filteredConversations: mockConversations.filter(c => !c.isArchived),
        selectedConversation: mockConversations[0]
      })

      await user.keyboard('{Enter}')
      expect(onConversationSelect).toHaveBeenCalledWith(mockConversations[0])
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ChatHistory />)

      const region = screen.getByRole('region', { name: /chat history/i })
      expect(region).toBeInTheDocument()

      const searchbox = screen.getByRole('searchbox', { name: /search conversations/i })
      expect(searchbox).toHaveAttribute('aria-label', 'Search conversations')

      const conversationList = screen.getByRole('list', { name: /conversations/i })
      expect(conversationList).toHaveAttribute('aria-label', 'Conversations')
    })

    it('should support screen reader announcements', () => {
      render(<ChatHistory />)

      const announcement = screen.getByRole('status', { name: /live announcements/i })
      expect(announcement).toBeInTheDocument()
      expect(announcement).toHaveAttribute('aria-live', 'polite')
    })

    it('should have proper focus management', async () => {
      render(<ChatHistory />)

      const searchInput = screen.getByRole('searchbox')
      await user.tab()
      expect(searchInput).toHaveFocus()

      await user.tab()
      const firstConversation = screen.getByTestId('conversation-1')
      expect(firstConversation).toHaveFocus()
    })

    it('should meet color contrast requirements', () => {
      render(<ChatHistory />)

      const conversations = screen.getAllByTestId(/conversation-/)
      conversations.forEach(conversation => {
        expect(conversation).toHaveClass('text-foreground')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle conversations with very long titles', () => {
      const longTitleConversation: Conversation = {
        ...mockConversations[0],
        title: 'This is a very long conversation title that should be truncated properly and not break the layout or cause any accessibility issues'
      }

      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: [longTitleConversation],
        filteredConversations: [longTitleConversation]
      })

      render(<ChatHistory />)

      const conversation = screen.getByTestId('conversation-1')
      expect(conversation).toHaveClass('truncate')
    })

    it('should handle conversations with zero messages', () => {
      const emptyConversation: Conversation = {
        ...mockConversations[0],
        messageCount: 0,
        messages: []
      }

      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: [emptyConversation],
        filteredConversations: [emptyConversation]
      })

      render(<ChatHistory />)

      expect(screen.getByText('0 messages')).toBeInTheDocument()
    })

    it('should handle rapid search input changes', async () => {
      render(<ChatHistory />)

      const searchInput = screen.getByRole('searchbox')

      // Type rapidly
      await user.type(searchInput, 'abc{backspace}{backspace}de')

      // Should debounce and only call with final value
      await waitFor(() => {
        expect(mockStore.setSearchQuery).toHaveBeenLastCalledWith('ade')
      })
    })

    it('should handle store errors gracefully', () => {
      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: [],
        filteredConversations: [],
        error: 'Failed to load conversations',
        isLoading: false
      })

      render(<ChatHistory />)

      expect(screen.getByText(/failed to load conversations/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large conversation lists efficiently', () => {
      const largeConversationList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockConversations[0],
        id: `conversation-${i}`,
        title: `Conversation ${i}`
      }))

      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: largeConversationList,
        filteredConversations: largeConversationList
      })

      const { container } = render(<ChatHistory />)

      // Should render without performance issues
      expect(container.querySelectorAll('[data-testid^="conversation-"]')).toHaveLength(1000)
    })

    it('should virtualize long lists', () => {
      const largeConversationList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockConversations[0],
        id: `conversation-${i}`,
        title: `Conversation ${i}`
      }))

      ;(useChatHistoryStore as any).mockReturnValue({
        ...mockStore,
        conversations: largeConversationList,
        filteredConversations: largeConversationList
      })

      render(<ChatHistory />)

      // Should use virtual scrolling for performance
      const virtualList = screen.getByTestId('virtual-conversation-list')
      expect(virtualList).toBeInTheDocument()
    })
  })
})