# Workflow Protocol Support

## Overview
The Workflow Protocol extends BAIGEL's universal agent interface to support workflow execution systems. Unlike conversational protocols (A2A, MCP, OpenAI), this protocol focuses on form-driven workflow execution with dynamic UI generation from JSON schemas.

## Classification
- **Domain:** Core Protocol
- **Stability:** Emerging
- **Abstraction:** Technical
- **Confidence:** High

## Protocol Category Definition
Workflow protocols enable discovery and execution of structured workflows that:
1. **Expose schemas** describing required inputs
2. **Accept form data** for workflow execution
3. **Return structured results** from workflow completion
4. **Support discovery** of available workflows

This differs from conversational protocols which focus on natural language interaction.

## Technical Architecture

### Core Components
1. **Workflow Discovery Service**: Identifies available workflows from endpoints
2. **Schema Standardization Layer**: Normalizes various schema formats
3. **Workflow Adapters**: Framework-specific implementation handlers
4. **Universal Form Renderer**: Dynamic UI generation from standard schemas
5. **Execution Engine**: Handles workflow invocation and result processing

### Standard Internal Interface

#### Workflow Definition Format
```typescript
interface StandardWorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  
  // Normalized schema regardless of source framework
  inputSchema: StandardJSONSchema
  outputSchema: StandardJSONSchema
  
  // Framework context
  framework: {
    name: string           // 'Mastra', 'SpiffWorkflow', 'n8n', etc.
    version: string
    endpoint: string
    adapter: string        // Which adapter handles this
  }
  
  // Metadata for UI presentation
  metadata: {
    complexity: 'simple' | 'intermediate' | 'advanced'
    estimatedDuration: number  // seconds
    category: string[]         // tags for organization
    requiresAuth: boolean
    supportsBatch: boolean
    supportsStreaming: boolean
  }
}
```

#### Execution Interface
```typescript
interface WorkflowExecutionRequest {
  workflowId: string
  inputs: Record<string, any>
  options?: {
    timeout?: number
    async?: boolean
    streaming?: boolean
  }
  context?: {
    userId?: string
    sessionId?: string
    metadata?: Record<string, any>
  }
}

interface WorkflowExecutionResult {
  executionId: string
  success: boolean
  outputs: Record<string, any>
  
  metadata: {
    startTime: string
    endTime: string
    duration: number        // milliseconds
    cost?: {
      amount: number
      currency: string
      breakdown?: Record<string, number>
    }
    logs?: ExecutionLog[]
    metrics?: Record<string, number>
  }
  
  error?: {
    code: string
    message: string
    details?: any
    recoverable: boolean
  }
}
```

#### Schema Standardization
```typescript
interface StandardJSONSchema {
  $schema?: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  
  // Object properties
  properties?: Record<string, StandardJSONSchema>
  required?: string[]
  additionalProperties?: boolean | StandardJSONSchema
  
  // Array properties
  items?: StandardJSONSchema
  minItems?: number
  maxItems?: number
  
  // String properties
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  enum?: any[]
  
  // Numeric properties
  minimum?: number
  maximum?: number
  multipleOf?: number
  
  // Common properties
  title?: string
  description?: string
  default?: any
  examples?: any[]
  
  // UI Generation Hints (BAIGEL Extension)
  uiHints?: {
    widget?: 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'datetime' | 'file' | 'password' | 'url' | 'email'
    layout?: 'horizontal' | 'vertical' | 'grid' | 'accordion' | 'tabs'
    order?: number
    hidden?: boolean
    readonly?: boolean
    placeholder?: string
    help?: string
    validation?: {
      custom?: string  // Custom validation function name
      async?: boolean
    }
  }
}
```

## Adapter Architecture

### Universal Adapter Interface
```typescript
interface WorkflowAdapter extends ProtocolAdapter {
  // Identification
  readonly name: string
  readonly version: string
  readonly supportedFrameworks: string[]
  
  // Discovery
  canHandle(endpoint: string, response?: any): Promise<boolean>
  discoverWorkflows(baseUrl: string): Promise<StandardWorkflowDefinition[]>
  
  // Schema Management
  getWorkflowSchema(workflowId: string): Promise<StandardJSONSchema>
  validateInputs(workflowId: string, inputs: any): Promise<ValidationResult>
  transformInputs?(workflowId: string, standardInputs: any): Promise<any>
  transformOutputs?(workflowId: string, nativeOutputs: any): Promise<any>
  
  // Execution
  executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult>
  getExecutionStatus(executionId: string): Promise<ExecutionStatus>
  cancelExecution?(executionId: string): Promise<boolean>
  
  // Capabilities
  getSupportedFeatures(): WorkflowFeature[]
  getAuthenticationRequirements(): AuthRequirement[]
  
  // Framework-specific extensions
  getFrameworkMetadata(): FrameworkMetadata
  handleFrameworkSpecificOperation?(operation: string, params: any): Promise<any>
}
```

