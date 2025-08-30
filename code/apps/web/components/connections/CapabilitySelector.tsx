'use client'

import { useState } from 'react'
import { ChevronRight, Wrench, Zap, Search, Filter, Play } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea,
} from '@/components/ui'
import { useConnectionStore } from '@/lib/stores/connections'
import type { Connection } from '@/lib/types/connections'

interface CapabilitySelectorProps {
  onSelectTool?: (tool: any) => void
  onSelectCapability?: (capability: string) => void
}

export function CapabilitySelector({ onSelectTool, onSelectCapability }: CapabilitySelectorProps) {
  const { getActiveConnection } = useConnectionStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedTab, setSelectedTab] = useState<'tools' | 'capabilities'>('tools')
  
  const activeConnection = getActiveConnection()
  
  // Filter tools based on search
  const filteredTools = activeConnection?.tools?.filter(tool => {
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || 
      detectToolCategory(tool) === categoryFilter
    
    return matchesSearch && matchesCategory
  }) || []
  
  // Filter capabilities based on search
  const filteredCapabilities = Array.isArray(activeConnection?.capabilities) 
    ? activeConnection.capabilities.filter(cap => {
        return !searchQuery || cap.toLowerCase().includes(searchQuery.toLowerCase())
      }) 
    : []
  
  // Detect categories from tools
  const categories = Array.from(new Set(
    activeConnection?.tools?.map(tool => detectToolCategory(tool)) || []
  )).filter(Boolean)
  
  if (!activeConnection) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No connection selected. Please select a connection first.
        </CardContent>
      </Card>
    )
  }
  
  const hasTools = activeConnection.tools && activeConnection.tools.length > 0
  const hasCapabilities = Array.isArray(activeConnection.capabilities) && activeConnection.capabilities.length > 0
  
  if (!hasTools && !hasCapabilities) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          This connection doesn't expose any tools or capabilities.
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Functions</CardTitle>
        <CardDescription>
          {activeConnection.name} provides {activeConnection.tools?.length || 0} tools and {Array.isArray(activeConnection.capabilities) ? activeConnection.capabilities.length : 0} capabilities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools and capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Tabs for Tools vs Capabilities */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'tools' | 'capabilities')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tools" disabled={!hasTools}>
              <Wrench className="h-4 w-4 mr-2" />
              Tools ({activeConnection.tools?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="capabilities" disabled={!hasCapabilities}>
              <Zap className="h-4 w-4 mr-2" />
              Capabilities ({Array.isArray(activeConnection.capabilities) ? activeConnection.capabilities.length : 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredTools.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No tools match your search' : 'No tools available'}
                  </div>
                ) : (
                  filteredTools.map(tool => (
                    <Card 
                      key={tool.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => onSelectTool?.(tool)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{tool.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {detectToolCategory(tool)}
                              </Badge>
                            </div>
                            {tool.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {tool.description}
                              </p>
                            )}
                            {tool.inputSchema && (
                              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {countSchemaFields(tool.inputSchema)} inputs
                                </span>
                                {tool.outputSchema && (
                                  <span>
                                    {countSchemaFields(tool.outputSchema)} outputs
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="ghost">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="capabilities" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredCapabilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No capabilities match your search' : 'No capabilities available'}
                  </div>
                ) : (
                  filteredCapabilities.map(capability => (
                    <Card 
                      key={capability}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => onSelectCapability?.(capability)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{capability}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper function to detect tool category
function detectToolCategory(tool: any): string {
  const name = tool.name.toLowerCase()
  const desc = (tool.description || '').toLowerCase()
  
  if (name.includes('search') || desc.includes('search')) return 'Search'
  if (name.includes('arxiv') || desc.includes('paper')) return 'Research'
  if (name.includes('brave') || name.includes('web')) return 'Web'
  if (name.includes('image') || desc.includes('image')) return 'Media'
  if (name.includes('news') || desc.includes('news')) return 'News'
  if (name.includes('video') || desc.includes('video')) return 'Media'
  if (name.includes('flight') || name.includes('travel')) return 'Travel'
  if (name.includes('weather') || desc.includes('weather')) return 'Weather'
  if (name.includes('location') || name.includes('local')) return 'Location'
  if (name.includes('cache') || name.includes('storage')) return 'System'
  if (name.includes('model') || name.includes('bayes')) return 'AI/ML'
  if (name.includes('dice') || name.includes('card')) return 'Games'
  
  return 'General'
}

// Helper function to count schema fields
function countSchemaFields(schema: any): number {
  if (!schema) return 0
  
  // Handle string schemas (might be JSON string)
  if (typeof schema === 'string') {
    try {
      schema = JSON.parse(schema)
    } catch {
      return 0
    }
  }
  
  // Look for properties in various schema formats
  if (schema.json?.properties) {
    return Object.keys(schema.json.properties).length
  }
  if (schema.properties) {
    return Object.keys(schema.properties).length
  }
  
  return 0
}