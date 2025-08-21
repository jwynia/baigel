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
  Sparkles
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

  const exampleUrls = getExampleUrls();

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
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Discovery failed');
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
                        <code className="text-sm font-mono">{example.url}</code>
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
            onClear={handleClearResults}
          />
        </CardContent>
      </Card>
    </div>
  );
}