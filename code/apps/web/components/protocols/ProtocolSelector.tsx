'use client'

import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui'
import { useChatStore } from '@/components/chat/ChatProvider'
import { useConnectionStore } from '@/lib/stores/connections'
import type { ProtocolType, ProtocolInfo } from '@/lib/types'

// Protocol metadata for display purposes
const protocolMetadata: Record<ProtocolType, Omit<ProtocolInfo, 'id' | 'status'>> = {
  'ag-ui': {
    name: 'Agent UI',
    description: 'Real-time agent interface protocol',
    type: 'remote',
    capabilities: ['streaming', 'tools', 'files']
  },
  'mcp': {
    name: 'Model Context Protocol',
    description: 'Anthropic\'s MCP for tool integration',
    type: 'local',
    capabilities: ['tools', 'resources']
  },
  'a2a': {
    name: 'Agent-to-Agent',
    description: 'Multi-agent communication protocol',
    type: 'remote',
    capabilities: ['agents', 'delegation']
  },
  'openai': {
    name: 'OpenAI API',
    description: 'Direct OpenAI API integration',
    type: 'remote',
    capabilities: ['completions', 'functions']
  },
  'langchain': {
    name: 'LangChain',
    description: 'LangChain agent framework',
    type: 'remote',
    capabilities: ['chains', 'agents', 'memory']
  },
  'openai-provider': {
    name: 'OpenAI Provider',
    description: 'OpenAI model provider',
    type: 'remote',
    capabilities: ['completions']
  },
  'openai-compatible': {
    name: 'OpenAI Compatible',
    description: 'OpenAI-compatible API provider',
    type: 'remote',
    capabilities: ['completions']
  },
  'openrouter': {
    name: 'OpenRouter',
    description: 'OpenRouter API provider',
    type: 'remote',
    capabilities: ['completions']
  },
  'ollama': {
    name: 'Ollama',
    description: 'Local Ollama instance',
    type: 'local',
    capabilities: ['completions']
  },
  'lmstudio': {
    name: 'LM Studio',
    description: 'Local LM Studio instance',
    type: 'local',
    capabilities: ['completions']
  },
  'anthropic': {
    name: 'Anthropic',
    description: 'Anthropic Claude API',
    type: 'remote',
    capabilities: ['completions']
  },
  'google': {
    name: 'Google',
    description: 'Google AI API',
    type: 'remote',
    capabilities: ['completions']
  },
  'azure-openai': {
    name: 'Azure OpenAI',
    description: 'Azure OpenAI Service',
    type: 'remote',
    capabilities: ['completions']
  }
}

export function ProtocolSelector() {
  const { activeProtocol, isConnected, setProtocol } = useChatStore()
  const { connections, activeConnectionId } = useConnectionStore()

  // Build available protocols from actual connections and metadata
  const availableProtocols: ProtocolInfo[] = useMemo(() => {
    // Get unique protocols from connections
    const usedProtocols = new Set(connections.map(conn => conn.protocol))
    
    // Add protocols that have connections
    const protocols: ProtocolInfo[] = Array.from(usedProtocols).map(protocolId => {
      const metadata = protocolMetadata[protocolId]
      const connectionsForProtocol = connections.filter(conn => conn.protocol === protocolId)
      
      // Determine overall status based on connections
      let status: 'connected' | 'disconnected' | 'error' = 'disconnected'
      if (connectionsForProtocol.some(conn => conn.status === 'connected')) {
        status = 'connected'
      } else if (connectionsForProtocol.some(conn => conn.status === 'error')) {
        status = 'error'
      }
      
      return {
        id: protocolId,
        status,
        ...metadata
      }
    })
    
    // If no connections exist, show common protocols as options
    if (protocols.length === 0) {
      const commonProtocols: ProtocolType[] = ['openai', 'mcp', 'a2a', 'ag-ui']
      return commonProtocols.map(protocolId => ({
        id: protocolId,
        status: 'disconnected' as const,
        ...protocolMetadata[protocolId]
      }))
    }
    
    return protocols
  }, [connections])

  const handleProtocolChange = (newProtocol: ProtocolType) => {
    setProtocol(newProtocol)
  }

  const currentProtocol = availableProtocols.find(p => p.id === activeProtocol)

  return (
    <Select
      value={activeProtocol}
      onValueChange={handleProtocolChange}
      disabled={isConnected}
    >
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select protocol">
          {currentProtocol && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={currentProtocol.type === 'local' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {currentProtocol.type}
              </Badge>
              <span>{currentProtocol.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent>
        {availableProtocols.map((protocol) => (
          <SelectItem key={protocol.id} value={protocol.id}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={protocol.type === 'local' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {protocol.type}
                </Badge>
                <span className="font-medium">{protocol.name}</span>
                <Badge 
                  variant={
                    protocol.status === 'connected' ? 'default' :
                    protocol.status === 'error' ? 'destructive' : 'outline'
                  }
                  className="text-xs"
                >
                  {protocol.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {protocol.description}
              </div>
              <div className="flex gap-1 mt-1">
                {protocol.capabilities.map(cap => (
                  <Badge key={cap} variant="outline" className="text-xs px-1 py-0">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}