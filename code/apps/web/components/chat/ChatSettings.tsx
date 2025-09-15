'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Form } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useChatSettingsStore } from '@/lib/stores/chat-settings'
import { useConnectionStore } from '@/lib/stores/connections'
import type { ProtocolType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChatSettingsProps {
  conversationId?: string
  className?: string
}

// Protocol-specific model options
const PROTOCOL_MODELS = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' }
  ],
  anthropic: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ],
  mcp: [
    { value: 'default', label: 'Default MCP Model' }
  ],
  a2a: [
    { value: 'agent-default', label: 'Agent Default' }
  ],
  ollama: [
    { value: 'llama2', label: 'Llama 2' },
    { value: 'codellama', label: 'Code Llama' },
    { value: 'mistral', label: 'Mistral' }
  ],
  'ag-ui': [
    { value: 'default', label: 'Default Model' }
  ],
  langchain: [
    { value: 'default', label: 'Default LangChain Model' }
  ]
} as const

export function ChatSettings({ conversationId, className }: ChatSettingsProps) {
  const {
    settings,
    conversationSettings,
    updateSettings,
    updateConversationSettings,
    resetToDefaults,
    validateSettings,
    getEffectiveSettings
  } = useChatSettingsStore()

  const { getActiveConnection } = useConnectionStore()
  const activeConnection = getActiveConnection()

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  // Get effective settings (conversation-specific or global)
  const effectiveSettings = getEffectiveSettings(conversationId)
  const conversationSpecific = conversationId ? conversationSettings[conversationId] : undefined
  const useConversationSettings = conversationSpecific?.useConversationSettings ?? false

  // Get current protocol from active connection
  const currentProtocol = activeConnection?.protocol || 'openai'

  // Debounced update function
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (updates: any) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (conversationId && useConversationSettings) {
            updateConversationSettings(conversationId, updates)
          } else {
            updateSettings(updates)
          }
        }, 300)
      }
    })(),
    [conversationId, useConversationSettings, updateSettings, updateConversationSettings]
  )

  // Validate settings when they change
  useEffect(() => {
    const validation = validateSettings(currentProtocol, effectiveSettings)
    setValidationErrors(validation.errors)
  }, [effectiveSettings, currentProtocol, validateSettings])

  const handleSettingChange = (key: string, value: any) => {
    const updates = { [key]: value }

    if (conversationId && useConversationSettings) {
      updateConversationSettings(conversationId, updates)
    } else {
      updateSettings(updates)
    }

    // Immediate validation
    const validation = validateSettings(currentProtocol, { ...effectiveSettings, ...updates })
    setValidationErrors(validation.errors)
  }

  const handleSliderChange = (key: string) => (values: number[]) => {
    handleSettingChange(key, values[0])
  }

  const handleReset = () => {
    resetToDefaults(conversationId)
    setIsResetDialogOpen(false)
  }

  const getModelOptions = (protocol: ProtocolType) => {
    return PROTOCOL_MODELS[protocol] || [{ value: 'default', label: 'Default' }]
  }

  const getTemperatureRange = (protocol: ProtocolType) => {
    return protocol === 'anthropic' ? { min: 0, max: 1 } : { min: 0, max: 2 }
  }

  const showProtocolSpecificFields = (protocol: ProtocolType) => {
    switch (protocol) {
      case 'openai':
      case 'anthropic':
        return ['model', 'temperature', 'maxTokens', 'systemPrompt']
      case 'mcp':
        return ['model', 'temperature', 'maxTokens', 'systemPrompt', 'transport', 'command']
      case 'a2a':
        return ['model', 'temperature', 'maxTokens', 'systemPrompt', 'endpoint']
      case 'ollama':
        return ['model', 'temperature', 'maxTokens', 'systemPrompt', 'topP', 'topK']
      default:
        return ['model', 'temperature', 'maxTokens', 'systemPrompt']
    }
  }

  const visibleFields = showProtocolSpecificFields(currentProtocol)
  const temperatureRange = getTemperatureRange(currentProtocol)

  if (!activeConnection) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Chat Settings</CardTitle>
          <CardDescription>Configure chat parameters and behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>No active connection. Please connect to a protocol first.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div role="region" aria-label="Chat settings" className={cn('w-full space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Chat Settings</CardTitle>
          <CardDescription>Configure chat parameters for {currentProtocol.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conversation-specific toggle */}
          {conversationId && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="conversation-specific">Conversation Specific Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Use different settings for this conversation
                </p>
              </div>
              <Switch
                id="conversation-specific"
                checked={useConversationSettings}
                onCheckedChange={(checked) => {
                  updateConversationSettings(conversationId, {
                    useConversationSettings: checked
                  })
                }}
                aria-label="Conversation specific settings"
              />
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Model Configuration</h3>

            {/* Model Selection */}
            {visibleFields.includes('model') && (
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={effectiveSettings.model}
                  onValueChange={(value) => handleSettingChange('model', value)}
                >
                  <SelectTrigger id="model" aria-label="Model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelOptions(currentProtocol).map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Parameters</h3>

            {/* Temperature */}
            {visibleFields.includes('temperature') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Badge variant="secondary">{effectiveSettings.temperature}</Badge>
                </div>
                <Slider
                  id="temperature"
                  aria-label="Temperature"
                  aria-valuemin={temperatureRange.min}
                  aria-valuemax={temperatureRange.max}
                  aria-valuenow={effectiveSettings.temperature}
                  min={temperatureRange.min}
                  max={temperatureRange.max}
                  step={0.1}
                  value={[effectiveSettings.temperature]}
                  onValueChange={handleSliderChange('temperature')}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Controls randomness in responses ({temperatureRange.min}-{temperatureRange.max})
                </p>
              </div>
            )}

            {/* Max Tokens */}
            {visibleFields.includes('maxTokens') && (
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="32000"
                  value={effectiveSettings.maxTokens}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    if (!isNaN(value)) {
                      handleSettingChange('maxTokens', value)
                    }
                  }}
                  aria-label="Max tokens"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of tokens in the response
                </p>
              </div>
            )}

            {/* Ollama-specific parameters */}
            {currentProtocol === 'ollama' && visibleFields.includes('topP') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="topP">Top P</Label>
                  <Badge variant="secondary">{effectiveSettings.topP || 0.9}</Badge>
                </div>
                <Slider
                  id="topP"
                  aria-label="Top P"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[effectiveSettings.topP || 0.9]}
                  onValueChange={handleSliderChange('topP')}
                  className="w-full"
                />
              </div>
            )}

            {currentProtocol === 'ollama' && visibleFields.includes('topK') && (
              <div className="space-y-2">
                <Label htmlFor="topK">Top K</Label>
                <Input
                  id="topK"
                  type="number"
                  min="1"
                  value={effectiveSettings.topK || 40}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    if (!isNaN(value)) {
                      handleSettingChange('topK', value)
                    }
                  }}
                  aria-label="Top K"
                />
              </div>
            )}

            {/* MCP-specific parameters */}
            {currentProtocol === 'mcp' && visibleFields.includes('transport') && (
              <div className="space-y-2">
                <Label htmlFor="transport">Transport</Label>
                <Select
                  value={effectiveSettings.transport || 'http'}
                  onValueChange={(value: 'http' | 'stdio') => handleSettingChange('transport', value)}
                >
                  <SelectTrigger id="transport">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="stdio">STDIO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentProtocol === 'mcp' && effectiveSettings.transport === 'stdio' && visibleFields.includes('command') && (
              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  value={effectiveSettings.command || ''}
                  onChange={(e) => handleSettingChange('command', e.target.value)}
                  placeholder="Command to execute"
                />
              </div>
            )}

            {/* A2A-specific parameters */}
            {currentProtocol === 'a2a' && visibleFields.includes('endpoint') && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input
                  id="endpoint"
                  value={effectiveSettings.endpoint || ''}
                  onChange={(e) => handleSettingChange('endpoint', e.target.value)}
                  placeholder="Agent endpoint URL"
                />
              </div>
            )}
          </div>

          {/* System Prompt */}
          {visibleFields.includes('systemPrompt') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Badge variant="outline">
                  {effectiveSettings.systemPrompt.length} characters
                </Badge>
              </div>
              <Textarea
                id="systemPrompt"
                value={effectiveSettings.systemPrompt}
                onChange={(e) => handleSettingChange('systemPrompt', e.target.value)}
                placeholder="Enter a system prompt to guide the AI's behavior..."
                className="min-h-[100px]"
                aria-label="System prompt"
              />
              <p className="text-sm text-muted-foreground">
                Set instructions that will be prepended to every conversation
              </p>
            </div>
          )}

          {/* Reset to Defaults */}
          <div className="pt-4 border-t">
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent role="dialog" aria-label="Reset settings">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all settings to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} aria-label="Confirm delete">
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}