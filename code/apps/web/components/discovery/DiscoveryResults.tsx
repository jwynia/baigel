'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react';
import { DiscoveryCard } from './DiscoveryCard';
import type { ProbeResult, DiscoveredAgent, DiscoveryStatus } from '@/types/discovery';

interface DiscoveryResultsProps {
  status: DiscoveryStatus;
  result?: ProbeResult;
  selectedAgents: string[];
  onAddAgent: (agent: DiscoveredAgent) => void;
  onToggleSelect?: (agentId: string) => void;
  onAddSelected?: () => void;
  onClear?: () => void;
}

const statusIcons: Record<DiscoveryStatus, React.ReactNode> = {
  idle: <Search className="h-5 w-5" />,
  probing: <Loader2 className="h-5 w-5 animate-spin" />,
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  error: <XCircle className="h-5 w-5 text-red-600" />,
  partial: <AlertCircle className="h-5 w-5 text-yellow-600" />,
};

const statusMessages: Record<DiscoveryStatus, string> = {
  idle: 'Enter a URL above to discover agents and tools',
  probing: 'Discovering agents and tools...',
  success: 'Discovery complete',
  error: 'Discovery failed',
  partial: 'Partial discovery results',
};

export function DiscoveryResults({
  status,
  result,
  selectedAgents,
  onAddAgent,
  onToggleSelect,
  onAddSelected,
  onClear,
}: DiscoveryResultsProps) {
  const hasResults = result && result.agents.length > 0;
  const hasErrors = result && result.errors.length > 0;
  const hasSelection = selectedAgents.length > 0;

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Ready to discover</p>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a base URL above and click "Discover" to find available agents and tools
        </p>
      </div>
    );
  }

  if (status === 'probing') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Discovering agents and tools...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Probing endpoints for available services
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Alert */}
      <Alert variant={status === 'error' ? 'destructive' : 'default'}>
        <div className="flex items-center gap-2">
          {statusIcons[status]}
          <AlertTitle>{statusMessages[status]}</AlertTitle>
        </div>
        {result && (
          <AlertDescription className="mt-2">
            {hasResults && (
              <span>
                Found {result.agents.length} {result.agents.length === 1 ? 'agent' : 'agents'} 
                {result.duration && ` in ${(result.duration / 1000).toFixed(1)}s`}
              </span>
            )}
            {!hasResults && hasErrors && (
              <span>No agents found. Check the URL and try again.</span>
            )}
            {!hasResults && !hasErrors && (
              <span>No agents or tools found at this URL.</span>
            )}
          </AlertDescription>
        )}
      </Alert>

      {/* Error Details */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errors encountered</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            {result.errors.slice(0, 3).map((error, index) => (
              <div key={index} className="text-xs">
                • {error.endpoint}: {error.error}
              </div>
            ))}
            {result.errors.length > 3 && (
              <div className="text-xs">
                ...and {result.errors.length - 3} more errors
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Bar */}
      {(hasResults || hasSelection) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasSelection && (
              <span>{selectedAgents.length} selected</span>
            )}
          </div>
          <div className="flex gap-2">
            {hasSelection && onAddSelected && (
              <Button onClick={onAddSelected} size="sm">
                Add {selectedAgents.length} Selected
              </Button>
            )}
            {onClear && (
              <Button onClick={onClear} variant="outline" size="sm">
                Clear Results
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {hasResults && (
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid gap-4 md:grid-cols-2">
            {result.agents.map(agent => (
              <DiscoveryCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgents.includes(agent.id)}
                onAdd={onAddAgent}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}