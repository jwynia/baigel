# Implementation Guide: Claude Code SDK Integration via MCP

## Classification
- **Domain:** Practical/Applied
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** High

## Quick Start Paths

### For BAIGEL Integration
1. **Start with:** Existing MCP adapter implementation
2. **Key concepts to understand:**
   - MCP is the standard, Claude Code SDK is an implementation
   - Transport layer flexibility (HTTP, SSE, WebSocket patterns)
   - Tool definition schemas
   - Capability negotiation
3. **First practical step:** Implement MCP adapter with HTTP transport
4. **Common mistakes to avoid:**
   - Creating separate Claude Code adapter (unnecessary)
   - Hardcoding transport selection
   - Ignoring capability negotiation
   - Missing streaming response handling

### For Tool Developers
1. **Assessment checklist:**
   - [ ] Tools defined with proper schemas
   - [ ] Authentication mechanism chosen
   - [ ] Transport layer selected for use case
   - [ ] Error handling implemented
2. **Improvement opportunities:**
   - Leverage existing MCP tool definitions
   - Implement cost tracking metadata
   - Add streaming support for long operations
3. **Advanced techniques:**
   - Parallel tool execution
   - Progressive response streaming
   - Multi-model routing support
4. **Measurement approaches:**
   - Track cost per operation
   - Monitor response latency
   - Log capability usage

## Implementation Patterns

### Pattern: MCP Adapter for BAIGEL
- **Context:** Integrating Claude Code SDK capabilities into BAIGEL
- **Solution:** 
  ```typescript
  class MCPAdapter implements ProtocolAdapter {
    private transport: Transport;
    
    constructor(config: MCPConfig) {
      this.transport = this.selectTransport(config);
    }
    
    private selectTransport(config: MCPConfig): Transport {
      if (config.streaming) return new SSETransport();
      if (config.interactive) return new WebSocketTransport();
      return new HTTPTransport();
    }
    
    async connect(): Promise<void> {
      await this.transport.connect();
      await this.negotiateCapabilities();
    }
    
    async sendMessage(message: Message): Promise<Response> {
      const mcpRequest = this.transformToMCP(message);
      return await this.transport.send(mcpRequest);
    }
  }
  ```
- **Consequences:** 
  - Unified interface for all MCP-compatible tools
  - Automatic transport selection
  - Streaming support built-in
- **Examples:** CUI implementation, Claude Desktop

### Pattern: Tool Registration
- **Context:** Exposing tools to Claude Code SDK
- **Solution:**
  ```json
  {
    "tools": [
      {
        "name": "readFile",
        "description": "Read contents of a file",
        "parameters": {
          "type": "object",
          "properties": {
            "path": { "type": "string" }
          },
          "required": ["path"]
        }
      }
    ]
  }
  ```
- **Consequences:** Type-safe tool invocation
- **Examples:** File operations, code review, shell commands

### Pattern: Streaming Response Handler
- **Context:** Handling progressive responses from Claude
- **Solution:**
  ```typescript
  async function* handleStreamingResponse(stream: ReadableStream) {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const message = parseSSEMessage(value);
        yield message;
        
        // Update UI progressively
        updateUI(message);
      }
    } finally {
      reader.releaseLock();
    }
  }
  ```
- **Consequences:** Real-time UI updates, better UX
- **Examples:** Code generation, file analysis

## Decision Framework

```
IF need_real_time_updates AND unidirectional
  THEN use SSE transport
ELSE IF need_bidirectional_communication
  THEN use WebSocket-like pattern
ELSE IF simple_request_response
  THEN use HTTP transport
ELSE
  DEFAULT to HTTP with polling for status
```

## Resource Requirements

### Knowledge Prerequisites
- Understanding of MCP protocol basics
- JSON-RPC 2.0 familiarity
- Async programming patterns
- Transport layer protocols (HTTP, SSE, WebSocket)

### Technical Requirements
- Node.js >= 20.0.0 or Python >= 3.9
- MCP SDK (TypeScript or Python)
- Transport libraries (fetch, EventSource, WebSocket)
- Schema validation library (Zod, JSON Schema)

### Time Investment
- Basic MCP adapter: 2-3 days
- Full transport support: 1 week
- Production-ready with testing: 2 weeks
- Complete tool suite: 3-4 weeks

### Skill Development Path
1. Study MCP specification
2. Implement basic HTTP transport
3. Add SSE streaming support
4. Implement tool definitions
5. Add capability negotiation
6. Implement cost tracking
7. Add multi-model routing

## Integration Checklist for BAIGEL

- [ ] MCP adapter implements ProtocolAdapter interface
- [ ] All three transports supported (HTTP, SSE, WebSocket patterns)
- [ ] Tool schema validation implemented
- [ ] Capability negotiation working
- [ ] Authentication abstraction in place
- [ ] Streaming response handling tested
- [ ] Error states properly managed
- [ ] Cost metadata tracked
- [ ] Multi-model routing supported
- [ ] Connection state management robust

## Configuration Examples

### BAIGEL MCP Adapter Config
```typescript
{
  protocol: 'mcp',
  transport: 'auto', // auto-select based on use case
  endpoint: 'http://localhost:3001',
  auth: {
    type: 'header',
    key: 'API-Key',
    value: process.env.CLAUDE_API_KEY
  },
  tools: ['file', 'shell', 'code-review'],
  streaming: true,
  capabilities: {
    negotiate: true,
    version: '1.0'
  }
}
```

### CUI-style Implementation
```typescript
{
  provider: 'claude-code',
  router: 'claude-code-router',
  transport: {
    primary: 'sse',
    fallback: 'http'
  },
  parallel_sessions: true,
  background_agents: true
}
```

## Migration Path from Custom Implementations

1. **Audit current implementation**
   - Identify custom protocol elements
   - Map to MCP equivalents
   - Note gaps

2. **Implement MCP adapter**
   - Start with core functionality
   - Add transport layers incrementally
   - Maintain backward compatibility

3. **Gradual migration**
   - Run both in parallel initially
   - Route new features through MCP
   - Deprecate custom protocol

4. **Complete transition**
   - Remove custom protocol code
   - Update documentation
   - Train team on MCP standards