# UI Component Specifications

## Purpose
Detailed specifications for all BAIGEL UI components following the mock-first development approach. Each component is designed to work with mock data initially, with clear interfaces for real protocol integration.

## Classification
- **Domain:** Planning
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** High

## Component Architecture

### Design Principles
1. **Protocol Agnostic** - Components don't know about specific protocols
2. **Mock Ready** - Every component works with mock data by default
3. **Accessibility First** - WCAG 2.1 AA compliance from the start
4. **Performance Conscious** - Optimized for large datasets and real-time updates
5. **Testable** - Clear interfaces and predictable behavior

## Phase 2 Component Specifications

### File Upload & Attachments

#### FileUpload Component
```typescript
// components/chat/FileUpload.tsx
interface FileUploadProps {
  onFilesAdded: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  disabled?: boolean
}

// Features:
- Drag & drop zone with visual feedback
- File type validation with user-friendly messages
- Progress indicators during upload simulation
- Multiple file selection with preview
- File size and count limits
- Integration with message input

// Mock Behavior:
- Simulate upload progress (0-100% over 2-5 seconds)
- Random upload failures (5% chance) for error testing
- File type validation with detailed error messages
- Preview generation for images/documents
```

#### AttachmentViewer Component
```typescript
// components/chat/AttachmentViewer.tsx
interface AttachmentViewerProps {
  attachment: {
    id: string
    name: string
    type: string
    size: number
    url: string
    thumbnail?: string
  }
  onDownload?: () => void
  onRemove?: () => void
}

// Features:
- Image gallery with lightbox
- Video player with controls
- Document preview (PDF, text files)
- Audio player for voice messages
- Download and share functionality
- Thumbnail generation

// Mock Behavior:
- Generate placeholder thumbnails
- Simulate download progress
- Mock different file types and sizes
- Preview generation simulation
```

### Message Enhancement Features

#### MessageActions Component
```typescript
// components/chat/MessageActions.tsx
interface MessageActionsProps {
  message: Message
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  onRegenerate: () => void
  onReply: () => void
  canEdit?: boolean
  canDelete?: boolean
}

// Features:
- Dropdown menu with contextual actions
- Keyboard shortcuts for power users
- Permission-based action visibility
- Undo functionality for destructive actions
- Share to external services

// Mock Behavior:
- Simulate action delays (copy, delete, etc.)
- Mock permission checks
- Regenerate with different responses
- Edit history tracking
```

#### MessageSearch Component
```typescript
// components/chat/MessageSearch.tsx
interface MessageSearchProps {
  messages: Message[]
  onResultSelect: (messageId: string) => void
  placeholder?: string
}

// Features:
- Real-time search with highlighting
- Filter by date, sender, type
- Regex support for advanced users
- Search history and suggestions
- Keyboard navigation through results

// Mock Behavior:
- Search through mock conversation history
- Highlight matches in message content
- Navigate between search results
- Save and recall search queries
```

### Protocol-Specific Components

#### MCP Server Manager
```typescript
// components/protocols/mcp/MCPServerManager.tsx
interface MCPServerManagerProps {
  servers: MCPServer[]
  onConnect: (serverId: string) => void
  onDisconnect: (serverId: string) => void
  onConfigure: (serverId: string) => void
}

interface MCPServer {
  id: string
  name: string
  url: string
  status: 'connected' | 'disconnected' | 'error'
  tools: MCPTool[]
  resources: MCPResource[]
  capabilities: string[]
}

// Features:
- Server discovery and auto-configuration
- Health monitoring with status indicators
- Tool and resource enumeration
- Connection diagnostics
- Configuration management

// Mock Data:
- 5-10 different server types (file system, web scraper, calculator, etc.)
- Various connection states and error conditions
- Realistic tool sets per server type
- Health check simulation with periodic updates
```

