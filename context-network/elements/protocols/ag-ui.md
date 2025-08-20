# AG-UI (Agent-User Interaction Protocol)

## Overview
AG-UI is an open-source, event-based protocol developed by CopilotKit specifically designed for real-time communication and state synchronization between AI agents and user interfaces. It provides a standardized way for agents to interact with frontend applications, emphasizing streaming capabilities, state management, and transport flexibility.

## Classification
- **Domain:** Core Protocol
- **Stability:** Stable
- **Abstraction:** Technical
- **Confidence:** High

## Technical Architecture

### Core Design Principles
- **Event-Driven**: Unified stream of JSON events
- **Transport-Agnostic**: Works over HTTP, SSE, WebSockets, or webhooks
- **State-Centric**: Built-in state synchronization mechanisms
- **Streaming-First**: Optimized for real-time partial responses
- **Framework-Neutral**: Can be implemented in any language/framework

### Event Categories
1. **Lifecycle Events**: Agent task lifecycle management
2. **Message Events**: Conversational content handling
3. **Tool Events**: External tool invocation tracking
4. **State Events**: UI and agent state synchronization
5. **Error Events**: Error handling and recovery

## Event Types & Structure

### Lifecycle Events
```json
{
  "type": "RUN_STARTED",
  "timestamp": "2025-01-01T00:00:00Z",
  "run_id": "unique-run-id",
  "metadata": {
    "agent": "agent-name",
    "version": "1.0.0"
  }
}

{
  "type": "RUN_FINISHED",
  "timestamp": "2025-01-01T00:01:00Z",
  "run_id": "unique-run-id",
  "status": "success",
  "summary": {
    "duration_ms": 60000,
    "tokens_used": 1500
  }
}
```

### Message Events
```json
{
  "type": "TEXT_MESSAGE_START",
  "message_id": "msg-123",
  "role": "assistant",
  "timestamp": "2025-01-01T00:00:00Z"
}

{
  "type": "TEXT_MESSAGE_CONTENT",
  "message_id": "msg-123",
  "content": "Here is the response",
  "chunk_index": 0
}

{
  "type": "TEXT_MESSAGE_END",
  "message_id": "msg-123",
  "final_content": "Here is the response to your query.",
  "metadata": {
    "tokens": 150,
    "model": "gpt-4"
  }
}
```

### Tool Call Events
```json
{
  "type": "TOOL_CALL_START",
  "tool_call_id": "tool-456",
  "tool_name": "calculator",
  "arguments": {
    "expression": "2 + 2"
  },
  "timestamp": "2025-01-01T00:00:05Z"
}

{
  "type": "TOOL_CALL_RESULT",
  "tool_call_id": "tool-456",
  "result": {
    "value": 4,
    "type": "number"
  }
}

{
  "type": "TOOL_CALL_END",
  "tool_call_id": "tool-456",
  "status": "success",
  "duration_ms": 50
}
```

## State Management

### State Snapshot
```json
{
  "type": "STATE_SNAPSHOT",
  "state_id": "state-789",
  "timestamp": "2025-01-01T00:00:00Z",
  "state": {
    "conversation": [
      {
        "role": "user",
        "content": "Hello"
      },
      {
        "role": "assistant",
        "content": "Hi there!"
      }
    ],
    "ui_state": {
      "theme": "dark",
      "sidebar_open": true
    },
    "agent_state": {
      "context_window": 4096,
      "temperature": 0.7
    }
  }
}
```

### State Delta (Incremental Updates)
```json
{
  "type": "STATE_DELTA",
  "state_id": "state-789",
  "timestamp": "2025-01-01T00:00:10Z",
  "patches": [
    {
      "op": "add",
      "path": "/conversation/-",
      "value": {
        "role": "user",
        "content": "What's the weather?"
      }
    },
    {
      "op": "replace",
      "path": "/ui_state/sidebar_open",
      "value": false
    }
  ]
}
```

## Transport Mechanisms

### HTTP POST with Streaming Response
```http
POST /agent/chat HTTP/1.1
Content-Type: application/json

{
  "message": "User input",
  "context": {}
}

Response:
HTTP/1.1 200 OK
Content-Type: application/x-ndjson

{"type":"RUN_STARTED","run_id":"123"}
{"type":"TEXT_MESSAGE_START","message_id":"456"}
{"type":"TEXT_MESSAGE_CONTENT","content":"Processing"}
{"type":"TEXT_MESSAGE_END","final_content":"Complete response"}
{"type":"RUN_FINISHED","run_id":"123"}
```

### Server-Sent Events (SSE)
```javascript
const eventSource = new EventSource('/agent/stream');
eventSource.onmessage = (event) => {
  const agEvent = JSON.parse(event.data);
  handleAgentEvent(agEvent);
};
```

### WebSocket Connection
```javascript
const ws = new WebSocket('wss://agent.example.com/ws');
ws.onmessage = (event) => {
  const agEvent = JSON.parse(event.data);
  processEvent(agEvent);
};
```

### Binary Serialization (Advanced)
- Optional MessagePack or Protocol Buffers
- For high-performance scenarios
- Maintains same event structure
- Backward compatible with JSON

## Implementation Patterns

### Client-Side Implementation
```typescript
interface AGUIClient {
  connect(endpoint: string): Promise<void>;
  sendMessage(content: string): Promise<void>;
  onEvent(handler: (event: AGUIEvent) => void): void;
  getState(): State;
  disconnect(): void;
}

class AGUIStreamClient implements AGUIClient {
  private eventHandlers: ((event: AGUIEvent) => void)[] = [];
  private state: State = {};
  
  async connect(endpoint: string) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* initial context */ })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const events = chunk.split('\n').filter(Boolean);
      
      for (const eventStr of events) {
        const event = JSON.parse(eventStr);
        this.handleEvent(event);
      }
    }
  }
  
  private handleEvent(event: AGUIEvent) {
    // Update internal state
    if (event.type === 'STATE_SNAPSHOT') {
      this.state = event.state;
    } else if (event.type === 'STATE_DELTA') {
      this.applyPatches(event.patches);
    }
    
    // Notify handlers
    this.eventHandlers.forEach(handler => handler(event));
  }
}
```

