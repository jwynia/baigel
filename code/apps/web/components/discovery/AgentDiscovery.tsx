'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Globe,
  Loader2,
  Search,
  HelpCircle,
  Sparkles,
  BookmarkPlus,
  Star
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DiscoveryResults } from './DiscoveryResults';
import { probeForAgents, isValidUrl, getExampleUrls } from '@/lib/discovery/prober';
import { discoveredAgentToConnection } from '@/lib/utils/discovery-to-connection';
import { useDiscoveryPreferencesStore } from '@/lib/stores/discovery-preferences';
import type {
  ProbeResult,
  DiscoveryStatus,
  DiscoveredAgent,
  AgentConfiguration
} from '@/types/discovery';

interface AgentDiscoveryProps {
  onAgentAdded?: (config: AgentConfiguration) => void;
  onMultipleAgentsAdded?: (configs: AgentConfiguration[]) => void;
}

export function AgentDiscovery({ 
  onAgentAdded, 
  onMultipleAgentsAdded 
}: AgentDiscoveryProps) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [result, setResult] = useState<ProbeResult | undefined>();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showRememberOption, setShowRememberOption] = useState(false);

  const exampleUrls = getExampleUrls();
  const { addSavedEndpoint, recordDiscovery } = useDiscoveryPreferencesStore();

  const handleDiscover = useCallback(async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., http://localhost:3001)');
      return;
    }

    setError(null);
    setStatus('probing');
    setSelectedAgents([]);

    try {
      const probeResult = await probeForAgents({
        baseUrl: url,
        timeout: 5000,
        parallel: true,
      });

      setResult(probeResult);
      setStatus(probeResult.status);

      // Record discovery in preferences store
      const hasAgents = probeResult.agents.length > 0;
      recordDiscovery(url, hasAgents, probeResult.agents[0]?.protocol);

      // Show remember option for successful discoveries
      if (hasAgents) {
        setShowRememberOption(true);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Discovery failed');

      // Record failed discovery
      recordDiscovery(url, false);

      setResult({
        status: 'error',
        agents: [],
        errors: [{
          endpoint: url,
          protocol: 'Unknown',
          error: err instanceof Error ? err.message : 'Unknown error'
        }],
        duration: 0
      });
    }
  }, [url]);

  const handleAddAgent = useCallback((agent: DiscoveredAgent) => {
    if (!onAgentAdded) return;

    const config: AgentConfiguration = {
      id: agent.id,
      name: agent.name,
      enabled: true,
      baseUrl: agent.baseUrl,
      protocol: agent.protocol,
      authentication: agent.authentication ? {
        type: agent.authentication.type,
        credentials: {}
      } : undefined,
      transport: agent.transport?.[0],
      selectedTools: agent.tools?.map(t => t.name),
    };

    onAgentAdded(config);
  }, [onAgentAdded]);

  const handleToggleSelect = useCallback((agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  }, []);

  const handleAddSelected = useCallback(() => {
    if (!onMultipleAgentsAdded || !result) return;

    const configs: AgentConfiguration[] = result.agents
      .filter(agent => selectedAgents.includes(agent.id))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        enabled: true,
        baseUrl: agent.baseUrl,
        protocol: agent.protocol,
        authentication: agent.authentication ? {
          type: agent.authentication.type,
          credentials: {}
        } : undefined,
        transport: agent.transport?.[0],
        selectedTools: agent.tools?.map(t => t.name),
      }));

    onMultipleAgentsAdded(configs);
    setSelectedAgents([]);
  }, [selectedAgents, result, onMultipleAgentsAdded]);

  const handleAddAll = useCallback(() => {
    console.log('DEBUG - handleAddAll called with result:', result);
    if (!onMultipleAgentsAdded || !result) return;

    // Use the same conversion as individual adds to preserve tool schemas
    const configs: AgentConfiguration[] = result.agents.map(agent => {
      console.log('DEBUG - Processing agent in handleAddAll:', agent.name, 'tools:', agent.tools?.length);
      const connectionData = discoveredAgentToConnection(agent);
      return {
        id: agent.id,
        name: agent.name,
        enabled: true,
        baseUrl: agent.baseUrl,
        protocol: agent.protocol,
        authentication: agent.authentication ? {
          type: agent.authentication.type,
          credentials: {}
        } : undefined,
        transport: agent.transport?.[0],
        selectedTools: agent.tools?.map(t => t.name),
        // Store the full connection data for proper conversion
        _fullConnectionData: connectionData
      } as AgentConfiguration & { _fullConnectionData: any };
    });

    onMultipleAgentsAdded(configs);
    setSelectedAgents([]);
  }, [result, onMultipleAgentsAdded]);

  const handleSelectAll = useCallback(() => {
    if (!result) return;
    setSelectedAgents(result.agents.map(agent => agent.id));
  }, [result]);

  const handleDeselectAll = useCallback(() => {
    setSelectedAgents([]);
  }, []);

  const handleClearResults = useCallback(() => {
    setStatus('idle');
    setResult(undefined);
    setSelectedAgents([]);
    setError(null);
  }, []);

  const handleExampleClick = useCallback((exampleUrl: string) => {
    setUrl(exampleUrl);
    setShowExamples(false);
  }, []);

  const handleRememberEndpoint = useCallback(() => {
    if (url && result?.agents.length > 0) {
      const protocol = result.agents[0]?.protocol || 'Unknown';
      const description = `${protocol} service at ${new URL(url).hostname}`;
      addSavedEndpoint(url, description);
      setShowRememberOption(false);
    }
  }, [url, result, addSavedEndpoint]);

  return (
    <div className="space-y-6">
      {/* Discovery Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Discover Agents & Tools
          </CardTitle>
          <CardDescription>
            Enter a base URL to automatically discover available agents, tools, and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="url"
                placeholder="https://example.com or http://localhost:3001"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
                disabled={status === 'probing'}
                className={error ? 'border-red-500' : ''}
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show example URLs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              onClick={handleDiscover}
              disabled={status === 'probing' || !url}
            >
              {status === 'probing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Discover
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Example URLs */}
          <Collapsible open={showExamples} onOpenChange={setShowExamples}>
            <CollapsibleContent>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium mb-2">Example URLs:</p>
                <div className="space-y-1">
                  {exampleUrls.map((example) => (
                    <button
                      key={example.url}
                      onClick={() => handleExampleClick(example.url)}
                      className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{example.url}</code>
                          {'source' in example && example.source === 'user' && (
                            <Star className="h-3 w-3 text-amber-500" title="Saved endpoint" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {example.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Protocol Info */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Automatically detects MCP servers, A2A agents, OpenAI-compatible APIs, and more.
                </p>
                <p>
                  Discovery checks well-known endpoints and registry paths to find available services.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remember Endpoint Option */}
      {showRememberOption && result?.agents.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <BookmarkPlus className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-green-900">
                    Discovery Successful!
                  </h4>
                  <p className="text-sm text-green-700">
                    Found {result.agents.length} agent{result.agents.length === 1 ? '' : 's'} at <code className="px-1 py-0.5 bg-green-100 rounded text-xs">{url}</code>
                  </p>
                  <p className="text-xs text-green-600">
                    Save this endpoint for faster discovery next time?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRememberOption(false)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  Not now
                </Button>
                <Button
                  size="sm"
                  onClick={handleRememberEndpoint}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Remember
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discovery Results */}
      <Card>
        <CardHeader>
          <CardTitle>Discovery Results</CardTitle>
        </CardHeader>
        <CardContent>
          <DiscoveryResults
            status={status}
            result={result}
            selectedAgents={selectedAgents}
            onAddAgent={handleAddAgent}
            onToggleSelect={onMultipleAgentsAdded ? handleToggleSelect : undefined}
            onAddSelected={onMultipleAgentsAdded ? handleAddSelected : undefined}
            onAddAll={onMultipleAgentsAdded ? handleAddAll : undefined}
            onSelectAll={onMultipleAgentsAdded ? handleSelectAll : undefined}
            onDeselectAll={onMultipleAgentsAdded ? handleDeselectAll : undefined}
            onClear={handleClearResults}
          />
        </CardContent>
      </Card>
    </div>
  );
}