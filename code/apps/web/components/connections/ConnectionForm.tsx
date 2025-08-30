'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Checkbox,
} from '@/components/ui'
import { useConnectionStore } from '@/lib/stores/connections'
import { protocolMetadata } from '@/lib/protocols/metadata'
import type { Connection, ProtocolType, ConfigField } from '@/lib/types/connections'

const connectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  protocol: z.string().min(1, 'Protocol is required'),
  tags: z.string().optional(),
  isDefault: z.boolean().optional(),
  config: z.record(z.string(), z.any())
})

type ConnectionFormData = z.infer<typeof connectionSchema>

interface ConnectionFormProps {
  connection?: Connection | null
  onSave: () => void
  onCancel: () => void
}

export function ConnectionForm({ connection, onSave, onCancel }: ConnectionFormProps) {
  const { addConnection, updateConnection } = useConnectionStore()
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType>(
    connection?.protocol || 'mcp'
  )
  const [transport, setTransport] = useState<string>('')

  const form = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: connection?.name || '',
      protocol: connection?.protocol || 'mcp',
      tags: connection?.tags?.join(', ') || '',
      isDefault: connection?.isDefault || false,
      config: connection?.config || {}
    }
  })

  // Update config fields when protocol changes
  useEffect(() => {
    if (!connection) {
      form.setValue('config', {})
    }
  }, [selectedProtocol, form, connection])

  const onSubmit = (data: ConnectionFormData) => {
    // Parse tags
    const tags = data.tags
      ?.split(',')
      .map(tag => tag.trim())
      .filter(Boolean) || []

    // Parse JSON fields in config
    const config = { ...data.config }
    const metadata = protocolMetadata[selectedProtocol]
    
    metadata?.configFields.forEach(field => {
      if (field.type === 'json' && config[field.name]) {
        try {
          config[field.name] = JSON.parse(config[field.name])
        } catch {
          // Keep as string if not valid JSON
        }
      }
    })

    const connectionData = {
      name: data.name,
      protocol: selectedProtocol,
      tags,
      isDefault: data.isDefault,
      config
    }

    if (connection) {
      updateConnection(connection.id, connectionData as any)
    } else {
      addConnection(connectionData as any)
    }

    onSave()
  }

  const renderConfigField = (field: ConfigField) => {
    // Check if field should be shown based on transport
    if (selectedProtocol === 'mcp') {
      const currentTransport = form.watch('config.transport') || 'stdio'
      
      if (currentTransport === 'stdio') {
        if (['url', 'headers', 'apiKey'].includes(field.name)) return null
      } else {
        if (['command', 'args', 'env'].includes(field.name)) return null
      }
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={`config.${field.name}` as any}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {field.type === 'select' ? (
                <Select
                  value={formField.value || field.defaultValue}
                  onValueChange={formField.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formField.value || field.defaultValue}
                    onCheckedChange={formField.onChange}
                  />
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {field.description}
                  </label>
                </div>
              ) : field.type === 'json' ? (
                <Textarea
                  {...formField}
                  placeholder={field.placeholder}
                  className="font-mono text-sm"
                  rows={3}
                />
              ) : field.type === 'password' ? (
                <Input
                  {...formField}
                  type="password"
                  placeholder={field.placeholder}
                />
              ) : field.type === 'number' ? (
                <Input
                  {...formField}
                  type="number"
                  placeholder={field.placeholder}
                  min={field.validation?.min}
                  max={field.validation?.max}
                />
              ) : (
                <Input
                  {...formField}
                  placeholder={field.placeholder}
                />
              )}
            </FormControl>
            {field.description && field.type !== 'checkbox' && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  const metadata = protocolMetadata[selectedProtocol]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="config">Protocol Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Connection" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this connection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="protocol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protocol</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedProtocol(value as ProtocolType)
                    }}
                    disabled={!!connection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(protocolMetadata).map(protocol => (
                        <SelectItem key={protocol.id} value={protocol.id}>
                          <div className="flex items-center gap-2">
                            <span>{protocol.icon}</span>
                            <div>
                              <div className="font-medium">{protocol.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {protocol.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The protocol to use for this connection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="production, primary, gpt-4"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated tags to organize your connections
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as default connection
                    </FormLabel>
                    <FormDescription>
                      This connection will be used by default when starting a new session
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            {metadata ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {metadata.name} Configuration
                  </h3>
                  {metadata.documentationUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(metadata.documentationUrl, '_blank')}
                    >
                      View Docs
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {metadata.configFields.map(renderConfigField)}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a protocol to configure its settings
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {connection ? 'Update Connection' : 'Add Connection'}
          </Button>
        </div>
      </form>
    </Form>
  )
}