### Server-Side Implementation
```python
from typing import AsyncGenerator
import json

class AGUIServer:
    async def handle_request(self, request: dict) -> AsyncGenerator[dict, None]:
        # Start run
        yield {
            "type": "RUN_STARTED",
            "run_id": generate_id(),
            "timestamp": datetime.now().isoformat()
        }
        
        # Stream message
        message_id = generate_id()
        yield {
            "type": "TEXT_MESSAGE_START",
            "message_id": message_id,
            "role": "assistant"
        }
        
        # Stream content chunks
        async for chunk in self.generate_response(request):
            yield {
                "type": "TEXT_MESSAGE_CONTENT",
                "message_id": message_id,
                "content": chunk
            }
        
        # End message
        yield {
            "type": "TEXT_MESSAGE_END",
            "message_id": message_id
        }
        
        # End run
        yield {
            "type": "RUN_FINISHED",
            "run_id": run_id,
            "status": "success"
        }
```

## Multi-Agent Orchestration

### Agent Handoff Events
```json
{
  "type": "AGENT_HANDOFF",
  "from_agent": "general-assistant",
  "to_agent": "specialized-expert",
  "context": {
    "reason": "Domain expertise required",
    "task": "Complex calculation"
  }
}
```

### Parallel Agent Execution
```json
{
  "type": "PARALLEL_AGENTS_START",
  "agents": ["researcher", "analyzer", "summarizer"],
  "coordination_id": "coord-123"
}

{
  "type": "PARALLEL_AGENTS_COMPLETE",
  "coordination_id": "coord-123",
  "results": {
    "researcher": { /* results */ },
    "analyzer": { /* results */ },
    "summarizer": { /* results */ }
  }
}
```

## Integration with Frameworks

### CopilotKit Integration
- Native support with React components
- Pre-built UI components
- Automatic state management
- Built-in event handlers

### LangChain Integration
- AG-UI output parser
- Custom callbacks for event emission
- State persistence adapters

### CrewAI Integration
- Agent-to-UI bridge
- Task visualization events
- Progress tracking

### Custom Framework Integration
1. Implement event emitter
2. Map framework concepts to AG-UI events
3. Handle state synchronization
4. Provide streaming capabilities

## Comparison with Other Protocols

### AG-UI vs MCP
| Aspect | AG-UI | MCP |
|--------|-------|-----|
| **Focus** | UI interaction | Tool connectivity |
| **State** | Built-in state management | Stateless |
| **Transport** | Multiple options | STDIO/HTTP+SSE |
| **Events** | 16+ event types | RPC methods |

### AG-UI vs A2A
| Aspect | AG-UI | A2A |
|--------|-------|-----|
| **Target** | Frontend applications | Agent-to-agent |
| **Architecture** | Event streaming | RPC + SSE |
| **State** | Centralized | Distributed |

### AG-UI vs OpenAI Functions
| Aspect | AG-UI | OpenAI Functions |
|--------|-------|------------------|
| **Scope** | Full UI protocol | Function calling only |
| **Streaming** | Native support | Limited |
| **State** | Managed | External |

## Best Practices

### Event Design
- Keep events small and focused
- Use consistent naming conventions
- Include timestamps and IDs
- Provide adequate metadata

### State Management
- Use snapshots for initial sync
- Apply deltas for updates
- Implement conflict resolution
- Consider state versioning

### Performance Optimization
- Batch small events when possible
- Use binary serialization for high throughput
- Implement event buffering
- Consider compression for large payloads

### Error Handling
- Emit error events with context
- Implement retry mechanisms
- Provide fallback behaviors
- Maintain event order integrity

## Integration with BAIGEL

### Protocol Adapter Design
1. **Event Translation Layer**
   - Map AG-UI events to internal format
   - Preserve streaming capabilities
   - Handle state synchronization

2. **Transport Abstraction**
   - Support multiple transport options
   - Automatic transport selection
   - Fallback mechanisms

3. **State Bridge**
   - Synchronize AG-UI state with BAIGEL state
   - Handle state conflicts
   - Provide state persistence

### Implementation Strategy
1. Start with HTTP streaming support
2. Add SSE for broader compatibility
3. Implement state management layer
4. Create UI component library
5. Build framework adapters

## Adoption & Ecosystem

### Current Adoption
- **CopilotKit**: Primary developer and maintainer
- **LangChain**: Day-zero support
- **CrewAI**: Native integration
- **LlamaIndex**: Supported
- **Mastra**: Integrated

### Use Cases
- Chat interfaces
- Form-filling assistants
- Dashboard interactions
- Multi-step workflows
- Collaborative editing
- Real-time analytics

## Future Directions

### Protocol Evolution
- Extended event types
- Improved state management
- Better multi-agent support
- Enhanced security features

### Standardization Efforts
- Working toward industry standard
- Community-driven development
- Open governance model

## Resources

### Official Documentation
- [AG-UI Documentation](https://docs.ag-ui.com)
- [CopilotKit Blog](https://www.copilotkit.ai/blog)
- [GitHub Repository](https://github.com/ag-ui-protocol/ag-ui)

### Implementation Resources
- Reference implementations
- SDK libraries
- UI component libraries
- Integration examples

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Protocol Version:** 1.0
- **Status:** Production-ready