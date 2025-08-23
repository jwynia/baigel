'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Info, X } from 'lucide-react'
import { executeToolInConnection } from '@/lib/services/tool-execution'
import { useConnectionStore } from '@/lib/stores/connections'

interface ToolFormProps {
  tool: {
    id: string
    name: string
    description?: string
    inputSchema?: any
    outputSchema?: any
  }
  connectionId?: string
  onClose?: () => void
  onExecuted?: (result: any) => void
}

interface FieldProps {
  name: string
  schema: any
  value: any
  onChange: (value: any) => void
  required?: boolean
}

function renderField({ name, schema, value, onChange, required }: FieldProps) {
  const fieldId = `field-${name}`
  const hasError = required && (value === undefined || value === null || value === '')
  
  // Handle different input types based on schema
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        // Enum select
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={hasError ? 'text-red-500' : ''}>
              {schema.title || name}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger id={fieldId} className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={schema.description || `Select ${name}`} />
              </SelectTrigger>
              <SelectContent>
                {schema.enum.map((option: string) => (
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
      
      if (schema.format === 'textarea' || (schema.maxLength && schema.maxLength > 100)) {
        // Textarea for long strings
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className={hasError ? 'text-red-500' : ''}>
              {schema.title || name}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={schema.description || `Enter ${name}`}
              className={hasError ? 'border-red-500' : ''}
              rows={4}
            />
            {schema.description && (
              <p className="text-xs text-muted-foreground">{schema.description}</p>
            )}
          </div>
        )
      }
      
      // Regular string input
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={hasError ? 'text-red-500' : ''}>
            {schema.title || name}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={schema.description || `Enter ${name}`}
            className={hasError ? 'border-red-500' : ''}
          />
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )

    case 'number':
    case 'integer':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={hasError ? 'text-red-500' : ''}>
            {schema.title || name}
            {required && <span className="text-red-500 ml-1">*</span>}
            {schema.minimum !== undefined && schema.maximum !== undefined && (
              <span className="text-xs text-muted-foreground ml-2">
                ({schema.minimum} - {schema.maximum})
              </span>
            )}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                onChange(undefined)
              } else {
                onChange(schema.type === 'integer' ? parseInt(val) : parseFloat(val))
              }
            }}
            placeholder={schema.description || `Enter ${name}`}
            min={schema.minimum}
            max={schema.maximum}
            step={schema.type === 'integer' ? 1 : 0.1}
            className={hasError ? 'border-red-500' : ''}
          />
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )

    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={fieldId}
            checked={value || false}
            onCheckedChange={onChange}
          />
          <Label htmlFor={fieldId} className="text-sm font-normal">
            {schema.title || name}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {schema.description && (
            <Info className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )

    case 'array':
      // Simple array handling - could be enhanced for complex arrays
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={hasError ? 'text-red-500' : ''}>
            {schema.title || name}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={fieldId}
            value={Array.isArray(value) ? value.join('\n') : ''}
            onChange={(e) => {
              const lines = e.target.value.split('\n').filter(line => line.trim())
              onChange(lines)
            }}
            placeholder={schema.description || 'Enter one item per line'}
            className={hasError ? 'border-red-500' : ''}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {schema.description || 'Enter one item per line'}
          </p>
        </div>
      )

    default:
      // Fallback to JSON input for complex types
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={hasError ? 'text-red-500' : ''}>
            {schema.title || name}
            {required && <span className="text-red-500 ml-1">*</span>}
            <Badge variant="outline" className="ml-2">JSON</Badge>
          </Label>
          <Textarea
            id={fieldId}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onChange(parsed)
              } catch {
                onChange(e.target.value)
              }
            }}
            placeholder={schema.description || 'Enter JSON data'}
            className={`font-mono text-sm ${hasError ? 'border-red-500' : ''}`}
            rows={4}
          />
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )
  }
}

export function ToolForm({ tool, connectionId, onClose, onExecuted }: ToolFormProps) {
  const { getActiveConnection, connections } = useConnectionStore()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
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
  const inputSchema = tool.inputSchema || {}
  const properties = inputSchema.properties || {}
  const required = inputSchema.required || []
  
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }
  
  const validateForm = () => {
    for (const field of required) {
      const value = formData[field]
      if (value === undefined || value === null || value === '') {
        return `${field} is required`
      }
    }
    return null
  }
  
  const handleExecute = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsExecuting(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await executeToolInConnection(connection, tool.id, formData)
      setResult(response)
      onExecuted?.(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute tool')
    } finally {
      setIsExecuting(false)
    }
  }
  
  const hasFields = Object.keys(properties).length > 0
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{tool.name}</CardTitle>
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
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Form Fields */}
        {hasFields ? (
          <div className="space-y-4">
            {Object.entries(properties).map(([fieldName, fieldSchema]: [string, any]) => (
              <div key={fieldName}>
                {renderField({
                  name: fieldName,
                  schema: fieldSchema,
                  value: formData[fieldName],
                  onChange: (value) => handleFieldChange(fieldName, value),
                  required: required.includes(fieldName)
                })}
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool doesn't require any input parameters.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Execute Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleExecute}
            disabled={isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isExecuting ? 'Executing...' : 'Execute Tool'}
          </Button>
        </div>
        
        {/* Result Display */}
        {result && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Result:</Label>
            <div className="rounded-md bg-muted p-4">
              <pre className="text-sm overflow-auto">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}