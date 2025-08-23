'use client'

import { useState } from 'react'
import { Play, Loader2, Copy, Check, X } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Alert,
  AlertDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { useConnectionStore } from '@/lib/stores/connections'
import { executeToolInConnection } from '@/lib/services/tool-execution'

interface ToolExecutorProps {
  tool: {
    id: string
    name: string
    description?: string
    inputSchema?: any
    outputSchema?: any
  }
  connectionId?: string
  onClose?: () => void
}

export function ToolExecutor({ tool, connectionId, onClose }: ToolExecutorProps) {
  const { getActiveConnection, connections } = useConnectionStore()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const connection = connectionId 
    ? connections.find(c => c.id === connectionId)
    : getActiveConnection()
  
  if (!connection) {
    return (
      <Alert>
        <AlertDescription>
          No connection available to execute this tool.
        </AlertDescription>
      </Alert>
    )
  }
  
  // Parse the input schema
  const inputSchema = parseSchema(tool.inputSchema)
  const properties = inputSchema?.properties || {}
  const required = inputSchema?.required || []
  
  const handleExecute = async () => {
    setIsExecuting(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await executeToolInConnection(connection, tool.id, formData)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute tool')
    } finally {
      setIsExecuting(false)
    }
  }
  
  const handleCopyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const renderField = (name: string, schema: any) => {
    const isRequired = required.includes(name)
    const value = formData[name] ?? schema.default ?? ''
    
    const commonProps = {
      id: name,
      value,
      onChange: (e: any) => {
        const newValue = e.target ? e.target.value : e
        setFormData(prev => ({ ...prev, [name]: newValue }))
      },
      disabled: isExecuting,
    }
    
    // Handle different field types
    if (schema.enum) {
      return (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {schema.title || name}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select {...commonProps} onValueChange={commonProps.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={schema.description || `Select ${name}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.enum.map((option: any) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )
    }
    
    switch (schema.type) {
      case 'boolean':
        return (
          <div key={name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={name}
                checked={value === true}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, [name]: checked }))
                }
                disabled={isExecuting}
              />
              <Label 
                htmlFor={name}
                className="text-sm font-normal cursor-pointer"
              >
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {schema.description && (
              <p className="text-xs text-muted-foreground ml-6">{schema.description}</p>
            )}
          </div>
        )
        
      case 'number':
      case 'integer':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {schema.title || name}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              placeholder={schema.description || `Enter ${name}`}
              min={schema.minimum}
              max={schema.maximum}
            />
            {schema.description && (
              <p className="text-xs text-muted-foreground">{schema.description}</p>
            )}
          </div>
        )
        
      case 'array':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {schema.title || name}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              placeholder={schema.description || `Enter ${name} (one per line)`}
              value={Array.isArray(value) ? value.join('\n') : value}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(Boolean)
                setFormData(prev => ({ ...prev, [name]: lines }))
              }}
              rows={3}
            />
            {schema.description && (
              <p className="text-xs text-muted-foreground">{schema.description}</p>
            )}
          </div>
        )
        
      case 'object':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {schema.title || name}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              placeholder={schema.description || `Enter ${name} as JSON`}
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  setFormData(prev => ({ ...prev, [name]: parsed }))
                } catch {
                  // Keep as string if not valid JSON
                  setFormData(prev => ({ ...prev, [name]: e.target.value }))
                }
              }}
              rows={4}
              className="font-mono text-sm"
            />
            {schema.description && (
              <p className="text-xs text-muted-foreground">{schema.description}</p>
            )}
          </div>
        )
        
      default: // string or unknown
        const isLongText = schema.format === 'textarea' || 
                          (schema.maxLength && schema.maxLength > 100)
        
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {schema.title || name}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {isLongText ? (
              <Textarea
                {...commonProps}
                placeholder={schema.description || `Enter ${name}`}
                rows={3}
              />
            ) : (
              <Input
                {...commonProps}
                type="text"
                placeholder={schema.description || `Enter ${name}`}
              />
            )}
            {schema.description && (
              <p className="text-xs text-muted-foreground">{schema.description}</p>
            )}
          </div>
        )
    }
  }
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{tool.name}</CardTitle>
            {tool.description && (
              <CardDescription className="mt-1">{tool.description}</CardDescription>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">
            {connection.name}
          </Badge>
          <Badge variant="outline">
            {connection.protocol}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output" disabled={!result && !error}>
              Output {(result || error) && '•'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4 mt-4">
            {Object.keys(properties).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                This tool doesn't require any input parameters.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(properties).map(([name, schema]) => 
                  renderField(name, schema)
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              {onClose && (
                <Button variant="outline" onClick={onClose} disabled={isExecuting}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleExecute} disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="output" className="mt-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : result ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Result</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResult}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Execute the tool to see output here.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper to parse schema from various formats
function parseSchema(schema: any) {
  if (!schema) return null
  
  // Handle string schemas
  if (typeof schema === 'string') {
    try {
      schema = JSON.parse(schema)
    } catch {
      return null
    }
  }
  
  // Handle wrapped schemas
  if (schema.json) {
    return schema.json
  }
  
  return schema
}