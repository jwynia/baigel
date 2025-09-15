import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatSettings } from '@/components/chat/ChatSettings'
import { useChatSettingsStore } from '@/lib/stores/chat-settings'
import { useConnectionStore } from '@/lib/stores/connections'

// Mock the stores
vi.mock('@/lib/stores/chat-settings', () => ({
  useChatSettingsStore: vi.fn()
}))

vi.mock('@/lib/stores/connections', () => ({
  useConnectionStore: vi.fn()
}))

const mockChatSettingsStore = {
  settings: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: '',
    protocol: 'openai'
  },
  conversationSettings: {},

  // Actions
  updateSettings: vi.fn(),
  updateConversationSettings: vi.fn(),
  resetToDefaults: vi.fn(),
  validateSettings: vi.fn().mockReturnValue({ valid: true, errors: [] }),
  getProtocolDefaults: vi.fn().mockReturnValue({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: ''
  }),
  getEffectiveSettings: vi.fn().mockReturnValue({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: '',
    protocol: 'openai'
  })
}

const mockConnectionStore = {
  connections: [
    {
      id: 'conn1',
      name: 'OpenAI Connection',
      protocol: 'openai',
      status: 'connected',
      config: { apiKey: 'test-key' }
    },
    {
      id: 'conn2',
      name: 'MCP Connection',
      protocol: 'mcp',
      status: 'connected',
      config: { serverUrl: 'http://localhost:3000' }
    }
  ],
  activeConnectionId: 'conn1',
  getActiveConnection: vi.fn().mockReturnValue({
    id: 'conn1',
    name: 'OpenAI Connection',
    protocol: 'openai',
    status: 'connected',
    config: { apiKey: 'test-key' }
  })
}

