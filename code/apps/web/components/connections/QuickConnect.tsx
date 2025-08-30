'use client'

import { useState } from 'react'
import { Zap, Star, Clock, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Badge,
} from '@/components/ui'
import { useConnectionStore, connectToService } from '@/lib/stores/connections'
import { protocolMetadata } from '@/lib/protocols/metadata'
import { cn } from '@/lib/utils'
import type { Connection } from '@/lib/types/connections'

interface QuickConnectProps {
  onConnect?: (connection: Connection) => void
  className?: string
}

export function QuickConnect({ onConnect, className }: QuickConnectProps) {
  const { 
    connections, 
    activeConnectionId,
    setActiveConnection 
  } = useConnectionStore()
  
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  
  // Get favorite connections (tagged as favorite or default)
  const favoriteConnections = connections.filter(
    c => c.isDefault || c.tags?.includes('favorite')
  )
  
  // Get recent connections (last 5 connected)
  const recentConnections = connections
    .filter(c => c.lastConnected)
    .sort((a, b) => {
      const aTime = a.lastConnected?.getTime() || 0
      const bTime = b.lastConnected?.getTime() || 0
      return bTime - aTime
    })
    .slice(0, 5)
  
  // Get suggested connections (disconnected, not in favorites or recent)
  const suggestedConnections = connections
    .filter(c => 
      c.status === 'disconnected' && 
      !favoriteConnections.includes(c) &&
      !recentConnections.includes(c)
    )
    .slice(0, 3)
  
  const handleQuickConnect = async (connection: Connection) => {
    if (connection.status === 'connected') {
      // If already connected, just set as active
      setActiveConnection(connection.id)
      onConnect?.(connection)
    } else {
      // Connect to the service
      setIsConnecting(connection.id)
      await connectToService(connection)
      setIsConnecting(null)
      onConnect?.(connection)
    }
  }
  
  const getConnectionStatus = (connection: Connection) => {
    if (isConnecting === connection.id) {
      return 'connecting'
    }
    return connection.status
  }
  
  const ConnectionCard = ({ 
    connection, 
    icon, 
    label 
  }: { 
    connection: Connection
    icon: React.ReactNode
    label?: string 
  }) => {
    const metadata = protocolMetadata[connection.protocol]
    const status = getConnectionStatus(connection)
    const isActive = activeConnectionId === connection.id
    
    return (
      <Card 
        className={cn(
          "relative cursor-pointer transition-all hover:shadow-md",
          isActive && "ring-2 ring-primary",
          status === 'connected' && "bg-accent/5",
          status === 'connecting' && "animate-pulse"
        )}
        onClick={() => handleQuickConnect(connection)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{metadata?.icon}</span>
              <div>
                <h4 className="font-medium">{connection.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {metadata?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {label && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {icon}
                  {label}
                </div>
              )}
              {status === 'connected' && (
                <Badge variant="default" className="text-xs">
                  Connected
                </Badge>
              )}
              {status === 'connecting' && (
                <Badge variant="secondary" className="text-xs">
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
          
          {connection.tags && connection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {connection.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {isActive && (
            <Badge className="absolute top-2 right-2" variant="default">
              Active
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Favorites Section */}
      {favoriteConnections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold">Favorites</h3>
            <Badge variant="secondary">{favoriteConnections.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {favoriteConnections.map(connection => (
              <ConnectionCard 
                key={connection.id}
                connection={connection}
                icon={<Star className="h-3 w-3 text-yellow-500" />}
                label="Favorite"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Section */}
      {recentConnections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold">Recent</h3>
            <Badge variant="secondary">{recentConnections.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentConnections.map(connection => (
              <ConnectionCard 
                key={connection.id}
                connection={connection}
                icon={<Clock className="h-3 w-3 text-blue-500" />}
                label="Recent"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Suggested Section */}
      {suggestedConnections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold">Suggested</h3>
            <Badge variant="secondary">{suggestedConnections.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {suggestedConnections.map(connection => (
              <ConnectionCard 
                key={connection.id}
                connection={connection}
                icon={<Zap className="h-3 w-3 text-purple-500" />}
                label="Suggested"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {connections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Connections Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first connection to start chatting with AI agents
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}