import type { Message, ProtocolType } from '@/lib/types'

// Core conversation type
export interface Conversation {
  id: string
  title: string
  protocol: ProtocolType
  messageCount: number
  createdAt: Date
  lastMessageAt: Date
  isArchived: boolean
  messages: Message[]
  tags?: string[]
  metadata?: {
    description?: string
    model?: string
    totalTokens?: number
    estimatedCost?: number
  }
}

// Export formats
export type ExportFormat = 'json' | 'markdown' | 'csv' | 'txt'

// Export options
export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeTimestamps: boolean
  includeArchived: boolean
}

// Search and filter options
export interface SearchOptions {
  query: string
  protocols?: ProtocolType[]
  dateRange?: {
    start: Date
    end: Date
  }
  includeArchived: boolean
  sortBy: 'date' | 'title' | 'messageCount'
  sortOrder: 'asc' | 'desc'
}

// Chat history store state
export interface ChatHistoryState {
  // Data
  conversations: Conversation[]
  filteredConversations: Conversation[]
  selectedConversation: Conversation | null

  // UI state
  searchQuery: string
  searchOptions: SearchOptions
  isLoading: boolean
  error: string | null

  // View state
  viewMode: 'list' | 'grid'
  showArchived: boolean
  selectedConversationIds: string[]
}

// Chat history store actions
export interface ChatHistoryActions {
  // Data operations
  loadConversations: () => Promise<void>
  createConversation: (data: Omit<Conversation, 'id' | 'createdAt' | 'lastMessageAt' | 'messageCount'>) => Promise<Conversation>
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  deleteConversations: (ids: string[]) => Promise<void>

  // Archive operations
  archiveConversation: (id: string) => Promise<void>
  restoreConversation: (id: string) => Promise<void>
  archiveConversations: (ids: string[]) => Promise<void>
  restoreConversations: (ids: string[]) => Promise<void>

  // Search and filter
  setSearchQuery: (query: string) => void
  setSearchOptions: (options: Partial<SearchOptions>) => void
  clearSearch: () => void

  // Selection
  setSelectedConversation: (conversation: Conversation | null) => void
  selectConversation: (id: string) => void
  deselectConversation: () => void
  toggleConversationSelection: (id: string) => void
  selectAllConversations: () => void
  deselectAllConversations: () => void

  // View options
  setViewMode: (mode: 'list' | 'grid') => void
  toggleShowArchived: () => void

  // Export operations
  exportConversations: (format: ExportFormat, options?: Partial<ExportOptions>) => Promise<string>
  exportConversation: (id: string, format: ExportFormat, options?: Partial<ExportOptions>) => Promise<string>
  exportSelectedConversations: (format: ExportFormat, options?: Partial<ExportOptions>) => Promise<string>

  // Bulk operations
  bulkArchive: (ids: string[]) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>
  bulkRestore: (ids: string[]) => Promise<void>

  // Persistence
  saveToStorage: () => Promise<void>
  loadFromStorage: () => Promise<void>
  clearStorage: () => Promise<void>

  // Utility
  refreshConversations: () => Promise<void>
  clearError: () => void
}

// Component props
export interface ChatHistoryProps {
  onConversationSelect?: (conversation: Conversation) => void
  onConversationCreate?: () => void
  showCreateButton?: boolean
  showExportButton?: boolean
  showArchiveToggle?: boolean
  maxHeight?: string
  className?: string
}

// Conversation item props
export interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: (conversation: Conversation) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string, format: ExportFormat) => void
  showActions?: boolean
  className?: string
}

// Search props
export interface ConversationSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onClear: () => void
  placeholder?: string
  className?: string
}

// Export dialog props
export interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  selectedConversations: Conversation[]
  onExport: (format: ExportFormat, options: ExportOptions) => void
}

// Archive view props
export interface ArchiveViewProps {
  conversations: Conversation[]
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onBulkRestore: (ids: string[]) => void
  onBulkDelete: (ids: string[]) => void
}

// Keyboard shortcut definitions
export interface KeyboardShortcuts {
  search: string[]
  delete: string[]
  archive: string[]
  export: string[]
  selectAll: string[]
  escape: string[]
  enter: string[]
  arrowUp: string[]
  arrowDown: string[]
}

// Virtualization options for large lists
export interface VirtualizationOptions {
  enabled: boolean
  itemHeight: number
  overscan: number
  threshold: number
}

// Performance metrics
export interface PerformanceMetrics {
  conversationCount: number
  loadTime: number
  searchTime: number
  renderTime: number
  lastUpdated: Date
}

// Error types
export type ChatHistoryError =
  | 'LOAD_FAILED'
  | 'SAVE_FAILED'
  | 'DELETE_FAILED'
  | 'EXPORT_FAILED'
  | 'SEARCH_FAILED'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'VALIDATION_ERROR'

export interface ChatHistoryErrorDetails {
  type: ChatHistoryError
  message: string
  code?: string
  details?: any
  timestamp: Date
}