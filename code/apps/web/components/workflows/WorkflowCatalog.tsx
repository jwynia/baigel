'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter,
  Play,
  Info,
  Loader2,
  AlertCircle,
  ChevronRight,
  Clock,
  Shield,
  Zap,
  Database
} from 'lucide-react';
import type { 
  StandardWorkflowDefinition,
  WorkflowAdapter
} from '@/types/workflows';
import type { DiscoveredAgent } from '@/types/discovery';
import { workflowAdapterRegistry } from '@/lib/adapters/workflow-adapter';

interface WorkflowCatalogProps {
  service: DiscoveredAgent;
  onSelectWorkflow: (workflow: StandardWorkflowDefinition) => void;
  className?: string;
}

const complexityColors = {
  simple: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

const complexityIcons = {
  simple: <Zap className="h-3 w-3" />,
  intermediate: <Clock className="h-3 w-3" />,
  advanced: <Shield className="h-3 w-3" />
};

export function WorkflowCatalog({ 
  service, 
  onSelectWorkflow,
  className = '' 
}: WorkflowCatalogProps) {
  const [workflows, setWorkflows] = useState<StandardWorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, [service]);

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the appropriate adapter for this service
      const metadata = service.metadata as any;
      const frameworkName = metadata?.frameworks?.[0] || metadata?.subProtocol || 'Generic';
      
      // For now, we'll use the Mastra adapter if it's a Mastra service
      // In a real implementation, this would use the registry
      if (frameworkName === 'Mastra' || service.name.includes('Mastra')) {
        // Dynamic import to avoid circular dependencies
        const { MastraAdapter } = await import('@/lib/adapters/mastra-adapter');
        const adapter = new MastraAdapter();
        
        // Connect to the service
        await adapter.connect({ baseUrl: service.baseUrl });
        
        // Discover workflows
        const discoveredWorkflows = await adapter.discoverWorkflows(service.baseUrl);
        setWorkflows(discoveredWorkflows);
      } else {
        setError('No adapter available for this workflow service type');
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  // Filter workflows based on search and category
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = !searchQuery || 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      workflow.metadata.category.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories and group workflows by MCP server
  const allCategories = Array.from(
    new Set(workflows.flatMap(w => w.metadata.category))
  );
  
  // Group workflows by their first category (usually the server/domain name)
  const workflowGroups = filteredWorkflows.reduce((groups, workflow) => {
    const primaryCategory = workflow.metadata.category[0] || 'Other';
    if (!groups[primaryCategory]) {
      groups[primaryCategory] = [];
    }
    groups[primaryCategory].push(workflow);
    return groups;
  }, {} as Record<string, StandardWorkflowDefinition[]>);
  
  const hasMultipleGroups = Object.keys(workflowGroups).length > 1;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Catalog</CardTitle>
          <CardDescription>
            Browse and execute workflows from {service.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              <Filter className="h-4 w-4 mr-2" />
              All Categories
            </Button>
          </div>

          {/* Category Pills */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {allCategories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Status Display */}
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <span>Loading workflows...</span>
            ) : error ? (
              <span className="text-red-600">Error: {error}</span>
            ) : (
              <span>
                Showing {filteredWorkflows.length} of {workflows.length} workflows
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={loadWorkflows}
              className="ml-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflows Grid */}
      {!loading && !error && filteredWorkflows.length > 0 && (
        <div className="space-y-8">
          {hasMultipleGroups ? (
            // Show grouped sections when there are multiple categories
            Object.entries(workflowGroups).map(([groupName, groupWorkflows]) => (
              <div key={groupName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{groupName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {groupWorkflows.length} workflow{groupWorkflows.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupWorkflows.map(workflow => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      onSelect={() => onSelectWorkflow(workflow)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show simple grid when there's only one category
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkflows.map(workflow => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onSelect={() => onSelectWorkflow(workflow)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredWorkflows.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory
                ? 'No workflows match your filters'
                : 'No workflows available from this service'}
            </p>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface WorkflowCardProps {
  workflow: StandardWorkflowDefinition;
  onSelect: () => void;
}

function WorkflowCard({ workflow, onSelect }: WorkflowCardProps) {
  const hasAuth = workflow.metadata.requiresAuth;
  const complexity = workflow.metadata.complexity;
  const estimatedDuration = workflow.metadata.estimatedDuration;

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-1">
            {workflow.name}
          </CardTitle>
          <Badge className={complexityColors[complexity]}>
            {complexityIcons[complexity]}
            <span className="ml-1">{complexity}</span>
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-sm">
          {workflow.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {workflow.metadata.category.slice(0, 3).map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {workflow.metadata.category.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{workflow.metadata.category.length - 3}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {estimatedDuration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>~{Math.ceil(estimatedDuration / 60)}min</span>
            </div>
          )}
          {hasAuth && (
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Auth Required</span>
            </div>
          )}
        </div>

        {/* Framework Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {workflow.framework.name} v{workflow.framework.version}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Play className="h-3 w-3 mr-1" />
            Execute
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Features */}
        {(workflow.metadata.supportsBatch || 
          workflow.metadata.supportsStreaming || 
          workflow.metadata.supportsCancel) && (
          <div className="flex gap-2 pt-2 border-t">
            {workflow.metadata.supportsBatch && (
              <Badge variant="outline" className="text-xs">
                Batch
              </Badge>
            )}
            {workflow.metadata.supportsStreaming && (
              <Badge variant="outline" className="text-xs">
                Streaming
              </Badge>
            )}
            {workflow.metadata.supportsCancel && (
              <Badge variant="outline" className="text-xs">
                Cancelable
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}