#### Agent Directory (A2A)
```typescript
// components/protocols/a2a/AgentDirectory.tsx
interface AgentDirectoryProps {
  agents: A2AAgent[]
  onConnect: (agentId: string) => void
  onViewProfile: (agentId: string) => void
  onDelegate: (agentId: string, task: string) => void
}

interface A2AAgent {
  id: string
  name: string
  description: string
  capabilities: string[]
  trustScore: number
  availability: 'online' | 'busy' | 'offline'
  lastSeen: Date
  specializations: string[]
}

// Features:
- Agent discovery with filtering
- Trust score visualization
- Capability matching
- Delegation workflow
- Agent reputation system

// Mock Data:
- 20+ diverse agent personas
- Varying trust scores and capabilities
- Realistic availability patterns
- Specialization categories (research, coding, analysis, etc.)
```

### Tool System Components

#### Tool Gallery
```typescript
// components/tools/ToolGallery.tsx
interface ToolGalleryProps {
  tools: Tool[]
  categories: ToolCategory[]
  onToolSelect: (tool: Tool) => void
  onCategoryFilter: (category: string) => void
  searchQuery?: string
}

interface Tool {
  id: string
  name: string
  description: string
  category: string
  parameters: ParameterSchema
  examples: ToolExample[]
  popularity: number
  lastUsed?: Date
}

// Features:
- Grid/list view toggle
- Category filtering with counts
- Search with auto-complete
- Recently used tools
- Tool favorites and collections
- Usage analytics

// Mock Data:
- 50+ tools across categories:
  - Text processing (summarize, translate, format)
  - Data analysis (chart, calculate, analyze)
  - Web interaction (search, scrape, fetch)
  - File operations (read, write, convert)
  - Communication (email, slack, webhook)
```

#### Tool Execution Panel
```typescript
// components/tools/ToolExecutionPanel.tsx
interface ToolExecutionPanelProps {
  tool: Tool
  onExecute: (parameters: Record<string, any>) => void
  onCancel: () => void
  execution?: ToolExecution
}

interface ToolExecution {
  id: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime: Date
  duration?: number
  parameters: Record<string, any>
  result?: any
  error?: string
  progress?: number
}

// Features:
- Dynamic form generation from parameter schema
- Parameter validation with helpful errors
- Execution progress tracking
- Result visualization
- History and templates

// Mock Behavior:
- Generate forms based on tool schemas
- Simulate execution with realistic delays
- Progress updates for long-running tools
- Various result types (text, JSON, files, charts)
```

### Debugging & Development Tools

#### Protocol Debugger
```typescript
// components/debug/ProtocolDebugger.tsx
interface ProtocolDebuggerProps {
  protocol: ProtocolType
  messages: DebugMessage[]
  onClearLogs: () => void
  onExportLogs: () => void
}

interface DebugMessage {
  id: string
  timestamp: Date
  direction: 'inbound' | 'outbound'
  type: string
  protocol: ProtocolType
  data: any
  metadata: {
    size: number
    latency?: number
    error?: string
  }
}

// Features:
- Real-time message monitoring
- Protocol-specific formatting
- Filter by message type or direction
- Export logs for analysis
- Performance metrics display

// Mock Data:
- Generate realistic protocol traffic
- Various message types per protocol
- Simulated network conditions
- Error injection for testing
```

#### Network Monitor
```typescript
// components/debug/NetworkMonitor.tsx
interface NetworkMonitorProps {
  connections: NetworkConnection[]
  metrics: NetworkMetrics
  onRefresh: () => void
}

interface NetworkConnection {
  id: string
  protocol: ProtocolType
  endpoint: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  latency: number
  throughput: number
  errors: number
}

// Features:
- Connection status visualization
- Real-time metrics updates
- Historical performance charts
- Alert system for issues
- Connection diagnostics

// Mock Data:
- Realistic latency patterns (50-200ms)
- Throughput variations
- Occasional connection issues
- Performance degradation simulation
```

## Advanced UI Components

### Workspace Management

#### Multi-Chat Interface
```typescript
// components/workspace/MultiChatInterface.tsx
interface MultiChatInterfaceProps {
  chats: ChatSession[]
  activeChat: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onCloseChat: (chatId: string) => void
}

// Features:
- Tabbed interface for multiple chats
- Split-screen view for comparison
- Chat session management
- Cross-chat search
- Session persistence

// Mock Data:
- Multiple ongoing conversations
- Different protocols per chat
- Varied conversation lengths
- Session metadata (start time, message count)
```

