'use client';

import React, { useState } from 'react';
import { AgentDiscovery } from '@/components/discovery/AgentDiscovery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, Info, Trash2, Menu, Search, Settings, Home, MessageSquare } from 'lucide-react';
import Link from 'next/link';
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
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/chat" className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Chat</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/discovery" className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    <span>Discovery</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div>
              <h1 className="text-lg font-semibold">Agent & Tool Discovery</h1>
              <p className="text-sm text-muted-foreground">
                Discover and configure AI agents and tools
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 space-y-6 flex-1">
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
  );
}