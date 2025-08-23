'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Key, Lock, Network, Plus, Shield, Wrench, Link as LinkIcon } from 'lucide-react';
import type { DiscoveredAgent } from '@/types/discovery';
import { useConnectionStore } from '@/lib/stores/connections';
import { discoveredAgentToConnection, isAgentAlreadyConnected } from '@/lib/utils/discovery-to-connection';

interface DiscoveryCardProps {
  agent: DiscoveredAgent;
  isSelected?: boolean;
  onAdd: (agent: DiscoveredAgent) => void;
  onToggleSelect?: (agentId: string) => void;
}

const protocolColors: Record<string, string> = {
  MCP: 'bg-blue-500',
  A2A: 'bg-green-500',
  'AG-UI': 'bg-purple-500',
  OpenAI: 'bg-orange-500',
  Unknown: 'bg-gray-500',
};

const authIcons: Record<string, React.ReactNode> = {
  'none': null,
  'api-key': <Key className="h-3 w-3" />,
  'oauth2': <Shield className="h-3 w-3" />,
  'bearer': <Lock className="h-3 w-3" />,
  'custom': <Lock className="h-3 w-3" />,
};

export function DiscoveryCard({ agent, isSelected, onAdd, onToggleSelect }: DiscoveryCardProps) {
  const { connections, addConnection } = useConnectionStore();
  const toolCount = agent.tools?.length || 0;
  const capabilityCount = agent.capabilities?.length || 0;
  const protocolColor = protocolColors[agent.protocol] || protocolColors.Unknown;
  const isAlreadyConnected = isAgentAlreadyConnected(agent, connections);

  const handleAddToConnections = () => {
    if (isAlreadyConnected) return;
    
    const connectionData = discoveredAgentToConnection(agent);
    const newConnection = addConnection(connectionData);
    
    // Optional: Also trigger the onAdd callback if provided
    if (onAdd && newConnection) {
      onAdd(agent);
    }
  };

  return (
    <Card className={`relative transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {agent.name}
              <Badge variant="secondary" className={`${protocolColor} text-white`}>
                {agent.protocol}
              </Badge>
            </CardTitle>
            {agent.description && (
              <CardDescription className="mt-1">{agent.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {onToggleSelect && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleSelect(agent.id)}
                aria-label={isSelected ? 'Deselect' : 'Select'}
              >
                <Check className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            )}
            {isAlreadyConnected ? (
              <Badge variant="default" className="bg-green-500 text-white px-3 py-1">
                <Check className="h-3 w-3 mr-1" />
                Added
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={handleAddToConnections}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add to Connections
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Capabilities Summary */}
        <div className="flex flex-wrap gap-2 text-sm">
          {toolCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <span>{toolCount} {toolCount === 1 ? 'tool' : 'tools'}</span>
            </div>
          )}
          {capabilityCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Network className="h-4 w-4" />
              <span>{capabilityCount} {capabilityCount === 1 ? 'capability' : 'capabilities'}</span>
            </div>
          )}
        </div>

        {/* Authentication */}
        {agent.authentication && agent.authentication.type !== 'none' && (
          <div className="flex items-center gap-2 text-sm">
            {authIcons[agent.authentication.type]}
            <span className="text-muted-foreground">
              {agent.authentication.required ? 'Authentication required' : 'Authentication optional'}
              {agent.authentication.description && `: ${agent.authentication.description}`}
            </span>
          </div>
        )}

        {/* Transport options */}
        {agent.transport && agent.transport.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.transport.map(transport => (
              <Badge key={transport} variant="outline" className="text-xs">
                {transport.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}

        {/* Sample tools/capabilities */}
        {agent.tools && agent.tools.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Available tools:</p>
            <div className="flex flex-wrap gap-1">
              {agent.tools.slice(0, 5).map(tool => (
                <Badge key={tool.name} variant="secondary" className="text-xs">
                  {tool.name}
                </Badge>
              ))}
              {agent.tools.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{agent.tools.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        {agent.metadata?.version && (
          <div className="text-xs text-muted-foreground">
            Version: {agent.metadata.version}
          </div>
        )}
        
        {/* Help text for added connections */}
        {isAlreadyConnected && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            ✓ Added to connections. Go to <span className="font-medium">Settings → Connections</span> to configure and activate.
          </div>
        )}
      </CardContent>
    </Card>
  );
}