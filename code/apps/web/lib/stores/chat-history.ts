import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  Conversation,
  ChatHistoryState,
  ChatHistoryActions,
  ExportFormat,
  ExportOptions,
  SearchOptions,
  ChatHistoryError,
  ChatHistoryErrorDetails
} from '@/lib/types/chat-history'
import type { Message } from '@/lib/types'

interface ChatHistoryStore extends ChatHistoryState, ChatHistoryActions {}

const defaultSearchOptions: SearchOptions = {
  query: '',
  includeArchived: false,
  sortBy: 'date',
  sortOrder: 'desc'
}

const defaultExportOptions: ExportOptions = {
  format: 'json',
  includeMetadata: true,
  includeTimestamps: true,
  includeArchived: false
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const filterConversations = (
  conversations: Conversation[],
  searchQuery: string,
  options: SearchOptions
): Conversation[] => {
  let filtered = conversations.filter(conversation => {
    // Filter by archived status
    if (!options.includeArchived && conversation.isArchived) {
      return false
    }

    // Filter by protocol
    if (options.protocols && options.protocols.length > 0) {
      if (!options.protocols.includes(conversation.protocol)) {
        return false
      }
    }

    // Filter by date range
    if (options.dateRange) {
      const conversationDate = new Date(conversation.lastMessageAt)
      if (conversationDate < options.dateRange.start || conversationDate > options.dateRange.end) {
        return false
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const titleMatch = conversation.title.toLowerCase().includes(query)
      const contentMatch = conversation.messages.some(message =>
        message.content.toLowerCase().includes(query)
      )
      const tagMatch = conversation.tags?.some(tag =>
        tag.toLowerCase().includes(query)
      )

      return titleMatch || contentMatch || tagMatch
    }

    return true
  })

  // Sort conversations
  filtered.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (options.sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'messageCount':
        aValue = a.messageCount
        bValue = b.messageCount
        break
      case 'date':
      default:
        aValue = new Date(a.lastMessageAt).getTime()
        bValue = new Date(b.lastMessageAt).getTime()
        break
    }

    if (options.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  return filtered
}

const exportToJson = (conversations: Conversation[], options: ExportOptions): string => {
  const data = conversations.map(conversation => ({
    id: conversation.id,
    title: conversation.title,
    protocol: conversation.protocol,
    messageCount: conversation.messageCount,
    createdAt: options.includeTimestamps ? conversation.createdAt : undefined,
    lastMessageAt: options.includeTimestamps ? conversation.lastMessageAt : undefined,
    isArchived: conversation.isArchived,
    messages: conversation.messages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: options.includeTimestamps ? message.timestamp : undefined,
      ...(message.attachments && { attachments: message.attachments })
    })),
    ...(options.includeMetadata && conversation.metadata && { metadata: conversation.metadata }),
    ...(conversation.tags && { tags: conversation.tags })
  }))

  return JSON.stringify(data, null, 2)
}

const exportToMarkdown = (conversations: Conversation[], options: ExportOptions): string => {
  let markdown = '# Chat History Export\n\n'

  if (options.includeTimestamps) {
    markdown += `Exported on: ${new Date().toISOString()}\n\n`
  }

  conversations.forEach(conversation => {
    markdown += `## ${conversation.title}\n\n`

    if (options.includeMetadata) {
      markdown += `- **Protocol**: ${conversation.protocol}\n`
      markdown += `- **Messages**: ${conversation.messageCount}\n`
      if (options.includeTimestamps) {
        markdown += `- **Created**: ${conversation.createdAt.toISOString()}\n`
        markdown += `- **Last Message**: ${conversation.lastMessageAt.toISOString()}\n`
      }
      if (conversation.tags && conversation.tags.length > 0) {
        markdown += `- **Tags**: ${conversation.tags.join(', ')}\n`
      }
      markdown += '\n'
    }

    conversation.messages.forEach(message => {
      markdown += `**${message.role}**:`
      if (options.includeTimestamps) {
        markdown += ` _(${message.timestamp.toISOString()})_`
      }
      markdown += '\n\n'
      markdown += `${message.content}\n\n`
    })

    markdown += '---\n\n'
  })

  return markdown
}

