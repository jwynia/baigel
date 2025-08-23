'use client';

import React, { useState } from 'react';
import { AgentDiscovery } from '@/components/discovery/AgentDiscovery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Info, Trash2 } from 'lucide-react';
import type { AgentConfiguration } from '@/types/discovery';
import { useConnectionStore } from '@/lib/stores/connections';
import { agentConfigurationToConnection } from '@/lib/utils/discovery-to-connection';
import { AppLayout } from '@/components/layout/AppLayout';

export default function DiscoveryPage() {
  const [addedAgents, setAddedAgents] = useState<AgentConfiguration[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const { addConnection } = useConnectionStore();

  const handleAgentAdded = (config: AgentConfiguration) => {
    // Add to local state for UI feedback
    setAddedAgents(prev => [...prev, config]);
    setLastAdded(config.name);
    setTimeout(() => setLastAdded(null), 3000);

    // Add to connection store
    try {
      const connectionData = agentConfigurationToConnection(config);
      addConnection(connectionData);
    } catch (error) {
      console.error('Failed to add connection:', error);
    }
  };

  const handleMultipleAgentsAdded = (configs: AgentConfiguration[]) => {
    // Add to local state for UI feedback
    setAddedAgents(prev => [...prev, ...configs]);
    setLastAdded(`${configs.length} agents`);
    setTimeout(() => setLastAdded(null), 3000);

    // Add all to connection store
    try {
      configs.forEach(config => {
        // Use full connection data if available (from Add All), otherwise convert
        const configWithData = config as AgentConfiguration & { _fullConnectionData?: any };
        const connectionData = configWithData._fullConnectionData || agentConfigurationToConnection(config);
        addConnection(connectionData);
      });
    } catch (error) {
      console.error('Failed to add connections:', error);
    }
  };

  const handleRemoveAgent = (id: string) => {
    setAddedAgents(prev => prev.filter(agent => agent.id !== id));
    // Note: This only removes from local UI state, not from connection store
    // Users should manage actual connections in the Settings page
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div>
            <h1 className="text-lg font-semibold">Agent & Tool Discovery</h1>
            <p className="text-sm text-muted-foreground">
              Discover and configure AI agents and tools
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-8 space-y-6">
        {/* Success Alert */}
        {lastAdded && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              {lastAdded} added to your configuration
            </AlertDescription>
          </Alert>
        )}

        {/* Discovery Component */}
        <AgentDiscovery 
          onAgentAdded={handleAgentAdded}
          onMultipleAgentsAdded={handleMultipleAgentsAdded}
        />

        {/* Configured Agents */}
        {addedAgents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Configured Agents</CardTitle>
              <CardDescription>
                These agents have been added to your configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {addedAgents.map(agent => (
                  <div 
                    key={agent.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.baseUrl}
                        </div>
                      </div>
                      <Badge variant="outline">{agent.protocol}</Badge>
                      {agent.enabled && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Enabled
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAgent(agent.id)}
                      aria-label="Remove agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How Discovery Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              The discovery system automatically probes multiple endpoints to identify available services:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>MCP Servers:</strong> Checks for /v1/models, /tools/list, and /resources/list endpoints</li>
              <li><strong>A2A Agents:</strong> Looks for agent cards at /.well-known/agent-card.json</li>
              <li><strong>OpenAI-Compatible:</strong> Detects APIs following the OpenAI specification</li>
              <li><strong>Registries:</strong> Searches for agent catalogs and service registries</li>
            </ul>
            <p className="mt-3">
              Discovery runs in parallel for fast results and gracefully handles errors when endpoints aren't available.
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}