### Adapter Registry Pattern
```typescript
interface AdapterRegistry {
  registerAdapter(adapter: WorkflowAdapter): void
  getAdapter(frameworkName: string): WorkflowAdapter | null
  detectFramework(endpoint: string, response?: any): Promise<WorkflowAdapter | null>
  listSupportedFrameworks(): string[]
}
```

## Framework Support Strategy

### Phase 1 Frameworks

#### Mastra Workflow Framework
- **Detection**: OpenAPI spec with Mastra-specific patterns
- **Schema Source**: OpenAPI 3.1 JSON Schema definitions
- **Execution**: HTTP POST to workflow endpoints
- **Features**: Async execution, result polling, cost tracking

#### Generic OpenAPI 3.1+
- **Detection**: Standard OpenAPI specification with workflow patterns
- **Schema Source**: Component schemas and path parameters
- **Execution**: Standard HTTP operations
- **Features**: Based on OpenAPI extensions and patterns

### Phase 2 Frameworks

#### SpiffWorkflow (BPMN-based)
- **Detection**: BPMN XML presence and user task patterns
- **Schema Source**: BPMN user task form definitions
- **Execution**: BPMN process instance API
- **Features**: Human tasks, conditional workflows, parallel execution

#### n8n Workflow Automation
- **Detection**: n8n API patterns and node definitions
- **Schema Source**: n8n node parameter schemas
- **Execution**: n8n workflow execution API
- **Features**: Node-based workflows, triggers, webhooks

### Future Frameworks
- **Zapier**: If public API becomes available
- **Microsoft Power Automate**: Enterprise integration
- **Apache Airflow**: Data pipeline workflows
- **Temporal**: Distributed workflow engine
- **Custom/Internal**: Enterprise-specific workflow systems

## Discovery Integration

### Enhanced Protocol Detection
Extend existing discovery system to identify workflow endpoints:

#### Detection Patterns
```typescript
// In discovery/protocols.ts
const WORKFLOW_DETECTION_PATTERNS = {
  openapi: {
    paths: /\/(workflows?|execute|trigger|run)/,
    schemas: /workflow|execution|trigger/i,
    contentTypes: ['application/json', 'multipart/form-data']
  },
  mastra: {
    serverUrl: /mastra/i,
    title: /mastra/i,
    customExtensions: ['x-mastra-workflow', 'x-workflow-engine']
  },
  spiffworkflow: {
    paths: /\/(process|bpmn|workflow)/,
    contentTypes: ['application/xml', 'application/json']
  }
}
```

#### Discovery Response Format
```typescript
interface DiscoveredWorkflowService extends DiscoveredAgent {
  protocol: 'Workflow'
  subProtocol: 'Mastra' | 'OpenAPI' | 'SpiffWorkflow' | 'n8n' | 'Generic'
  workflowCount: number
  frameworks: string[]
  capabilities: WorkflowCapability[]
  schemaSupport: {
    input: boolean
    output: boolean
    validation: boolean
    uiHints: boolean
  }
}
```

## UI Architecture

### Component Structure
```
WorkflowSystem/
├── Discovery/
│   ├── WorkflowDiscovery.tsx       # Main discovery interface
│   ├── WorkflowServiceCard.tsx     # Individual service display
│   └── WorkflowPreview.tsx         # Schema preview modal
├── Execution/
│   ├── WorkflowExecutor.tsx        # Main execution interface
│   ├── UniversalFormRenderer.tsx   # Schema → Form generator
│   ├── ExecutionProgress.tsx       # Real-time execution status
│   └── ResultsDisplay.tsx          # Execution results viewer
├── Management/
│   ├── WorkflowCatalog.tsx         # Browse available workflows
│   ├── ExecutionHistory.tsx        # Past executions
│   └── WorkflowFavorites.tsx       # Saved workflows
└── Common/
    ├── SchemaValidator.tsx         # Input validation
    ├── ErrorBoundary.tsx          # Error handling
    └── LoadingStates.tsx          # Loading indicators
```

### Form Generation Strategy
Use React JSON Schema Form (RJSF) with custom UI theme:
```typescript
const WorkflowFormRenderer = ({ schema, onSubmit, onValidate }) => {
  return (
    <Form
      schema={schema}
      uiSchema={generateUISchema(schema)}
      validator={validator}
      onSubmit={onSubmit}
      onValidate={onValidate}
      widgets={customWidgets}
      fields={customFields}
      themes={baigel Theme}
    />
  )
}
```

## Integration Points

### With Existing BAIGEL Systems

#### Discovery System
- Extend existing discovery to detect workflow endpoints
- Add workflow service cards to discovery results
- Integrate with current discovery caching and error handling

#### Settings Management
- Add workflow configurations to export/import
- Store workflow favorites and execution history
- Manage framework-specific authentication

