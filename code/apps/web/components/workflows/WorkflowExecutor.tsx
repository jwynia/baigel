'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Code,
  FileText
} from 'lucide-react';
import type { 
  StandardWorkflowDefinition,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  WorkflowExecutionState,
  ExecutionStatus
} from '@/types/workflows';
import { UniversalFormRenderer } from './UniversalFormRenderer';
import { ExecutionProgress } from './ExecutionProgress';
import { ResultsDisplay } from './ResultsDisplay';

interface WorkflowExecutorProps {
  workflow: StandardWorkflowDefinition;
  onExecute?: (request: WorkflowExecutionRequest) => Promise<WorkflowExecutionResult>;
  onCancel?: (executionId: string) => Promise<boolean>;
  className?: string;
}

const statusIcons: Record<ExecutionStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  running: <Play className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  cancelled: <Square className="h-4 w-4 text-gray-500" />,
  timeout: <AlertCircle className="h-4 w-4 text-orange-500" />,
  retrying: <Play className="h-4 w-4 text-yellow-500 animate-pulse" />
};

const complexityColors = {
  simple: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

export function WorkflowExecutor({ 
  workflow, 
  onExecute, 
  onCancel, 
  className = '' 
}: WorkflowExecutorProps) {
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    workflowId: workflow.id,
    definition: workflow,
    formData: {},
    isExecuting: false
  });

  const [activeTab, setActiveTab] = useState<'execute' | 'schema' | 'docs'>('execute');

  const handleFormDataChange = useCallback((formData: Record<string, any>) => {
    setExecutionState(prev => ({
      ...prev,
      formData,
      validation: undefined // Clear validation when form changes
    }));
  }, []);

  const handleValidationChange = useCallback((validation: any) => {
    setExecutionState(prev => ({
      ...prev,
      validation
    }));
  }, []);

  const handleExecute = useCallback(async () => {
    if (!onExecute) return;

    setExecutionState(prev => ({
      ...prev,
      isExecuting: true,
      result: undefined,
      error: undefined
    }));

    try {
      const request: WorkflowExecutionRequest = {
        workflowId: workflow.id,
        inputs: executionState.formData,
        options: {
          timeout: 30000, // 30 second default timeout
          async: false
        },
        context: {
          sessionId: `session-${Date.now()}`,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      };

      const result = await onExecute(request);
      
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        executionId: result.executionId,
        result,
        error: result.error
      }));
    } catch (error) {
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'execution',
          recoverable: true
        }
      }));
    }
  }, [workflow.id, executionState.formData, onExecute]);

  const handleCancel = useCallback(async () => {
    if (!onCancel || !executionState.executionId) return;

    try {
      const cancelled = await onCancel(executionState.executionId);
      if (cancelled) {
        setExecutionState(prev => ({
          ...prev,
          isExecuting: false,
          result: {
            ...prev.result,
            executionId: prev.executionId!,
            workflowId: workflow.id,
            success: false,
            outputs: {},
            metadata: {
              startTime: new Date().toISOString(),
              status: 'cancelled'
            }
          } as WorkflowExecutionResult
        }));
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  }, [executionState.executionId, onCancel, workflow.id]);

  const canExecute = !executionState.isExecuting && 
    (!executionState.validation || executionState.validation.valid) &&
    onExecute;

  const currentStatus = executionState.result?.metadata?.status || 
    (executionState.isExecuting ? 'running' : 'pending');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3">
                {workflow.name}
                <Badge className={complexityColors[workflow.metadata.complexity]}>
                  {workflow.metadata.complexity}
                </Badge>
                <Badge variant="outline">
                  {workflow.framework.name}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                {workflow.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {statusIcons[currentStatus]}
              <span className="text-sm font-medium capitalize">
                {currentStatus}
              </span>
            </div>
          </div>
          
          {/* Workflow Metadata */}
          <div className="flex flex-wrap gap-2 mt-4">
            {workflow.metadata.category.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {workflow.metadata.estimatedDuration && (
              <Badge variant="outline" className="text-xs">
                ~{Math.ceil(workflow.metadata.estimatedDuration / 60)}min
              </Badge>
            )}
            {workflow.metadata.requiresAuth && (
              <Badge variant="outline" className="text-xs text-orange-600">
                Auth Required
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="execute" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Execute
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="execute" className="space-y-6">
          {/* Execution Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Workflow Inputs
                </CardTitle>
                <CardDescription>
                  Configure the parameters for this workflow execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UniversalFormRenderer
                  schema={workflow.inputSchema}
                  formData={executionState.formData}
                  onFormDataChange={handleFormDataChange}
                  onValidationChange={handleValidationChange}
                  disabled={executionState.isExecuting}
                />
                
                {/* Execution Controls */}
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button
                    onClick={handleExecute}
                    disabled={!canExecute}
                    className="flex-1"
                  >
                    {executionState.isExecuting ? (
                      <>
                        <Play className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute Workflow
                      </>
                    )}
                  </Button>
                  
                  {executionState.isExecuting && onCancel && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="px-3"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Validation Errors */}
                {executionState.validation && !executionState.validation.valid && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fix the following errors:
                      <ul className="list-disc list-inside mt-2">
                        {executionState.validation.errors.map((error, idx) => (
                          <li key={idx} className="text-sm">
                            <strong>{error.field}:</strong> {error.message}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Execution Results
                </CardTitle>
                <CardDescription>
                  View the output and status of your workflow execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {executionState.isExecuting && (
                  <ExecutionProgress
                    executionId={executionState.executionId}
                    status={currentStatus}
                  />
                )}
                
                {executionState.result && (
                  <ResultsDisplay result={executionState.result} />
                )}
                
                {executionState.error && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Execution Error:</strong> {executionState.error.message}
                      {executionState.error.recoverable && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          This error may be recoverable. Try adjusting your inputs and executing again.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {!executionState.isExecuting && !executionState.result && !executionState.error && (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Results will appear here after execution</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Input Schema</CardTitle>
              <CardDescription>
                JSON Schema definition for workflow inputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(workflow.inputSchema, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {workflow.outputSchema && (
            <Card>
              <CardHeader>
                <CardTitle>Output Schema</CardTitle>
                <CardDescription>
                  JSON Schema definition for workflow outputs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(workflow.outputSchema, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Learn how to use this workflow effectively
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              {workflow.documentation?.examples && workflow.documentation.examples.length > 0 && (
                <div>
                  <h3>Examples</h3>
                  {workflow.documentation.examples.map((example, idx) => (
                    <div key={idx} className="mb-4 p-4 border rounded-md">
                      <h4 className="font-medium">{example.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {example.description}
                      </p>
                      <div className="text-sm">
                        <strong>Inputs:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(example.inputs, null, 2)}
                        </pre>
                      </div>
                      {example.expectedOutputs && (
                        <div className="text-sm mt-2">
                          <strong>Expected Outputs:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(example.expectedOutputs, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {workflow.documentation?.url && (
                <div>
                  <h3>External Documentation</h3>
                  <p>
                    <a 
                      href={workflow.documentation.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View full documentation →
                    </a>
                  </p>
                </div>
              )}
              
              <div>
                <h3>Framework Information</h3>
                <ul>
                  <li><strong>Framework:</strong> {workflow.framework.name} v{workflow.framework.version}</li>
                  <li><strong>Adapter:</strong> {workflow.framework.adapter}</li>
                  <li><strong>Endpoint:</strong> {workflow.framework.endpoint}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}