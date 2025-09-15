import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProtocolType } from '@/lib/types'
import {
  validateOpenAIConfig,
  validateMCPConfig,
  validateA2AConfig,
  validateAnthropicConfig,
  validateOllamaConfig,
  type ProtocolConfig
} from '@/lib/types/protocol-configs'

export interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  protocol: ProtocolType
  // Protocol-specific settings
  topP?: number
  topK?: number
  numPredict?: number
  // MCP-specific
  transport?: 'http' | 'stdio'
  command?: string
  args?: string[]
  // A2A-specific
  agentId?: string
  endpoint?: string
}

export interface ConversationSettings extends Partial<ChatSettings> {
  useConversationSettings?: boolean
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface ChatSettingsStore {
  settings: ChatSettings
  conversationSettings: Record<string, ConversationSettings>

  // Actions
  updateSettings: (updates: Partial<ChatSettings>) => void
  updateConversationSettings: (conversationId: string, updates: ConversationSettings) => void
  resetToDefaults: (conversationId?: string) => void
  validateSettings: (protocol: ProtocolType, settings: Partial<ChatSettings>) => ValidationResult
  getProtocolDefaults: (protocol: ProtocolType) => Partial<ChatSettings>
  getEffectiveSettings: (conversationId?: string) => ChatSettings
}

const getDefaultSettings = (protocol: ProtocolType): ChatSettings => {
  const baseSettings = {
    protocol,
    systemPrompt: '',
  }

  switch (protocol) {
    case 'openai':
      return {
        ...baseSettings,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        protocol: 'openai'
      }
    case 'anthropic':
      return {
        ...baseSettings,
        model: 'claude-3-opus-20240229',
        temperature: 0.7,
        maxTokens: 1000,
        protocol: 'anthropic'
      }
    case 'mcp':
      return {
        ...baseSettings,
        model: 'default',
        temperature: 0.7,
        maxTokens: 1000,
        transport: 'http',
        protocol: 'mcp'
      }
    case 'a2a':
      return {
        ...baseSettings,
        model: 'agent-default',
        temperature: 0.7,
        maxTokens: 1000,
        protocol: 'a2a'
      }
    case 'ollama':
      return {
        ...baseSettings,
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        topK: 40,
        protocol: 'ollama'
      }
    default:
      return {
        ...baseSettings,
        model: 'default',
        temperature: 0.7,
        maxTokens: 1000,
        protocol: 'ag-ui'
      }
  }
}

export const useChatSettingsStore = create<ChatSettingsStore>()(
  persist(
    (set, get) => ({
      settings: getDefaultSettings('openai'),
      conversationSettings: {},

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }), false, 'updateSettings')
      },

      updateConversationSettings: (conversationId, updates) => {
        set((state) => ({
          conversationSettings: {
            ...state.conversationSettings,
            [conversationId]: {
              ...state.conversationSettings[conversationId],
              ...updates
            }
          }
        }), false, 'updateConversationSettings')
      },

      resetToDefaults: (conversationId) => {
        if (conversationId) {
          // Reset conversation-specific settings
          set((state) => {
            const newConversationSettings = { ...state.conversationSettings }
            delete newConversationSettings[conversationId]
            return { conversationSettings: newConversationSettings }
          }, false, 'resetConversationToDefaults')
        } else {
          // Reset global settings
          const { settings } = get()
          const defaults = getDefaultSettings(settings.protocol)
          set({ settings: defaults }, false, 'resetToDefaults')
        }
      },

      validateSettings: (protocol, settings) => {
        const errors: string[] = []

        try {
          // Validate temperature
          if (settings.temperature !== undefined) {
            if (protocol === 'anthropic') {
              if (settings.temperature < 0 || settings.temperature > 1) {
                errors.push('Temperature must be between 0 and 1 for Anthropic')
              }
            } else {
              if (settings.temperature < 0 || settings.temperature > 2) {
                errors.push('Temperature must be between 0 and 2')
              }
            }
          }

          // Validate max tokens
          if (settings.maxTokens !== undefined && settings.maxTokens < 1) {
            errors.push('Max tokens must be greater than 0')
          }

          // Validate model
          if (settings.model !== undefined && settings.model.trim().length === 0) {
            errors.push('Model is required')
          }

          // Protocol-specific validation
          switch (protocol) {
            case 'openai':
              // Additional OpenAI validation can be added here
              break
            case 'anthropic':
              // Additional Anthropic validation can be added here
              break
            case 'mcp':
              if (settings.transport === 'stdio' && !settings.command) {
                errors.push('Command is required for stdio transport')
              }
              break
            case 'a2a':
              if (settings.endpoint && settings.endpoint.trim().length === 0) {
                errors.push('Endpoint cannot be empty')
              }
              break
            case 'ollama':
              if (settings.topP !== undefined && (settings.topP < 0 || settings.topP > 1)) {
                errors.push('Top P must be between 0 and 1')
              }
              if (settings.topK !== undefined && settings.topK < 1) {
                errors.push('Top K must be greater than 0')
              }
              break
          }
        } catch (error) {
          errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        return {
          valid: errors.length === 0,
          errors
        }
      },

      getProtocolDefaults: (protocol) => {
        return getDefaultSettings(protocol)
      },

      getEffectiveSettings: (conversationId) => {
        const { settings, conversationSettings } = get()

        if (!conversationId || !conversationSettings[conversationId]?.useConversationSettings) {
          return settings
        }

        const conversationSpecific = conversationSettings[conversationId]
        return {
          ...settings,
          ...conversationSpecific
        }
      }
    }),
    {
      name: 'chat-settings-store',
      partialize: (state) => ({
        settings: state.settings,
        conversationSettings: state.conversationSettings
      })
    }
  )
)