#### Layout Customization
```typescript
// components/layout/LayoutCustomizer.tsx
interface LayoutCustomizerProps {
  layout: LayoutConfig
  onLayoutChange: (layout: LayoutConfig) => void
  presets: LayoutPreset[]
}

// Features:
- Drag & drop panel arrangement
- Resizable panels with constraints
- Layout presets for different workflows
- Panel show/hide controls
- Responsive layout adaptation

// Mock Behavior:
- Save layout preferences
- Preset switching with animation
- Panel collision detection
- Responsive breakpoint simulation
```

### Accessibility & Personalization

#### Accessibility Panel
```typescript
// components/accessibility/AccessibilityPanel.tsx
interface AccessibilityPanelProps {
  settings: AccessibilitySettings
  onSettingChange: (key: string, value: any) => void
}

interface AccessibilitySettings {
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large' | 'xl'
  reducedMotion: boolean
  screenReaderOptimized: boolean
  keyboardNavigation: boolean
  voiceCommands: boolean
}

// Features:
- Live preview of accessibility changes
- Keyboard navigation testing
- Screen reader compatibility
- Voice command setup
- Compliance checking

// Mock Behavior:
- Immediate visual feedback
- Accessibility score calculation
- Compliance reporting
- Usage pattern analysis
```

## Component Integration Patterns

### Service Layer Abstraction
```typescript
// lib/services/abstract/
- ChatService interface
- ProtocolService interface
- ToolService interface
- FileService interface

// Each service has:
- Mock implementation for development
- Real implementation for production
- Feature flag switching
- Fallback mechanisms
```

### State Management Patterns
```typescript
// lib/stores/
- Component-specific stores
- Cross-component communication
- Mock data hydration
- State persistence
- Undo/redo functionality
```

### Testing Patterns
```typescript
// __tests__/components/
- Component isolation testing
- Mock service injection
- User interaction simulation
- Accessibility testing
- Visual regression testing
```

## Mock Data Generation

### Realistic Data Sets
```typescript
// lib/mocks/generators/
- ConversationGenerator: Creates realistic chat flows
- AgentGenerator: Diverse agent personalities
- ToolGenerator: Varied tool definitions
- FileGenerator: Different file types and sizes
- ErrorGenerator: Realistic error scenarios
```

### Dynamic Behavior Simulation
```typescript
// lib/mocks/behaviors/
- NetworkSimulator: Latency and bandwidth variations
- UserSimulator: Realistic usage patterns
- ProtocolSimulator: Protocol-specific behaviors
- ErrorSimulator: Failure mode testing
```

## Quality Assurance

### Testing Strategy
1. **Unit Tests**: Component isolation with mock data
2. **Integration Tests**: Component interaction flows
3. **Accessibility Tests**: WCAG compliance validation
4. **Performance Tests**: Large dataset handling
5. **Visual Tests**: UI consistency across themes

### Review Checklist
- [ ] Component works with mock data
- [ ] Accessibility requirements met
- [ ] Responsive design validated
- [ ] Error states handled gracefully
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Tests passing

## Implementation Priority

### Sprint 2 Priority (Next Up)
1. FileUpload & AttachmentViewer
2. MessageActions & MessageSearch
3. MCPServerManager basics
4. Tool Gallery foundation

### Sprint 3 Priority
1. Complete MCP integration UI
2. A2A Agent Directory
3. Tool Execution Panel
4. Basic debugging tools

### Future Sprints
1. Advanced debugging features
2. Workspace customization
3. Accessibility enhancements
4. Performance optimizations

## Relationships
- **Parent Nodes:** [planning/ui-development-plan.md]
- **Child Nodes:** Individual component files
- **Related Nodes:** 
  - [elements/architecture/frontend-architecture.md] - implements
  - [lib/types.ts] - uses
  - [components/ui/index.ts] - extends

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Updated By:** Claude/Assistant