const exportToCsv = (conversations: Conversation[], options: ExportOptions): string => {
  const headers = [
    'conversation_id',
    'conversation_title',
    'protocol',
    'message_count',
    ...(options.includeTimestamps ? ['created_at', 'last_message_at'] : []),
    'is_archived',
    'message_id',
    'message_role',
    'message_content',
    ...(options.includeTimestamps ? ['message_timestamp'] : [])
  ]

  let csv = headers.join(',') + '\n'

  conversations.forEach(conversation => {
    conversation.messages.forEach(message => {
      const row = [
        conversation.id,
        `"${conversation.title.replace(/"/g, '""')}"`,
        conversation.protocol,
        conversation.messageCount,
        ...(options.includeTimestamps ? [
          conversation.createdAt.toISOString(),
          conversation.lastMessageAt.toISOString()
        ] : []),
        conversation.isArchived,
        message.id,
        message.role,
        `"${message.content.replace(/"/g, '""')}"`,
        ...(options.includeTimestamps ? [message.timestamp.toISOString()] : [])
      ]
      csv += row.join(',') + '\n'
    })
  })

  return csv
}

const exportToText = (conversations: Conversation[], options: ExportOptions): string => {
  let text = 'CHAT HISTORY EXPORT\n'
  text += '==================\n\n'

  if (options.includeTimestamps) {
    text += `Exported on: ${new Date().toISOString()}\n\n`
  }

  conversations.forEach((conversation, index) => {
    text += `${index + 1}. ${conversation.title}\n`
    text += `   Protocol: ${conversation.protocol}\n`
    text += `   Messages: ${conversation.messageCount}\n`

    if (options.includeTimestamps) {
      text += `   Created: ${conversation.createdAt.toISOString()}\n`
      text += `   Last Message: ${conversation.lastMessageAt.toISOString()}\n`
    }

    if (conversation.tags && conversation.tags.length > 0) {
      text += `   Tags: ${conversation.tags.join(', ')}\n`
    }

    text += '\n'

    conversation.messages.forEach((message, msgIndex) => {
      text += `   ${msgIndex + 1}. [${message.role.toUpperCase()}]`
      if (options.includeTimestamps) {
        text += ` (${message.timestamp.toISOString()})`
      }
      text += '\n'
      text += `      ${message.content}\n\n`
    })

    text += '   ' + '-'.repeat(50) + '\n\n'
  })

  return text
}

const createError = (type: ChatHistoryError, message: string, details?: any): ChatHistoryErrorDetails => ({
  type,
  message,
  details,
  timestamp: new Date()
})

