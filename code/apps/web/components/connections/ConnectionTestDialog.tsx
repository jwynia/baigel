'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Wifi, Server, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  ScrollArea,
} from '@/components/ui'
import { testConnection } from '@/lib/stores/connections'
import type { Connection, ConnectionTestResult } from '@/lib/types/connections'
import { protocolMetadata } from '@/lib/protocols/metadata'
import { cn } from '@/lib/utils'

interface ConnectionTestDialogProps {
  connection: Connection
  result: ConnectionTestResult | null
  onClose: () => void
}

export function ConnectionTestDialog({
  connection,
  result: initialResult,
  onClose
}: ConnectionTestDialogProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(!initialResult)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(initialResult)
  const [testSteps, setTestSteps] = useState<TestStep[]>([])

  const metadata = protocolMetadata[connection.protocol]

  interface TestStep {
    id: string
    name: string
    status: 'pending' | 'running' | 'success' | 'error'
    message?: string
    duration?: number
  }

  useEffect(() => {
    if (!initialResult) {
      runConnectionTest()
    }
  }, [connection, initialResult])

  const runConnectionTest = async () => {
    setIsTestingConnection(true)
    setTestResult(null)
    
    // Initialize test steps
    const steps: TestStep[] = [
      { id: 'dns', name: 'DNS Resolution', status: 'pending' },
      { id: 'connect', name: 'Establishing Connection', status: 'pending' },
      { id: 'auth', name: 'Authentication', status: 'pending' },
      { id: 'capabilities', name: 'Checking Capabilities', status: 'pending' },
      { id: 'latency', name: 'Measuring Latency', status: 'pending' },
    ]
    setTestSteps(steps)

    // Simulate step-by-step testing
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step) continue
      
      const startTime = Date.now()
      
      // Update step to running
      setTestSteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'running' as const } : s
      ))

      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))
      
      const duration = Date.now() - startTime
      const success = Math.random() > 0.1 // 90% success rate per step
      
      // Update step with result
      setTestSteps(prev => prev.map(s => 
        s.id === step.id 
          ? { 
              ...s, 
              status: success ? 'success' as const : 'error' as const,
              message: success ? `Completed in ${duration}ms` : 'Failed to complete',
              duration
            } 
          : s
      ))

      // Stop if step failed (except for capabilities check)
      if (!success && step.id !== 'capabilities') {
        setTestResult({
          success: false,
          error: `Test failed at step: ${step.name}`
        })
        setIsTestingConnection(false)
        return
      }
    }

    // Run actual test
    const result = await testConnection(connection)
    setTestResult(result)
    setIsTestingConnection(false)
  }

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Connection Test: {connection.name}
          </DialogTitle>
          <DialogDescription>
            Testing connection to {metadata?.name} ({connection.protocol.toUpperCase()})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Test Steps */}
          {testSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Test Progress</h4>
              <div className="space-y-2">
                {testSteps.map(step => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border",
                      step.status === 'running' && "bg-muted/50",
                      step.status === 'success' && "bg-green-50 dark:bg-green-950/20",
                      step.status === 'error' && "bg-red-50 dark:bg-red-950/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getStepIcon(step.status)}
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    {step.message && (
                      <span className="text-xs text-muted-foreground">
                        {step.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className="space-y-3">
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg",
                testResult.success 
                  ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
              )}>
                {testResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Connection Successful!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Connection Failed</span>
                  </>
                )}
              </div>

              {testResult.error && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">Error Details</p>
                      <p className="text-xs text-muted-foreground">{testResult.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {testResult.success && (
                <div className="space-y-3">
                  {testResult.latency && (
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm text-muted-foreground">Latency</span>
                      <Badge variant={testResult.latency < 100 ? 'default' : 'secondary'}>
                        {testResult.latency}ms
                      </Badge>
                    </div>
                  )}

                  {testResult.info && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Server Information</h4>
                      <div className="space-y-1 text-sm">
                        {testResult.info.name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span>{testResult.info.name}</span>
                          </div>
                        )}
                        {testResult.info.version && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Version:</span>
                            <span>{testResult.info.version}</span>
                          </div>
                        )}
                        {testResult.info.description && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="text-right ml-2">{testResult.info.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {testResult.capabilities && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(testResult.capabilities).map(([key, supported]) => (
                          <Badge
                            key={key}
                            variant={supported ? 'default' : 'secondary'}
                          >
                            <span className="mr-1">
                              {supported ? '✓' : '✗'}
                            </span>
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isTestingConnection && !testResult && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Wifi className="h-8 w-8 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Testing connection...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {testResult && !testResult.success && (
            <Button
              variant="outline"
              onClick={() => runConnectionTest()}
              disabled={isTestingConnection}
            >
              Retry Test
            </Button>
          )}
          <Button onClick={onClose}>
            {testResult ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}