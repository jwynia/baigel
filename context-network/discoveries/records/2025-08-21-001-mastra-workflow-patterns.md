# Discovery: Mastra Workflow Execution Patterns

## What I Was Looking For
How to integrate workflow execution capabilities into BAIGEL as a fourth protocol type

## Found
**Location**: Live Mastra instance at `http://100.80.122.46:4111/`
**Summary**: Mastra exposes MCP tools as workflows through OpenAPI with JSON schemas for dynamic UI generation

## Significance
This discovery revealed that workflow frameworks can be unified under a common interface pattern:
1. Discovery via OpenAPI endpoints
2. Schema-driven UI generation from JSON Schema
3. Execution through standardized HTTP POST endpoints
4. Results in structured JSON format

## Key Insights

### MCP Tools as Workflows Pattern
- Mastra endpoint: `/api/mcp/v0/servers` lists available MCP servers
- Each server endpoint: `/api/mcp/{serverId}/tools` lists tools with schemas
- Execution endpoint: `/api/mcp/{serverId}/tools/{toolId}/execute`
- Tools expose `inputSchema` and `outputSchema` in JSON Schema format

### Schema Structure Example
```json
{
  "id": "text-compression",
  "name": "text-compression",
  "description": "Intelligently compresses text...",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "..." },
      "compressionLevel": { "type": "string", "enum": [...] }
    },
    "required": ["text", "compressionLevel"]
  },
  "outputSchema": { ... }
}
```

### Execution Pattern
- POST to `/api/mcp/{serverId}/tools/{toolId}/execute`
- Body: `{ "data": { ...inputs }, "runtimeContext": { ...context } }`
- Response: `{ "result": { ...outputs } }`

## Implementation Approach Discovered

### Homogenization Adapter Layer
User insight: Create adapters that translate various workflow formats to a standard internal representation. This ensures:
- UI remains unchanged when adding new frameworks
- Each framework's peculiarities are abstracted away
- Future schema format changes don't break existing UI

### StandardJSONSchema with UI Hints
Extended JSON Schema with BAIGEL-specific UI generation hints:
```typescript
interface StandardJSONSchema {
  // Standard JSON Schema fields...
  uiHints?: {
    widget?: 'textarea' | 'select' | 'date' | ...
    layout?: 'horizontal' | 'vertical' | ...
    help?: string
    // ... more UI customization
  }
}
```

## Related Discoveries
- Workflow protocol differs fundamentally from conversational protocols
- Form-driven interaction vs. natural language conversation
- Deterministic execution vs. streaming/contextual responses

## See Also
- [[elements/protocols/workflow]] - Protocol specification
- [[planning/task-records/2025-08-21-workflow-protocol-design]] - Complete implementation record
- `/lib/adapters/mastra-adapter.ts:226-336` - Tool to workflow conversion implementation