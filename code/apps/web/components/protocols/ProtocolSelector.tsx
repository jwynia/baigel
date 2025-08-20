'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui'
import { useChatStore } from '@/components/chat/ChatProvider'
import type { ProtocolType, ProtocolInfo } from '@/lib/types'

// Mock protocol data - this would come from a service in a real app
const availableProtocols: ProtocolInfo[] = [
  {
    id: 'ag-ui',
    name: 'Agent UI',
    description: 'Real-time agent interface protocol',
    type: 'remote',
    status: 'connected',
    capabilities: ['streaming', 'tools', 'files']
  },
  {
    id: 'mcp',
    name: 'Model Context Protocol',
    description: 'Anthropic\'s MCP for tool integration',
    type: 'local',
    status: 'disconnected',
    capabilities: ['tools', 'resources']
  },
  {
    id: 'a2a',
    name: 'Agent-to-Agent',
    description: 'Multi-agent communication protocol',
    type: 'remote',
    status: 'disconnected',
    capabilities: ['agents', 'delegation']
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    description: 'OpenAI\'s chat completion API',
    type: 'remote',
    status: 'disconnected',
    capabilities: ['chat', 'tools']
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'LangChain agent framework',
    type: 'local',
    status: 'disconnected',
    capabilities: ['agents', 'tools', 'memory']
  }
]

export function ProtocolSelector() {
  const { activeProtocol, isConnected, setProtocol } = useChatStore()

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