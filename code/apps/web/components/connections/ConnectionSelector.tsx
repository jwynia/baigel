'use client'

import { useState } from 'react'
import { ChevronDown, Wifi, WifiOff, Plus, Settings } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { useConnectionStore } from '@/lib/stores/connections'
import { ConnectionForm } from './ConnectionForm'
import { ConnectionManager } from './ConnectionManager'
import { protocolMetadata } from '@/lib/protocols/metadata'
import { cn } from '@/lib/utils'
import type { Connection } from '@/lib/types/connections'

export function ConnectionSelector() {
  const { 
    connections, 
    activeConnectionId, 
    setActiveConnection,
    getActiveConnection 
  } = useConnectionStore()
  
  const [showManager, setShowManager] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  const activeConnection = getActiveConnection()
  const connectedConnections = connections.filter(c => c.status === 'connected')
  
  const handleSelectConnection = (connection: Connection) => {
    if (connection.status === 'connected') {
      setActiveConnection(connection.id)
    }
  }
  
  const getConnectionIcon = (connection: Connection) => {
    const metadata = protocolMetadata[connection.protocol]
    return metadata?.icon || '🔌'
  }
  
  const getStatusIcon = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="min-w-[200px] justify-between"
          >
            {activeConnection ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">{getConnectionIcon(activeConnection)}</span>
                <span className="truncate">{activeConnection.name}</span>
                {getStatusIcon(activeConnection.status)}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span>No Connection</span>
              </div>
            )}
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-[250px]">
          <DropdownMenuLabel>Active Connections</DropdownMenuLabel>
          
          {connectedConnections.length > 0 ? (
            connectedConnections.map(connection => {
              const metadata = protocolMetadata[connection.protocol]
              const isActive = activeConnectionId === connection.id
              
              return (
                <DropdownMenuItem
                  key={connection.id}
                  onClick={() => handleSelectConnection(connection)}
                  className={cn(
                    "cursor-pointer",
                    isActive && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{metadata?.icon}</span>
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {metadata?.name}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <Badge variant="default" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No active connections
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Available Connections</DropdownMenuLabel>
          
          {connections
            .filter(c => c.status !== 'connected')
            .map(connection => {
              const metadata = protocolMetadata[connection.protocol]
              
              return (
                <DropdownMenuItem
                  key={connection.id}
                  className="cursor-pointer opacity-60"
                  disabled
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{metadata?.icon}</span>
                    <div>
                      <div className="font-medium">{connection.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {connection.status === 'error' ? 'Error' : 'Disconnected'}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowQuickAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Connection
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowManager(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Connections
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Connection Manager Dialog */}
      <Dialog open={showManager} onOpenChange={setShowManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connection Manager</DialogTitle>
            <DialogDescription>
              Manage your protocol connections and configurations
            </DialogDescription>
          </DialogHeader>
          <ConnectionManager />
        </DialogContent>
      </Dialog>
      
      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Add Connection</DialogTitle>
            <DialogDescription>
              Quickly add a new connection to get started
            </DialogDescription>
          </DialogHeader>
          <ConnectionForm
            onSave={() => setShowQuickAdd(false)}
            onCancel={() => setShowQuickAdd(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}