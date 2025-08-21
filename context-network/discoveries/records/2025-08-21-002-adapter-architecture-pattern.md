# Discovery: Workflow Adapter Architecture Pattern

## What I Was Looking For
How to design a system that can support multiple workflow frameworks without UI changes

## Found
**Location**: Design discussions and implementation in `/lib/adapters/`
**Summary**: Adapter pattern with abstract base class provides framework-agnostic workflow execution

## Significance
This pattern enables BAIGEL to support any workflow framework (current or future) by:
1. Creating a standardized internal representation
2. Implementing framework-specific adapters
3. Keeping UI completely decoupled from framework details

## Key Architecture Components

### Abstract Base Class Pattern
`/lib/adapters/workflow-adapter.ts:26-454` - BaseWorkflowAdapter provides:
- Common validation logic (lines 78-184)
- Schema validation utilities (lines 166-333)
- HTTP request handling (lines 406-448)
- Error standardization (lines 338-356)

### Adapter Registry Pattern
`/lib/adapters/workflow-adapter.ts:459-494` - WorkflowAdapterRegistry:
```typescript
class WorkflowAdapterRegistry {
  registerAdapter(adapter: WorkflowAdapter): void
  getAdapter(frameworkName: string): WorkflowAdapter | null
  detectFramework(endpoint: string, response?: any): Promise<WorkflowAdapter | null>
}
```

### Framework Detection Strategy
Each adapter implements `canHandle()` to detect its framework:
- Check headers for framework-specific markers
- Analyze response structure patterns
- Test known endpoints

## Implementation Benefits

### 1. Framework Independence
- UI components (`/components/workflows/`) work only with StandardWorkflowDefinition
- No framework-specific code in UI layer
- Complete abstraction of execution details

### 2. Easy Extension
Adding a new framework requires only:
1. Create adapter extending BaseWorkflowAdapter
2. Implement framework-specific methods
3. Register with adapter registry

### 3. Validation Reuse
Base class provides comprehensive JSON Schema validation:
- Type checking
- Required field validation
- String length/pattern validation
- Number range validation
- Enum validation

## Code Examples

### Adapter Implementation Pattern
```typescript
class MastraAdapter extends BaseWorkflowAdapter {
  // Framework detection
  async canHandle(endpoint: string, response?: any): Promise<boolean>
  
  // Workflow discovery
  async discoverWorkflows(baseUrl: string): Promise<StandardWorkflowDefinition[]>
  
  // Schema normalization
  private normalizeSchema(rawSchema: any): StandardJSONSchema
  
  // Execution
  async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult>
}
```

### UI Consumption Pattern
```typescript
// UI doesn't know or care about framework
const executor = <WorkflowExecutor 
  workflow={standardWorkflow}  // Standardized format
  onExecute={handleExecute}    // Framework-agnostic
/>
```

## Future Framework Support

This architecture supports adding:
- n8n workflows - via n8nAdapter
- SpiffWorkflow BPMN - via SpiffAdapter
- Apache Airflow - via AirflowAdapter
- Custom internal workflows - via CustomAdapter

Each only requires implementing the adapter interface.

## See Also
- `/lib/adapters/workflow-adapter.ts` - Base implementation
- `/lib/adapters/mastra-adapter.ts` - Concrete example
- [[elements/protocols/workflow]] - Protocol specification