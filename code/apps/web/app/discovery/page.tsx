'use client';

import React, { useState } from 'react';
import { AgentDiscovery } from '@/components/discovery/AgentDiscovery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgentConfiguration } from '@/types/discovery';

export default function DiscoveryPage() {
  const [addedAgents, setAddedAgents] = useState<AgentConfiguration[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const handleAgentAdded = (config: AgentConfiguration) => {
    setAddedAgents(prev => [...prev, config]);
    setLastAdded(config.name);
    setTimeout(() => setLastAdded(null), 3000);
  };

  const handleMultipleAgentsAdded = (configs: AgentConfiguration[]) => {
    setAddedAgents(prev => [...prev, ...configs]);
    setLastAdded(`${configs.length} agents`);
    setTimeout(() => setLastAdded(null), 3000);
  };

  const handleRemoveAgent = (id: string) => {
    setAddedAgents(prev => prev.filter(agent => agent.id !== id));
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Agent & Tool Discovery</h1>
        <p className="text-muted-foreground">
          Automatically discover and configure agents, tools, and services from any URL
        </p>
      </div>

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
  );
}