'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Activity,
  Eye,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react';
import type { 
  WorkflowExecutionResult,
  ExecutionLog
} from '@/types/workflows';

interface ResultsDisplayProps {
  result: WorkflowExecutionResult;
  className?: string;
}

const logLevelColors = {
  debug: 'text-gray-500',
  info: 'text-blue-600',
  warn: 'text-yellow-600',
  error: 'text-red-600'
};

const logLevelIcons = {
  debug: <Info className="h-3 w-3" />,
  info: <Info className="h-3 w-3" />,
  warn: <AlertTriangle className="h-3 w-3" />,
  error: <AlertCircle className="h-3 w-3" />
};

export function ResultsDisplay({ result, className = '' }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'outputs' | 'metadata' | 'logs'>('outputs');
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  const duration = result.metadata.duration || 
    (result.metadata.endTime && result.metadata.startTime ? 
      new Date(result.metadata.endTime).getTime() - new Date(result.metadata.startTime).getTime() : 
      undefined);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Result Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">
            {result.success ? 'Execution Successful' : 'Execution Failed'}
          </span>
          <Badge variant={result.success ? 'default' : 'destructive'}>
            {result.metadata.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadAsJson(result, `workflow-result-${result.executionId}.json`)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">
                {duration ? formatDuration(duration) : 'Unknown'}
              </p>
            </div>
          </div>
        </Card>
        
        {result.metadata.cost && (
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="font-medium">
                  {result.metadata.cost.amount} {result.metadata.cost.currency}
                </p>
              </div>
            </div>
          </Card>
        )}
        
        {result.metadata.logs && (
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Log Entries</p>
                <p className="font-medium">{result.metadata.logs.length}</p>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Outputs</p>
              <p className="font-medium">
                {Object.keys(result.outputs || {}).length} fields
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Display */}
      {result.error && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Execution Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Error Code:</span>
                <Badge variant="destructive" className="ml-2">
                  {result.error.code}
                </Badge>
              </div>
              <div>
                <span className="text-sm font-medium">Message:</span>
                <p className="text-sm mt-1">{result.error.message}</p>
              </div>
              {result.error.details && (
                <div>
                  <span className="text-sm font-medium">Details:</span>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(result.error.details, null, 2)}
                  </pre>
                </div>
              )}
              {result.error.recoverable && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This error may be recoverable. Try adjusting inputs and re-executing.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="outputs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Outputs</CardTitle>
              <CardDescription>
                The data returned by the workflow execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(result.outputs || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(result.outputs).map(([key, value]) => (
                    <div key={key} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{key}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm">
                        {typeof value === 'string' ? (
                          <p className="whitespace-pre-wrap">{value}</p>
                        ) : (
                          <ScrollArea className="h-32">
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No outputs returned by this workflow</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Metadata</CardTitle>
              <CardDescription>
                Detailed information about the workflow execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Execution ID:</span>
                  <p className="text-xs font-mono mt-1 break-all">{result.executionId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Workflow ID:</span>
                  <p className="text-xs font-mono mt-1 break-all">{result.workflowId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Start Time:</span>
                  <p className="text-sm mt-1">{new Date(result.metadata.startTime).toLocaleString()}</p>
                </div>
                {result.metadata.endTime && (
                  <div>
                    <span className="text-sm font-medium">End Time:</span>
                    <p className="text-sm mt-1">{new Date(result.metadata.endTime).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {result.metadata.cost?.breakdown && (
                <div>
                  <span className="text-sm font-medium">Cost Breakdown:</span>
                  <div className="mt-2 space-y-1">
                    {Object.entries(result.metadata.cost.breakdown).map(([item, cost]) => (
                      <div key={item} className="flex justify-between text-sm">
                        <span>{item}:</span>
                        <span>{cost} {result.metadata.cost!.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.metadata.metrics && (
                <div>
                  <span className="text-sm font-medium">Metrics:</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(result.metadata.metrics).map(([metric, value]) => (
                      <div key={metric} className="flex justify-between text-sm">
                        <span>{metric}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.metadata.frameworkMetadata && (
                <Collapsible open={isMetadataExpanded} onOpenChange={setIsMetadataExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0">
                      <span className="text-sm font-medium">Framework Metadata</span>
                      {isMetadataExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.metadata.frameworkMetadata, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>
                Detailed log entries from the workflow execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.metadata.logs && result.metadata.logs.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {result.metadata.logs.map((log, index) => (
                      <LogEntry key={index} log={log} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No logs available for this execution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogEntry({ log }: { log: ExecutionLog }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div className="border rounded-md p-3 text-sm">
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 ${logLevelColors[log.level]}`}>
          {logLevelIcons[log.level]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${logLevelColors[log.level]}`}>
              {log.level.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {log.source && (
              <span className="text-xs text-muted-foreground">
                [{log.source}]
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap break-words">{log.message}</p>
          {hasMetadata && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto">
                  <span className="text-xs">Show metadata</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}