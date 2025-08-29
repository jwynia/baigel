'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Home, 
  MessageSquare, 
  Search, 
  Settings,
  Workflow,
  ArrowLeft,
  Info,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import type { DiscoveredAgent } from '@/types/discovery';
import type { 
  StandardWorkflowDefinition,
  WorkflowExecutionRequest,
  WorkflowExecutionResult
} from '@/types/workflows';
import { WorkflowDiscoveryCard } from '@/components/workflows/WorkflowDiscoveryCard';
import { WorkflowCatalog } from '@/components/workflows/WorkflowCatalog';
import { WorkflowExecutor } from '@/components/workflows/WorkflowExecutor';
import { useWorkflowDiscovery } from '@/hooks/useWorkflowDiscovery';

export default function WorkflowsPage() {
  const [selectedService, setSelectedService] = useState<DiscoveredAgent | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<StandardWorkflowDefinition | null>(null);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [manualServiceUrl, setManualServiceUrl] = useState('');
  const [manualServiceName, setManualServiceName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use the workflow discovery hook
  const {
    services,
    isDiscovering,
    error,
    lastDiscoveryTime,
    discoverServices,
    addManualService,
    removeService,
    clearServices
  } = useWorkflowDiscovery({
    autoDiscover: false, // Don't auto-discover on mount
    persistToStorage: true,
    includeMockData: false // Start with real discovery only
  });

  // Auto-discover if no services on mount
  useEffect(() => {
    if (services.length === 0 && !lastDiscoveryTime) {
      discoverServices();
    }
  }, [discoverServices, lastDiscoveryTime, services.length]);

  const handleExploreService = (service: DiscoveredAgent) => {
    setSelectedService(service);
    setSelectedWorkflow(null);
  };

  const handleSelectWorkflow = (workflow: StandardWorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    setExecutionModalOpen(true);
  };

  const handleExecuteWorkflow = async (request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult> => {
    // Get the appropriate adapter for the selected service
    if (!selectedService) {
      throw new Error('No service selected');
    }

    try {
      // Dynamic import to avoid circular dependencies
      const { MastraAdapter } = await import('@/lib/adapters/mastra-adapter');
      const adapter = new MastraAdapter();
      
      // Connect to the service
      await adapter.connect({ baseUrl: selectedService.baseUrl });
      
      // Execute the workflow
      const result = await adapter.executeWorkflow(request);
      
      // Show success message
      setSuccessMessage('Workflow executed successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      return result;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  };

  const handleAddManualService = async () => {
    if (!manualServiceUrl) return;

    const service = await addManualService(manualServiceUrl, manualServiceName);
    if (service) {
      setAddServiceModalOpen(false);
      setManualServiceUrl('');
      setManualServiceName('');
      setSuccessMessage(`Added ${service.name} successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleRemoveService = (serviceId: string) => {
    removeService(serviceId);
    if (selectedService?.id === serviceId) {
      setSelectedService(null);
    }
  };

  const handleDiscoverServices = async () => {
    const discovered = await discoverServices();
    if (discovered.length > 0) {
      setSuccessMessage(`Discovered ${discovered.length} workflow service(s)!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
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
                <DropdownMenuItem asChild>
                  <Link href="/workflows" className="flex items-center">
                    <Workflow className="mr-2 h-4 w-4" />
                    <span>Workflows</span>
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
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow Execution
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedService 
                  ? `Browsing ${selectedService.name}`
                  : 'Discover and execute workflows'}
              </p>
            </div>
          </div>

          {selectedService && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedService(null);
                setSelectedWorkflow(null);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 space-y-6 flex-1">
        {/* Success Messages */}
        {successMessage && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {error && !isDiscovering && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedService ? (
          <>
            {/* Service Discovery View */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Available Workflow Services</CardTitle>
                      <CardDescription>
                        {services.length > 0 
                          ? `${services.length} workflow service(s) available`
                          : 'No workflow services discovered yet'}
                        {lastDiscoveryTime && (
                          <span className="text-xs text-muted-foreground ml-2">
                            Last checked: {new Date(lastDiscoveryTime).toLocaleTimeString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDiscoverServices}
                        disabled={isDiscovering}
                      >
                        {isDiscovering ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Discovering...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                      {services.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearServices}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Loading State */}
              {isDiscovering && services.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Discovering workflow services...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Checking known endpoints for Mastra, OpenAPI, and other workflow systems
                    </p>
                  </div>
                </div>
              )}

              {/* Workflow Services Grid */}
              {!isDiscovering && services.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map(service => (
                    <div key={service.id} className="relative">
                      <WorkflowDiscoveryCard
                        service={service}
                        onExplore={handleExploreService}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Discovery Action */}
              {!isDiscovering && (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {services.length === 0 ? 'No Services Found' : 'Add More Services'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {services.length === 0 
                        ? 'Discovery will check for Mastra at http://100.80.122.46:4111'
                        : 'Find more workflow services or add them manually'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={handleDiscoverServices}
                        disabled={isDiscovering}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {services.length === 0 ? 'Run Discovery' : 'Discover More'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setAddServiceModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Manually
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info Card */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    About Workflow Execution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    The workflow system enables execution of structured tasks from various frameworks:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Mastra:</strong> MCP tools exposed as workflows with JSON schemas</li>
                    <li><strong>OpenAPI:</strong> Any service with OpenAPI workflow definitions</li>
                    <li><strong>SpiffWorkflow:</strong> BPMN-based process automation (coming soon)</li>
                    <li><strong>n8n:</strong> Node-based workflow automation (coming soon)</li>
                  </ul>
                  <p className="mt-3">
                    Workflows provide form-driven execution with structured inputs and outputs,
                    unlike conversational AI interactions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Workflow Catalog View */}
            <WorkflowCatalog
              service={selectedService}
              onSelectWorkflow={handleSelectWorkflow}
            />
          </>
        )}
      </div>

      {/* Workflow Execution Modal */}
      <Dialog open={executionModalOpen} onOpenChange={setExecutionModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execute Workflow</DialogTitle>
          </DialogHeader>
          {selectedWorkflow && (
            <WorkflowExecutor
              workflow={selectedWorkflow}
              onExecute={handleExecuteWorkflow}
              onCancel={async () => {
                console.log('Cancelling workflow');
                return true;
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Service Modal */}
      <Dialog open={addServiceModalOpen} onOpenChange={setAddServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Workflow Service</DialogTitle>
            <DialogDesc>
              Enter the URL of a workflow service endpoint (Mastra, OpenAPI, etc.)
            </DialogDesc>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-url">Service URL</Label>
              <Input
                id="service-url"
                placeholder="http://100.80.122.46:4111"
                value={manualServiceUrl}
                onChange={(e) => setManualServiceUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the base URL of your workflow service
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name (optional)</Label>
              <Input
                id="service-name"
                placeholder="My Workflow Service"
                value={manualServiceName}
                onChange={(e) => setManualServiceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give your service a friendly name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddServiceModalOpen(false);
                setManualServiceUrl('');
                setManualServiceName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddManualService}
              disabled={!manualServiceUrl || isDiscovering}
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}