'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle, XCircle, AlertCircle, Square } from 'lucide-react';
import type { ExecutionStatus } from '@/types/workflows';

interface ExecutionProgressProps {
  executionId?: string;
  status: ExecutionStatus;
  progress?: number;
  startTime?: string;
  estimatedDuration?: number;
  className?: string;
}

const statusConfig: Record<ExecutionStatus, {
  icon: React.ReactNode;
  color: string;
  label: string;
  description: string;
}> = {
  pending: {
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pending',
    description: 'Workflow is queued and waiting to start'
  },
  running: {
    icon: <Play className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-100 text-blue-800',
    label: 'Running',
    description: 'Workflow is currently executing'
  },
  completed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
    label: 'Completed',
    description: 'Workflow completed successfully'
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800',
    label: 'Failed',
    description: 'Workflow execution failed'
  },
  cancelled: {
    icon: <Square className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800',
    label: 'Cancelled',
    description: 'Workflow was cancelled by user'
  },
  timeout: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800',
    label: 'Timeout',
    description: 'Workflow exceeded maximum execution time'
  },
  retrying: {
    icon: <Play className="h-4 w-4 animate-pulse" />,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Retrying',
    description: 'Workflow failed but is being retried'
  }
};

export function ExecutionProgress({
  executionId,
  status,
  progress,
  startTime,
  estimatedDuration,
  className = ''
}: ExecutionProgressProps) {
  const config = statusConfig[status];
  
  // Calculate elapsed time if start time is provided
  const elapsedTime = startTime ? Date.now() - new Date(startTime).getTime() : 0;
  const elapsedSeconds = Math.floor(elapsedTime / 1000);
  
  // Calculate progress based on estimated duration
  let calculatedProgress = progress;
  if (!calculatedProgress && estimatedDuration && status === 'running') {
    calculatedProgress = Math.min(95, (elapsedSeconds / estimatedDuration) * 100);
  } else if (status === 'completed') {
    calculatedProgress = 100;
  } else if (status === 'pending') {
    calculatedProgress = 0;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Badge and Description */}
      <div className="flex items-center gap-3">
        <Badge className={config.color}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Badge>
        <span className="text-sm text-muted-foreground">
          {config.description}
        </span>
      </div>

      {/* Progress Bar */}
      {(calculatedProgress !== undefined || status === 'running') && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {calculatedProgress !== undefined ? `${Math.round(calculatedProgress)}%` : '...'}
            </span>
          </div>
          <Progress 
            value={calculatedProgress} 
            className="w-full"
          />
        </div>
      )}

      {/* Execution Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {executionId && (
          <div>
            <span className="text-muted-foreground">Execution ID:</span>
            <p className="font-mono text-xs mt-1 break-all">{executionId}</p>
          </div>
        )}
        
        {startTime && (
          <div>
            <span className="text-muted-foreground">Started:</span>
            <p className="mt-1">{new Date(startTime).toLocaleTimeString()}</p>
          </div>
        )}
        
        {elapsedTime > 0 && (
          <div>
            <span className="text-muted-foreground">Elapsed:</span>
            <p className="mt-1">{formatDuration(elapsedSeconds)}</p>
          </div>
        )}
        
        {estimatedDuration && status === 'running' && (
          <div>
            <span className="text-muted-foreground">Estimated:</span>
            <p className="mt-1">{formatDuration(estimatedDuration)}</p>
          </div>
        )}
      </div>

      {/* Running Animation */}
      {status === 'running' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
          <span>Executing workflow...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Format duration in seconds to human readable format
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}