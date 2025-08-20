# Protocols Index

## Overview
This section documents the various agent communication protocols that BAIGEL supports or plans to support through its plugin architecture.

## Classification
- **Domain:** Technical Documentation
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Evolving

## Protocol Categories

### Core Protocols
These are the primary protocols that BAIGEL will support in its initial releases:

1. **[MCP (Model Context Protocol)](./mcp.md)** - Anthropic's protocol for LLM-to-tool communication
2. **[A2A (Agent-to-Agent)](./a2a.md)** - Google's protocol for agent interoperability
3. **[AG-UI (Agent-User Interaction)](./ag-ui.md)** - Protocol specifically for agent-to-frontend communication

### Secondary Protocols
Additional protocols for broader compatibility:

4. **[OpenAI Functions](./openai-functions.md)** - OpenAI's function calling interface
5. **[LangChain Agent Protocol](./langchain.md)** - LangChain's agent communication standard

### Framework-Specific Protocols
Protocols tied to specific agent frameworks:

6. **[AutoGPT Protocol](./autogpt.md)** - AutoGPT's communication patterns
7. **[CrewAI Protocol](./crewai.md)** - CrewAI's multi-agent coordination
8. **[BabyAGI Protocol](./babyagi.md)** - BabyAGI's task management protocol

## Key Considerations

### Protocol Diversity Challenges
- **Authentication**: Each protocol uses different auth mechanisms (OAuth 2.0, JWT, API keys)
- **Transport**: Varies from HTTP/REST to WebSockets to SSE
- **State Management**: Different approaches to maintaining conversation state
- **Message Formats**: JSON-RPC, REST, custom formats
- **Capability Discovery**: How agents advertise their capabilities

### Abstraction Strategy
Our approach to handling this diversity:
1. Common message format internally
2. Protocol-specific adapters for translation
3. Capability negotiation at connection time
4. Graceful degradation for missing features

## Navigation
- **Parent**: [Elements Index](../index.md)
- **Related**: 
  - [Architecture](../architecture/index.md) - How protocols integrate with system architecture
  - [Research Report](../../../inbox/protocol-agnostic-agent-ui-report.md) - Detailed protocol analysis

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Updated By:** Claude/Assistant