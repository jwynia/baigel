# Research Findings: Claude Code SDK Protocol Standards

## Classification
- **Domain:** Protocol Research
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** High

## Structured Findings

### Core Concepts

#### Model Context Protocol (MCP)
- **Definition:** Open technical standard by Anthropic for AI-tool integration
- **Key Characteristics:**
  - JSON-RPC 2.0 message format
  - Tool definition schemas
  - Capability negotiation
  - Multiple transport options (HTTP, SSE, WebSocket-like)
- **Variations:** Different transport layers for different use cases
- **Source Consensus:** Strong - official Anthropic standard

#### Claude Code SDK
- **Definition:** SDK implementation that uses MCP for tool integration
- **Key Characteristics:**
  - Python and TypeScript/Node.js implementations
  - Built on top of MCP standard
  - Includes developer-focused tools (file ops, shell, code review)
  - Async message handling for streaming responses
- **Relationship to MCP:** Direct implementation, not a separate protocol
- **Source Consensus:** Strong - documented in Anthropic docs

#### CUI (Common Agent UI)
- **Definition:** Web UI wrapper for Claude Code agents
- **Key Characteristics:**
  - Powered by Claude Code SDK
  - Exposes MCP tools through web interface
  - Supports parallel background agents
  - Uses claude-code-router for multi-model support
- **Protocol Usage:** Standard MCP over HTTP/SSE
- **Source Consensus:** Moderate - based on GitHub repository analysis

### Current State Analysis

**Mature Aspects:**
- MCP specification is stable and well-documented
- HTTP and SSE transports are production-ready
- Tool definition schemas are standardized
- Authentication patterns established (API keys, OAuth)

**Emerging Trends:**
- WebSocket support implied but not fully documented
- Multi-agent coordination patterns evolving
- Task-oriented coordination drafts (IETF draft-cui-ai-agent-task)

**Contested Areas:**
- Exact WebSocket implementation details
- Optimal transport selection for different scenarios

### Communication Protocols & Transports

#### HTTP Transport
- **Description:** Request-response pattern for stateless operations
- **Use Cases:** Simple tool invocations, one-off queries
- **Strengths:** Simple, well-understood, stateless
- **Limitations:** No real-time updates, higher latency
- **Adoption Level:** Widespread

#### Server-Sent Events (SSE)
- **Description:** One-way streaming from server to client
- **Use Cases:** Live updates, progress monitoring, streaming responses
- **Strengths:** Real-time updates, simple implementation
- **Limitations:** Unidirectional only
- **Adoption Level:** Growing

#### WebSocket-like Patterns
- **Description:** Bidirectional async messaging
- **Use Cases:** Interactive sessions, multi-step workflows
- **Strengths:** Full duplex, low latency
- **Limitations:** More complex implementation
- **Adoption Level:** Implied/planned

### Tool Integration Pattern

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["mcp-remote", "<server-url>", "--header", "API_Key: ${API_KEY}"],
      "env": { "API_KEY": "<your-api-key>" }
    }
  }
}
```

### SDK Implementation Example

```python
import asyncio
from claude_code_sdk import ClaudeSDKClient

async def main():
    async with ClaudeSDKClient() as client:
        await client.query("Analyze this code")
        async for message in client.receive_response():
            print(message.content)

asyncio.run(main())
```

### Practical Applications

**Industry Usage:**
- Developer tooling integration
- Code review automation
- Multi-model agent orchestration
- Browser-based development environments

**Success Stories:**
- CUI providing web access to Claude Code
- MCP servers for various developer tools
- Integration with existing IDEs

**Common Patterns:**
- Tool registration via config files
- Header-based authentication
- Async message streaming
- Cost and duration tracking

**Best Practices:**
- Use appropriate transport for use case
- Implement proper error handling
- Monitor resource usage via metadata
- Validate tool schemas

## Cross-Domain Insights

**Similar Concepts In:**
- LSP (Language Server Protocol) - similar client-server model
- OpenAPI/Swagger - tool definition patterns
- GraphQL subscriptions - streaming patterns
- WebRTC - real-time communication

**Complements:**
- Works alongside existing AI protocols
- Can wrap other tool protocols
- Integrates with authentication standards

**Enables:**
- Universal tool access for AI agents
- Protocol-agnostic tool definitions
- Streaming and batch operations
- Multi-model support through routing

## Key Implications for BAIGEL

1. **No Custom Protocol Needed:** Claude Code SDK uses standard MCP
2. **Existing Planning Valid:** MCP adapter will cover Claude Code SDK
3. **Transport Flexibility:** Support HTTP, SSE, and WebSocket patterns
4. **Tool Definition Reuse:** Can leverage existing MCP tool schemas
5. **Authentication Patterns:** Standard header-based auth sufficient