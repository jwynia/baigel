'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Wrench, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChat, useChatStore } from './ChatProvider'
import { CapabilitySelector } from '@/components/connections/CapabilitySelector'
import { ToolExecutor } from '@/components/tools/ToolExecutor'
import { ToolForm } from '@/components/tools/ToolForm'
import { ConnectionSelector } from '@/components/connections/ConnectionSelector'
import { useConnectionStore } from '@/lib/stores/connections'
import { 
  getConnectionInterfaceType, 
  getDefaultTab, 
  getCapabilityDescription,
  getPrimaryAction
} from '@/lib/utils/connection-capabilities'
import type { Connection } from '@/lib/types/connections'

export function DynamicInterface() {
  // All hooks must be called at the top level before any conditional logic
  const { sendMessage } = useChat()
  const { isStreaming, messages } = useChatStore()
  const { getActiveConnection, connections } = useConnectionStore()
  const [selectedTool, setSelectedTool] = useState<any>(null)
  
  const activeConnection = getActiveConnection()
  const hasConnections = connections && connections.length > 0
  
  // Determine interface type and tab state (even if we might not use them)
  const interfaceType = activeConnection ? getConnectionInterfaceType(activeConnection) : 'chat'
  const defaultTab = activeConnection ? getDefaultTab(activeConnection) : 'chat'
  const [activeTab, setActiveTab] = useState<'chat' | 'tools'>('chat')
  
  // Debug logging to see what's happening
  useEffect(() => {
    if (activeConnection) {
      console.log('Debug - Active Connection:', {
        name: activeConnection.name,
        protocol: activeConnection.protocol,
        tools: activeConnection.tools?.length || 0,
        toolsWithSchema: activeConnection.tools?.filter(t => t.inputSchema).length || 0,
        interfaceType,
        defaultTab
      })
    }
  }, [activeConnection, interfaceType, defaultTab])
  
  // Update active tab when connection changes
  useEffect(() => {
    if (activeConnection) {
      setActiveTab(getDefaultTab(activeConnection))
    }
  }, [activeConnection])

  // Handle conditional rendering after all hooks are called
  if (!hasConnections) {
    return <NoConnectionsState />
  }

  if (!activeConnection) {
    return <NoActiveConnectionState />
  }

  if (activeConnection.status === 'error') {
    return <ConnectionErrorState connection={activeConnection} />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {interfaceType === 'hybrid' ? (
        <HybridInterface
          connection={activeConnection}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
      ) : interfaceType === 'tools' ? (
        <ToolsInterface
          connection={activeConnection}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
      ) : (
        <ChatInterface connection={activeConnection} />
      )}
    </div>
  )
}

function NoConnectionsState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">No Connections Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by discovering AI agents and tools, or manually configure a connection.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <a href="/discovery">Discover Services</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/settings">Manual Setup</a>
        </Button>
      </div>
    </div>
  )
}

function NoActiveConnectionState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Select a Connection</h2>
      <p className="text-muted-foreground mb-6">
        Choose an AI agent or service to start chatting or using tools.
      </p>
      <ConnectionSelector />
    </div>
  )
}

function ConnectionErrorState({ connection }: { connection: Connection }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Connection Error:</strong> {connection.error || 'Failed to connect to the service.'}
        </AlertDescription>
      </Alert>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" asChild>
          <a href="/settings">Check Settings</a>
        </Button>
        <ConnectionSelector />
      </div>
    </div>
  )
}

function HybridInterface({
  connection,
  activeTab,
  onTabChange,
  selectedTool,
  onSelectTool
}: {
  connection: Connection
  activeTab: 'chat' | 'tools'
  onTabChange: (tab: 'chat' | 'tools') => void
  selectedTool: any
  onSelectTool: (tool: any) => void
}) {
  return (
    <>
      <InterfaceHeader connection={connection} />
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => onTabChange(value as 'chat' | 'tools')} 
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-4 grid w-fit grid-cols-2">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Wrench className="h-4 w-4 mr-2" />
            Tools ({connection.tools?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <ChatInterface connection={connection} />
        </TabsContent>
        
        <TabsContent value="tools" className="flex-1 overflow-auto p-4">
          <ToolsContent
            connection={connection}
            selectedTool={selectedTool}
            onSelectTool={onSelectTool}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}

function ToolsInterface({
  connection,
  selectedTool,
  onSelectTool
}: {
  connection: Connection
  selectedTool: any
  onSelectTool: (tool: any) => void
}) {
  return (
    <>
      <InterfaceHeader connection={connection} />
      <div className="flex-1 overflow-auto p-4">
        <ToolsContent
          connection={connection}
          selectedTool={selectedTool}
          onSelectTool={onSelectTool}
        />
      </div>
    </>
  )
}

function ChatInterface({ connection }: { connection: Connection }) {
  const { sendMessage } = useChat()
  const { isStreaming } = useChatStore()
  
  const canSendMessage = connection.status === 'connected' && !isStreaming

  const handleSendMessage = async (content: string) => {
    if (canSendMessage) {
      await sendMessage(content)
    }
  }

  const getPlaceholderText = () => {
    if (connection.status === 'connecting') {
      return "Connecting..."
    }
    if (connection.status === 'disconnected') {
      return "Connection disconnected. Click connect to start..."
    }
    if (isStreaming) {
      return "AI is responding..."
    }
    return `Chat with ${connection.name}...`
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1" role="log" aria-live="polite" aria-label="Chat messages">
        <MessageList />
      </div>
      
      <div 
        role="form" 
        aria-label="Message input"
        className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <MessageInput 
          onSend={handleSendMessage}
          disabled={!canSendMessage}
          placeholder={getPlaceholderText()}
        />
      </div>
    </div>
  )
}

function ToolsContent({
  connection,
  selectedTool,
  onSelectTool
}: {
  connection: Connection
  selectedTool: any
  onSelectTool: (tool: any) => void
}) {
  if (selectedTool) {
    return (
      <div className="flex justify-center">
        <ToolForm
          tool={selectedTool}
          connectionId={connection.id}
          onClose={() => onSelectTool(null)}
          onExecuted={(result) => {
            // Could show a success message or navigate somewhere
            console.log('Tool executed successfully:', result)
          }}
        />
      </div>
    )
  }

  return <CapabilitySelector onSelectTool={onSelectTool} />
}

function InterfaceHeader({ connection }: { connection: Connection }) {
  const capabilityDescription = getCapabilityDescription(connection)
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{connection.name}</h2>
          <p className="text-sm text-muted-foreground">{capabilityDescription}</p>
        </div>
        <ConnectionSelector />
      </div>
    </div>
  )
}