export const useChatHistoryStore = create<ChatHistoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        conversations: [],
        filteredConversations: [],
        selectedConversation: null,
        searchQuery: '',
        searchOptions: defaultSearchOptions,
        isLoading: false,
        error: null,
        viewMode: 'list',
        showArchived: false,
        selectedConversationIds: [],

        // Data operations
        loadConversations: async () => {
          set({ isLoading: true, error: null })

          try {
            // In a real app, this would fetch from an API
            // For now, we'll use the persisted data
            const { conversations, searchOptions } = get()
            const filtered = filterConversations(conversations, get().searchQuery, searchOptions)

            set({
              filteredConversations: filtered,
              isLoading: false
            })
          } catch (error) {
            const errorDetails = createError(
              'LOAD_FAILED',
              'Failed to load conversations',
              error
            )

            set({
              error: errorDetails.message,
              isLoading: false
            })
          }
        },

        createConversation: async (data) => {
          try {
            const conversation: Conversation = {
              ...data,
              id: generateId(),
              createdAt: new Date(),
              lastMessageAt: new Date(),
              messageCount: data.messages.length
            }

            set(state => ({
              conversations: [conversation, ...state.conversations]
            }))

            // Update filtered conversations
            const { conversations, searchQuery, searchOptions } = get()
            const filtered = filterConversations(conversations, searchQuery, searchOptions)
            set({ filteredConversations: filtered })

            return conversation
          } catch (error) {
            const errorDetails = createError(
              'SAVE_FAILED',
              'Failed to create conversation',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        updateConversation: async (id, updates) => {
          try {
            set(state => ({
              conversations: state.conversations.map(conv =>
                conv.id === id ? { ...conv, ...updates } : conv
              )
            }))

            // Update filtered conversations
            const { conversations, searchQuery, searchOptions } = get()
            const filtered = filterConversations(conversations, searchQuery, searchOptions)
            set({ filteredConversations: filtered })
          } catch (error) {
            const errorDetails = createError(
              'SAVE_FAILED',
              'Failed to update conversation',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        deleteConversation: async (id) => {
          try {
            set(state => ({
              conversations: state.conversations.filter(conv => conv.id !== id),
              selectedConversation: state.selectedConversation?.id === id ? null : state.selectedConversation,
              selectedConversationIds: state.selectedConversationIds.filter(convId => convId !== id)
            }))

            // Update filtered conversations
            const { conversations, searchQuery, searchOptions } = get()
            const filtered = filterConversations(conversations, searchQuery, searchOptions)
            set({ filteredConversations: filtered })
          } catch (error) {
            const errorDetails = createError(
              'DELETE_FAILED',
              'Failed to delete conversation',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        deleteConversations: async (ids) => {
          try {
            set(state => ({
              conversations: state.conversations.filter(conv => !ids.includes(conv.id)),
              selectedConversation: ids.includes(state.selectedConversation?.id || '') ? null : state.selectedConversation,
              selectedConversationIds: state.selectedConversationIds.filter(convId => !ids.includes(convId))
            }))

            // Update filtered conversations
            const { conversations, searchQuery, searchOptions } = get()
            const filtered = filterConversations(conversations, searchQuery, searchOptions)
            set({ filteredConversations: filtered })
          } catch (error) {
            const errorDetails = createError(
              'DELETE_FAILED',
              'Failed to delete conversations',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        // Archive operations
        archiveConversation: async (id) => {
          await get().updateConversation(id, { isArchived: true })
        },

        restoreConversation: async (id) => {
          await get().updateConversation(id, { isArchived: false })
        },

        archiveConversations: async (ids) => {
          try {
            set(state => ({
              conversations: state.conversations.map(conv =>
                ids.includes(conv.id) ? { ...conv, isArchived: true } : conv
              )
            }))

            // Update filtered conversations
            const { conversations, searchQuery, searchOptions } = get()
            const filtered = filterConversations(conversations, searchQuery, searchOptions)
            set({ filteredConversations: filtered })
          } catch (error) {
            const errorDetails = createError(
              'SAVE_FAILED',
              'Failed to archive conversations',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        restoreConversations: async (ids) => {
          try {
            set(state => ({
              conversations: state.conversations.map(conv =>
                ids.includes(conv.id) ? { ...conv, isArchived: false } : conv
              )
            }))

            // Update filtered conversations
            const { conversations, searchQuery, searchOptions } = get()
            const filtered = filterConversations(conversations, searchQuery, searchOptions)
            set({ filteredConversations: filtered })
          } catch (error) {
            const errorDetails = createError(
              'SAVE_FAILED',
              'Failed to restore conversations',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        // Search and filter
        setSearchQuery: (query) => {
          set({ searchQuery: query })

          // Update filtered conversations
          const { conversations, searchOptions } = get()
          const filtered = filterConversations(conversations, query, searchOptions)
          set({ filteredConversations: filtered })
        },

        setSearchOptions: (options) => {
          const newOptions = { ...get().searchOptions, ...options }
          set({ searchOptions: newOptions })

          // Update filtered conversations
          const { conversations, searchQuery } = get()
          const filtered = filterConversations(conversations, searchQuery, newOptions)
          set({ filteredConversations: filtered })
        },

        clearSearch: () => {
          set({ searchQuery: '' })

          // Update filtered conversations
          const { conversations, searchOptions } = get()
          const filtered = filterConversations(conversations, '', searchOptions)
          set({ filteredConversations: filtered })
        },

        // Selection
        setSelectedConversation: (conversation) => {
          set({ selectedConversation: conversation })
        },

        selectConversation: (id) => {
          const conversation = get().conversations.find(conv => conv.id === id)
          if (conversation) {
            set({ selectedConversation: conversation })
          }
        },

        deselectConversation: () => {
          set({ selectedConversation: null })
        },

        toggleConversationSelection: (id) => {
          set(state => ({
            selectedConversationIds: state.selectedConversationIds.includes(id)
              ? state.selectedConversationIds.filter(convId => convId !== id)
              : [...state.selectedConversationIds, id]
          }))
        },

        selectAllConversations: () => {
          const { filteredConversations } = get()
          set({
            selectedConversationIds: filteredConversations.map(conv => conv.id)
          })
        },

        deselectAllConversations: () => {
          set({ selectedConversationIds: [] })
        },

        // View options
        setViewMode: (mode) => {
          set({ viewMode: mode })
        },

        toggleShowArchived: () => {
          set(state => {
            const newShowArchived = !state.showArchived
            const newSearchOptions = {
              ...state.searchOptions,
              includeArchived: newShowArchived
            }

            // Update filtered conversations
            const filtered = filterConversations(state.conversations, state.searchQuery, newSearchOptions)

            return {
              showArchived: newShowArchived,
              searchOptions: newSearchOptions,
              filteredConversations: filtered
            }
          })
        },

        // Export operations
        exportConversations: async (format, options = {}) => {
          try {
            const { conversations } = get()
            const exportOptions = { ...defaultExportOptions, ...options, format }
            const conversationsToExport = exportOptions.includeArchived
              ? conversations
              : conversations.filter(conv => !conv.isArchived)

            switch (format) {
              case 'json':
                return exportToJson(conversationsToExport, exportOptions)
              case 'markdown':
                return exportToMarkdown(conversationsToExport, exportOptions)
              case 'csv':
                return exportToCsv(conversationsToExport, exportOptions)
              case 'txt':
                return exportToText(conversationsToExport, exportOptions)
              default:
                throw new Error(`Unsupported export format: ${format}`)
            }
          } catch (error) {
            const errorDetails = createError(
              'EXPORT_FAILED',
              'Failed to export conversations',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        exportConversation: async (id, format, options = {}) => {
          try {
            const conversation = get().conversations.find(conv => conv.id === id)
            if (!conversation) {
              throw new Error('Conversation not found')
            }

            const exportOptions = { ...defaultExportOptions, ...options, format }
            return await get().exportConversations(format, {
              ...exportOptions,
              includeArchived: true // Include the specific conversation even if archived
            })
          } catch (error) {
            const errorDetails = createError(
              'EXPORT_FAILED',
              'Failed to export conversation',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        exportSelectedConversations: async (format, options = {}) => {
          try {
            const { conversations, selectedConversationIds } = get()
            const selectedConversations = conversations.filter(conv =>
              selectedConversationIds.includes(conv.id)
            )

            const exportOptions = { ...defaultExportOptions, ...options, format }

            switch (format) {
              case 'json':
                return exportToJson(selectedConversations, exportOptions)
              case 'markdown':
                return exportToMarkdown(selectedConversations, exportOptions)
              case 'csv':
                return exportToCsv(selectedConversations, exportOptions)
              case 'txt':
                return exportToText(selectedConversations, exportOptions)
              default:
                throw new Error(`Unsupported export format: ${format}`)
            }
          } catch (error) {
            const errorDetails = createError(
              'EXPORT_FAILED',
              'Failed to export selected conversations',
              error
            )

            set({ error: errorDetails.message })
            throw error
          }
        },

        // Bulk operations
        bulkArchive: async (ids) => {
          await get().archiveConversations(ids)
        },

        bulkDelete: async (ids) => {
          await get().deleteConversations(ids)
        },

        bulkRestore: async (ids) => {
          await get().restoreConversations(ids)
        },

        // Persistence
        saveToStorage: async () => {
          // This is handled automatically by the persist middleware
          return Promise.resolve()
        },

        loadFromStorage: async () => {
          // This is handled automatically by the persist middleware
          return Promise.resolve()
        },

        clearStorage: async () => {
          set({
            conversations: [],
            filteredConversations: [],
            selectedConversation: null,
            searchQuery: '',
            searchOptions: defaultSearchOptions,
            selectedConversationIds: []
          })
        },

        // Utility
        refreshConversations: async () => {
          await get().loadConversations()
        },

        clearError: () => {
          set({ error: null })
        }
      }),
      {
        name: 'chat-history-store',
        partialize: (state) => ({
          conversations: state.conversations,
          searchOptions: state.searchOptions,
          viewMode: state.viewMode,
          showArchived: state.showArchived
        })
      }
    ),
    {
      name: 'chat-history-store'
    }
  )
)