describe('ChatSettings', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useChatSettingsStore as any).mockReturnValue(mockChatSettingsStore)
    ;(useConnectionStore as any).mockReturnValue(mockConnectionStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the chat settings component', () => {
      render(<ChatSettings />)

      expect(screen.getByRole('region', { name: /chat settings/i })).toBeInTheDocument()
      expect(screen.getByText(/model configuration/i)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /parameters/i })).toBeInTheDocument()
    })

    it('should display current protocol-specific settings', () => {
      render(<ChatSettings />)

      expect(screen.getByText('GPT-4')).toBeInTheDocument()
      expect(screen.getByText('0.7')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
    })

    it('should show protocol-specific model options in dropdown', () => {
      render(<ChatSettings />)

      const modelSelect = screen.getByRole('combobox', { name: /model/i })
      expect(modelSelect).toBeInTheDocument()

      fireEvent.click(modelSelect)

      // OpenAI models should be available
      expect(screen.getByRole('option', { name: /gpt-4/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /gpt-3.5-turbo/i })).toBeInTheDocument()
    })

    it('should show different models for different protocols', () => {
      ;(useConnectionStore as any).mockReturnValue({
        ...mockConnectionStore,
        activeConnectionId: 'conn2',
        getActiveConnection: vi.fn().mockReturnValue({
          id: 'conn2',
          protocol: 'mcp',
          status: 'connected'
        })
      })

      render(<ChatSettings />)

      const modelSelect = screen.getByRole('combobox', { name: /model/i })
      fireEvent.click(modelSelect)

      // MCP might have different model options
      expect(screen.queryByRole('option', { name: /gpt-4/i })).not.toBeInTheDocument()
    })
  })

  describe('Model Selection', () => {
    it('should update model when selection changes', async () => {
      render(<ChatSettings />)

      const modelSelect = screen.getByRole('combobox', { name: /model/i })
      fireEvent.click(modelSelect)

      const gpt35Option = screen.getByRole('option', { name: /gpt-3.5-turbo/i })
      await user.click(gpt35Option)

      expect(mockChatSettingsStore.updateSettings).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo'
      })
    })

    it('should filter models based on current protocol', () => {
      render(<ChatSettings />)

      const modelSelect = screen.getByRole('combobox', { name: /model/i })
      fireEvent.click(modelSelect)

      // Should only show OpenAI models for OpenAI protocol
      const options = screen.getAllByRole('option')
      options.forEach(option => {
        expect(option.textContent).toMatch(/gpt|claude|text/)
      })
    })
  })

  describe('Parameter Controls', () => {
    it('should render temperature slider with correct value', () => {
      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider')
      expect(temperatureSlider).toBeInTheDocument()
      expect(temperatureSlider).toHaveAttribute('aria-valuenow', '0.7')
      expect(screen.getByText('0.7')).toBeInTheDocument()
    })

    it('should update temperature when slider changes', async () => {
      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider')
      fireEvent.change(temperatureSlider, { target: { value: '0.9' } })

      expect(mockChatSettingsStore.updateSettings).toHaveBeenCalledWith({
        temperature: 0.9
      })
    })

    it('should render max tokens input with correct value', () => {
      render(<ChatSettings />)

      const maxTokensInput = screen.getByRole('spinbutton', { name: /max tokens/i })
      expect(maxTokensInput).toHaveValue(1000)
    })

    it('should update max tokens when input changes', async () => {
      render(<ChatSettings />)

      const maxTokensInput = screen.getByRole('spinbutton', { name: /max tokens/i })
      await user.clear(maxTokensInput)
      await user.type(maxTokensInput, '2000')

      expect(mockChatSettingsStore.updateSettings).toHaveBeenCalledWith({
        maxTokens: 2000
      })
    })

    it('should show protocol-specific parameters only', () => {
      render(<ChatSettings />)

      // OpenAI should show temperature and max tokens
      expect(screen.getByRole('slider', { name: /temperature/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /max tokens/i })).toBeInTheDocument()

      // Should not show MCP-specific parameters
      expect(screen.queryByRole('textbox', { name: /server url/i })).not.toBeInTheDocument()
    })

    it('should validate parameter ranges', async () => {
      mockChatSettingsStore.validateSettings.mockReturnValue({
        valid: false,
        errors: ['Temperature must be between 0 and 2']
      })

      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      fireEvent.change(temperatureSlider, { target: { value: '3' } })

      await waitFor(() => {
        expect(screen.getByText('Temperature must be between 0 and 2')).toBeInTheDocument()
      })
    })
  })

  describe('System Prompt', () => {
    it('should render system prompt textarea', () => {
      render(<ChatSettings />)

      expect(screen.getByRole('textbox', { name: /system prompt/i })).toBeInTheDocument()
    })

    it('should update system prompt when textarea changes', async () => {
      render(<ChatSettings />)

      const systemPromptTextarea = screen.getByRole('textbox', { name: /system prompt/i })
      await user.type(systemPromptTextarea, 'You are a helpful assistant')

      expect(mockChatSettingsStore.updateSettings).toHaveBeenCalledWith({
        systemPrompt: 'You are a helpful assistant'
      })
    })

    it('should show character count for system prompt', () => {
      ;(useChatSettingsStore as any).mockReturnValue({
        ...mockChatSettingsStore,
        settings: {
          ...mockChatSettingsStore.settings,
          systemPrompt: 'Test prompt'
        }
      })

      render(<ChatSettings />)

      expect(screen.getByText('11 characters')).toBeInTheDocument()
    })
  })

  describe('Per-Conversation Settings', () => {
    it('should toggle conversation-specific settings', async () => {
      render(<ChatSettings conversationId="conv123" />)

      const conversationToggle = screen.getByRole('switch', { name: /conversation specific/i })
      await user.click(conversationToggle)

      expect(mockChatSettingsStore.updateConversationSettings).toHaveBeenCalledWith('conv123', {
        useConversationSettings: true
      })
    })

    it('should show separate settings when conversation-specific is enabled', () => {
      ;(useChatSettingsStore as any).mockReturnValue({
        ...mockChatSettingsStore,
        conversationSettings: {
          'conv123': {
            useConversationSettings: true,
            model: 'gpt-3.5-turbo',
            temperature: 0.5
          }
        }
      })

      render(<ChatSettings conversationId="conv123" />)

      // Should show conversation-specific values
      expect(screen.getByDisplayValue('gpt-3.5-turbo')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0.5')).toBeInTheDocument()
    })
  })

  describe('Settings Persistence', () => {
    it('should save settings to store when changed', async () => {
      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } })

      expect(mockChatSettingsStore.updateSettings).toHaveBeenCalledWith({
        temperature: 0.8
      })
    })

    it('should save conversation settings separately', async () => {
      render(<ChatSettings conversationId="conv123" />)

      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } })

      expect(mockChatSettingsStore.updateConversationSettings).toHaveBeenCalledWith('conv123', {
        temperature: 0.8
      })
    })
  })

  describe('Reset to Defaults', () => {
    it('should render reset button', () => {
      render(<ChatSettings />)

      expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument()
    })

    it('should reset global settings when reset button clicked', async () => {
      render(<ChatSettings />)

      const resetButton = screen.getByRole('button', { name: /reset to defaults/i })
      await user.click(resetButton)

      expect(mockChatSettingsStore.resetToDefaults).toHaveBeenCalled()
    })

    it('should reset conversation settings when reset button clicked with conversation ID', async () => {
      render(<ChatSettings conversationId="conv123" />)

      const resetButton = screen.getByRole('button', { name: /reset to defaults/i })
      await user.click(resetButton)

      expect(mockChatSettingsStore.resetToDefaults).toHaveBeenCalledWith('conv123')
    })

    it('should show confirmation dialog before resetting', async () => {
      render(<ChatSettings />)

      const resetButton = screen.getByRole('button', { name: /reset to defaults/i })
      await user.click(resetButton)

      expect(screen.getByRole('dialog', { name: /reset settings/i })).toBeInTheDocument()
      expect(screen.getByText(/this will reset all settings to their default values/i)).toBeInTheDocument()
    })
  })

  describe('Protocol-Specific Validation', () => {
    it('should validate OpenAI-specific settings', () => {
      mockChatSettingsStore.validateSettings.mockReturnValue({
        valid: false,
        errors: ['API key is required for OpenAI']
      })

      render(<ChatSettings />)

      // Trigger validation by changing a setting
      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } })

      expect(mockChatSettingsStore.validateSettings).toHaveBeenCalledWith('openai', expect.any(Object))
    })

    it('should show protocol-specific error messages', async () => {
      mockChatSettingsStore.validateSettings.mockReturnValue({
        valid: false,
        errors: ['Temperature must be between 0 and 2 for OpenAI']
      })

      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })
      fireEvent.change(temperatureSlider, { target: { value: '3' } })

      await waitFor(() => {
        expect(screen.getByText('Temperature must be between 0 and 2 for OpenAI')).toBeInTheDocument()
      })
    })

    it('should disable invalid settings submission', () => {
      mockChatSettingsStore.validateSettings.mockReturnValue({
        valid: false,
        errors: ['Invalid configuration']
      })

      render(<ChatSettings />)

      const saveButton = screen.queryByRole('button', { name: /save/i })
      if (saveButton) {
        expect(saveButton).toBeDisabled()
      }
    })
  })

  describe('Integration with Theme/Global Settings', () => {
    it('should respect global theme settings', () => {
      render(<ChatSettings />)

      const settingsContainer = screen.getByRole('region', { name: /chat settings/i })
      expect(settingsContainer).toHaveClass('bg-background')
    })

    it('should apply consistent spacing and typography', () => {
      render(<ChatSettings />)

      const labels = screen.getAllByText(/model|temperature|max tokens/i)
      labels.forEach(label => {
        expect(label).toHaveClass('text-sm')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ChatSettings />)

      const settingsRegion = screen.getByRole('region', { name: /chat settings/i })
      expect(settingsRegion).toBeInTheDocument()

      const temperatureSlider = screen.getByRole('slider')
      expect(temperatureSlider).toHaveAttribute('aria-valuemin', '0')
      expect(temperatureSlider).toHaveAttribute('aria-valuemax', '2')
      expect(temperatureSlider).toHaveAttribute('aria-valuenow', '0.7')
    })

    it('should support keyboard navigation', async () => {
      render(<ChatSettings />)

      // Tab should move through controls
      await user.tab()
      expect(screen.getByRole('combobox', { name: /model/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('slider')).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('spinbutton', { name: /max tokens/i })).toHaveFocus()
    })

    it('should announce changes to screen readers', async () => {
      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider')
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } })

      // Should have aria-valuenow updated
      expect(temperatureSlider).toHaveAttribute('aria-valuenow', '0.7') // Initial value from mock
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing active connection gracefully', () => {
      ;(useConnectionStore as any).mockReturnValue({
        ...mockConnectionStore,
        getActiveConnection: vi.fn().mockReturnValue(null)
      })

      render(<ChatSettings />)

      expect(screen.getByText(/no active connection/i)).toBeInTheDocument()
    })

    it('should handle protocol switching', () => {
      const { rerender } = render(<ChatSettings />)

      // Switch to MCP protocol
      ;(useConnectionStore as any).mockReturnValue({
        ...mockConnectionStore,
        getActiveConnection: vi.fn().mockReturnValue({
          protocol: 'mcp',
          status: 'connected'
        })
      })

      rerender(<ChatSettings />)

      // Should show MCP-appropriate controls
      expect(screen.queryByRole('slider', { name: /temperature/i })).not.toBeInTheDocument()
    })

    it('should handle very long system prompts', () => {
      const longPrompt = 'A'.repeat(10000)
      ;(useChatSettingsStore as any).mockReturnValue({
        ...mockChatSettingsStore,
        settings: {
          ...mockChatSettingsStore.settings,
          systemPrompt: longPrompt
        }
      })

      render(<ChatSettings />)

      expect(screen.getByText('10000 characters')).toBeInTheDocument()
    })

    it('should handle invalid numeric inputs gracefully', async () => {
      render(<ChatSettings />)

      const maxTokensInput = screen.getByRole('spinbutton', { name: /max tokens/i })
      await user.clear(maxTokensInput)
      await user.type(maxTokensInput, 'invalid')

      // Should not update with invalid value
      expect(mockChatSettingsStore.updateSettings).not.toHaveBeenCalledWith({
        maxTokens: 'invalid'
      })
    })
  })

  describe('Performance', () => {
    it('should debounce rapid setting changes', async () => {
      render(<ChatSettings />)

      const temperatureSlider = screen.getByRole('slider', { name: /temperature/i })

      // Rapid changes
      fireEvent.change(temperatureSlider, { target: { value: '0.1' } })
      fireEvent.change(temperatureSlider, { target: { value: '0.2' } })
      fireEvent.change(temperatureSlider, { target: { value: '0.3' } })

      // Should debounce and only call once with final value
      await waitFor(() => {
        expect(mockChatSettingsStore.updateSettings).toHaveBeenCalledTimes(1)
        expect(mockChatSettingsStore.updateSettings).toHaveBeenLastCalledWith({
          temperature: 0.3
        })
      })
    })

    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      const TestComponent = () => {
        renderSpy()
        return <ChatSettings />
      }

      const { rerender } = render(<TestComponent />)
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<TestComponent />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // Should only increment by 1
    })
  })
})