#### Navigation
- Add `/workflows` page to existing navigation
- Integrate workflow execution into current UI patterns
- Maintain consistent theming and accessibility

### With Protocol Adapter System
- Follow same adapter pattern as A2A/MCP/OpenAI
- Use standard authentication and transport layers
- Integrate with planned message bus architecture

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Establish core abstractions and Mastra support

1. **Create Standard Interfaces**
   - Define StandardWorkflowDefinition
   - Create WorkflowAdapter interface
   - Build StandardJSONSchema type system

2. **Extend Discovery System**
   - Add workflow detection to existing prober
   - Create parseWorkflowResponse function
   - Update DiscoveryCard for workflows

3. **Build Mastra Adapter**
   - Implement first concrete adapter
   - Test with local Mastra server
   - Validate schema transformation pipeline

4. **Create Base UI Components**
   - UniversalFormRenderer foundation
   - WorkflowExecutor shell
   - Basic results display

**Deliverables**: 
- `/types/workflows.ts`
- `/lib/adapters/workflow-adapter.ts`
- `/lib/adapters/mastra-adapter.ts`
- `/components/workflows/WorkflowExecutor.tsx`

### Phase 2: Universal UI (Week 2)
**Goal**: Complete form generation and execution interface

1. **Form Generation System**
   - Integrate RJSF with custom theme
   - Build schema → UI transformation
   - Add validation and error handling

2. **Execution Interface**
   - Implement workflow execution flow
   - Add progress tracking and cancellation
   - Build results visualization system

3. **Discovery Integration**
   - Add workflow services to discovery UI
   - Implement workflow preview modals
   - Connect discovery to execution flow

4. **Error Handling & UX**
   - Comprehensive error boundaries
   - Loading states and feedback
   - Accessibility improvements

**Deliverables**:
- Complete workflow execution interface
- Integrated discovery → execution flow
- Error handling and validation system

### Phase 3: Multi-Framework Support (Week 3)
**Goal**: Expand framework support and adapter ecosystem

1. **Generic OpenAPI Adapter**
   - Support any OpenAPI 3.1+ workflow service
   - Automatic schema extraction
   - Configurable endpoint patterns

2. **SpiffWorkflow Adapter**
   - BPMN workflow support
   - User task form integration
   - Process instance management

3. **Adapter Registry System**
   - Dynamic adapter loading
   - Framework auto-detection
   - Capability negotiation

4. **Testing & Validation**
   - Multi-framework test suite
   - Schema transformation validation
   - Integration testing

**Deliverables**:
- `/lib/adapters/generic-openapi-adapter.ts`
- `/lib/adapters/spiffworkflow-adapter.ts`
- `/lib/adapters/adapter-registry.ts`
- Comprehensive test coverage

### Phase 4: Advanced Features (Week 4)
**Goal**: Production-ready features and optimization

1. **Workflow Management**
   - Execution history and favorites
   - Workflow search and categorization
   - Bulk operations and scheduling

2. **Performance & Scaling**
   - Schema caching and optimization
   - Lazy loading of large catalogs
   - Async execution patterns

3. **Advanced UI Features**
   - Workflow composition interface
   - Custom widget support
   - Export/import workflow configurations

4. **Documentation & Extensibility**
   - Adapter development guide
   - API documentation
   - Example implementations

**Deliverables**:
- Production-ready workflow system
- Performance optimizations
- Developer documentation

## Security Considerations

### Schema Validation
- Strict validation of incoming schemas
- Sanitization of dynamic form generation
- Prevention of XSS in dynamic content

### Execution Security
- Input sanitization before workflow execution
- Timeout and resource limits
- Secure credential handling

### Framework-Specific Security
- Each adapter handles framework-specific auth
- Isolation between different workflow services
- Audit logging of workflow executions

## Future Roadmap

### Standards Evolution
- Monitor emergence of workflow schema standards
- Adapt to OpenAPI 4.0+ workflow extensions
- Integrate with workflow orchestration standards

### Advanced Features
- Workflow composition and chaining
- Conditional execution based on results
- Integration with chat interface (natural language → workflow)
- Real-time collaboration on workflow execution

### Enterprise Features
- Role-based access control
- Workflow approval workflows
- Integration with enterprise SSO
- Audit and compliance reporting

## Success Metrics

### Technical Metrics
- Number of supported workflow frameworks
- Schema transformation accuracy (>95%)
- Execution success rate (>98%)
- Response time for form generation (<500ms)

### User Experience Metrics
- Time from discovery to first execution (<2 minutes)
- User satisfaction with generated forms (>4.5/5)
- Error recovery rate (>90%)
- Workflow completion rate (>85%)

### Adoption Metrics
- Number of discovered workflow services
- Active workflows executed per user
- Framework diversity in usage
- Community adapter contributions

---

This design establishes workflow protocol support as a first-class citizen in BAIGEL's universal agent interface, following established architectural patterns while enabling future expansion and standardization.