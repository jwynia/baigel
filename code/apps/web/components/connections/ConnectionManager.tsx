'use client'

import { useState } from 'react'
import { Plus, Settings, Trash2, TestTube, Play, Power, Wrench, Zap } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { useConnectionStore, testConnection, connectToService, disconnectFromService } from '@/lib/stores/connections'
import { ConnectionForm } from './ConnectionForm'
import { ConnectionTestDialog } from './ConnectionTestDialog'
import type { Connection, ConnectionTestResult } from '@/lib/types/connections'
import { protocolMetadata } from '@/lib/protocols/metadata'
import { cn } from '@/lib/utils'

export function ConnectionManager() {
  const { 
    connections, 
    activeConnectionId,
    deleteConnection,
    setActiveConnection 
  } = useConnectionStore()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null)
  const [testingConnection, setTestingConnection] = useState<Connection | null>(null)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  const handleConnect = async (connection: Connection) => {
    if (connection.status === 'connected') {
      await disconnectFromService(connection.id)
    } else {
      await connectToService(connection)
    }
  }

  const handleTest = async (connection: Connection) => {
    setTestingConnection(connection)
    const result = await testConnection(connection)
    setTestResult(result)
  }

  const handleDelete = (connection: Connection) => {
    if (confirm(`Are you sure you want to delete "${connection.name}"?`)) {
      deleteConnection(connection.id)
    }
  }

  const getStatusColor = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default">Connected</Badge>
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Disconnected</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Connections</h2>
          <p className="text-muted-foreground">
            Manage your protocol connections and configurations
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => {
            const metadata = protocolMetadata[connection.protocol]
            const isActive = activeConnectionId === connection.id
            
            return (
              <Card 
                key={connection.id}
                className={cn(
                  "relative transition-all",
                  isActive && "ring-2 ring-primary"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{metadata?.icon}</span>
                        {connection.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{metadata?.name || connection.protocol}</span>
                        {connection.tools && connection.tools.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            {connection.tools.length}
                          </Badge>
                        )}
                        {Array.isArray(connection.capabilities) && connection.capabilities.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {Array.isArray(connection.capabilities) ? connection.capabilities.length : 0}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(connection.status)}
                  </div>
                  
                  {connection.isDefault && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Default
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protocol:</span>
                      <span className="font-medium">{connection.protocol.toUpperCase()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {connection.lastConnected && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Connected:</span>
                        <span className="font-medium">
                          {new Date(connection.lastConnected).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Display tools and capabilities counts */}
                    {(connection.tools || connection.capabilities) && (
                      <>
                        {connection.tools && connection.tools.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tools:</span>
                            <span className="font-medium">{connection.tools.length}</span>
                          </div>
                        )}
                        {Array.isArray(connection.capabilities) && connection.capabilities.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capabilities:</span>
                            <span className="font-medium">{Array.isArray(connection.capabilities) ? connection.capabilities.length : 0}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {connection.tags && connection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {connection.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant={tag === 'discovered' ? 'default' : 'outline'} 
                          className={`text-xs ${tag === 'discovered' ? 'bg-blue-500 text-white' : ''}`}
                        >
                          {tag === 'discovered' ? '🔍 Auto-discovered' : tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {connection.error && (
                    <div className="text-xs text-destructive">
                      {connection.error}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between gap-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={connection.status === 'connected' ? 'destructive' : 'default'}
                      onClick={() => handleConnect(connection)}
                      disabled={connection.status === 'connecting'}
                    >
                      {connection.status === 'connected' ? (
                        <>
                          <Power className="h-3 w-3 mr-1" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                    
                    {isActive && (
                      <Badge variant="default" className="px-2">
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(connection)}
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingConnection(connection)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(connection)}
                      disabled={connection.status === 'connected'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
          
          {connections.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No connections configured yet
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Connection
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Add/Edit Connection Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingConnection} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingConnection(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Edit Connection' : 'Add New Connection'}
            </DialogTitle>
            <DialogDescription>
              Configure the connection settings for your protocol
            </DialogDescription>
          </DialogHeader>
          
          <ConnectionForm
            connection={editingConnection}
            onSave={() => {
              setIsAddDialogOpen(false)
              setEditingConnection(null)
            }}
            onCancel={() => {
              setIsAddDialogOpen(false)
              setEditingConnection(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Test Connection Dialog */}
      {testingConnection && (
        <ConnectionTestDialog
          connection={testingConnection}
          result={testResult}
          onClose={() => {
            setTestingConnection(null)
            setTestResult(null)
          }}
        />
      )}
    </div>
  )
}