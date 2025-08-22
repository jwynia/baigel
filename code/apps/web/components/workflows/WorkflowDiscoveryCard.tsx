'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Workflow, 
  Code, 
  Database, 
  FileJson,
  Play,
  Plus,
  ChevronRight,
  Check,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import type { DiscoveredAgent } from '@/types/discovery';
import { useConnectionStore } from '@/lib/stores/connections';
import { discoveredAgentToConnection, isAgentAlreadyConnected } from '@/lib/utils/discovery-to-connection';

interface WorkflowDiscoveryCardProps {
  service: DiscoveredAgent;
  isSelected?: boolean;
  onExplore: (service: DiscoveredAgent) => void;
  onToggleSelect?: (serviceId: string) => void;
}

const frameworkIcons: Record<string, React.ReactNode> = {
  'Mastra': <Code className="h-4 w-4" />,
  'OpenAPI': <FileJson className="h-4 w-4" />,
  'Generic': <Database className="h-4 w-4" />,
  'SpiffWorkflow': <Workflow className="h-4 w-4" />,
  'n8n': <Workflow className="h-4 w-4" />,
};

const frameworkColors: Record<string, string> = {
  'Mastra': 'bg-purple-500',
  'OpenAPI': 'bg-blue-500',
  'Generic': 'bg-gray-500',
  'SpiffWorkflow': 'bg-green-500',
  'n8n': 'bg-orange-500',
};

export function WorkflowDiscoveryCard({ 
  service, 
  isSelected, 
  onExplore, 
  onToggleSelect 
}: WorkflowDiscoveryCardProps) {
  const { connections, addConnection } = useConnectionStore();
  
  // Extract workflow-specific metadata
  const metadata = service.metadata as any;
  const subProtocol = metadata?.subProtocol || 'Generic';
  const workflowCount = metadata?.workflowCount || 0;
  const frameworks = metadata?.frameworks || [];
  const schemaSupport = metadata?.schemaSupport;
  
  const frameworkIcon = frameworkIcons[subProtocol] || <Workflow className="h-4 w-4" />;
  const frameworkColor = frameworkColors[subProtocol] || 'bg-gray-500';
  const isAlreadyConnected = isAgentAlreadyConnected(service, connections);

  const handleAddToConnections = () => {
    if (isAlreadyConnected) return;
    
    const connectionData = discoveredAgentToConnection(service);
    addConnection(connectionData);
  };

  return (
    <Card className={`relative transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {frameworkIcon}
              {service.name}
              <Badge variant="secondary" className={`${frameworkColor} text-white`}>
                {subProtocol}
              </Badge>
            </CardTitle>
            {service.description && (
              <CardDescription className="mt-1">{service.description}</CardDescription>
            )}
          </div>
          {onToggleSelect && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleSelect(service.id)}
            >
              {isSelected ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Workflow Service Metadata */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            <Workflow className="h-3 w-3 mr-1" />
            {workflowCount} workflows
          </Badge>
          
          {frameworks.map((framework: string) => (
            <Badge key={framework} variant="secondary" className="text-xs">
              {framework}
            </Badge>
          ))}
          
          {!service.authentication?.required && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              No Auth Required
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schema Support Indicators */}
        {schemaSupport && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Schema Support:</span>
            <div className="flex gap-2">
              {schemaSupport.input && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  Input
                </Badge>
              )}
              {schemaSupport.output && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  Output
                </Badge>
              )}
              {schemaSupport.validation && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  Validation
                </Badge>
              )}
              {schemaSupport.uiHints && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  UI Hints
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Capabilities */}
        {service.capabilities && service.capabilities.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Capabilities:</span>
            <div className="flex flex-wrap gap-1">
              {service.capabilities.slice(0, 5).map((capability) => (
                <Badge key={capability} variant="secondary" className="text-xs">
                  {capability.replace('workflow:', '')}
                </Badge>
              ))}
              {service.capabilities.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{service.capabilities.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Base URL */}
        <div className="text-sm">
          <span className="text-muted-foreground">Endpoint:</span>
          <p className="font-mono text-xs mt-1 break-all">{service.baseUrl}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onExplore(service)}
            className="flex-1"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Explore Workflows
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToConnections}
            disabled={isAlreadyConnected}
            title={isAlreadyConnected ? 'Already in connections' : 'Add to connection manager'}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Show workflow service details
              console.log('Show details for:', service);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Warning for missing schema support */}
        {schemaSupport && (!schemaSupport.input || !schemaSupport.validation) && (
          <div className="flex items-center gap-2 text-xs text-yellow-600">
            <AlertCircle className="h-3 w-3" />
            <span>Limited schema support may affect form generation</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}