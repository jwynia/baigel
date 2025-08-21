# Integration Strategy: Claude Code SDK with BAIGEL

## Classification
- **Domain:** Strategic/Planning
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** High

## Strategic Overview

The Claude Code SDK uses MCP (Model Context Protocol) as its underlying communication standard. Since BAIGEL already plans to support MCP as a primary protocol, Claude Code SDK integration is achieved through the standard MCP adapter without requiring custom protocol work.

## Integration Decision

### Should BAIGEL Create a Custom Claude Code Adapter?
**Decision: NO**

**Rationale:**
1. Claude Code SDK is an MCP implementation, not a separate protocol
2. MCP adapter will provide full Claude Code SDK compatibility
3. Avoiding duplicate work and maintaining cleaner architecture
4. Following the standard ensures future compatibility

## Integration Architecture

```
BAIGEL UI Layer
      ↓
Protocol Abstraction Layer
      ↓
MCP Adapter ← (Handles Claude Code SDK, CUI, and other MCP servers)
      ↓
Transport Layer (HTTP | SSE | WebSocket)
      ↓
Claude Code SDK Server / CUI Server / Any MCP Server
```

## Key Integration Points

### 1. Protocol Adapter
- **Implementation:** Single MCP adapter handles all MCP-compatible services
- **Configuration:** Dynamic based on server capabilities
- **Transport Selection:** Automatic based on use case

### 2. Tool Definitions
- **Standard:** Use MCP tool schema definitions
- **Claude Code Tools:** File ops, shell, code review, etc.
- **Extensibility:** Support custom tools per server

### 3. Authentication
- **Pattern:** Header-based API key authentication
- **Configuration:** Environment variables or secure storage
- **Multi-tenant:** Support different keys per connection

### 4. Streaming Support
- **SSE:** For one-way streaming (Claude responses)
- **WebSocket:** For bidirectional communication (future)
- **Progressive Updates:** Real-time UI updates during generation

## Implementation Phases

### Phase 1: Basic MCP Support (Covers Claude Code)
- HTTP transport implementation
- Basic tool invocation
- Authentication handling
- Simple request-response

### Phase 2: Streaming Enhancement
- SSE transport for streaming responses
- Progressive UI updates
- Cost tracking from metadata
- Error recovery

### Phase 3: Advanced Features
- WebSocket-like bidirectional support
- Parallel session management (like CUI)
- Background agent support
- Multi-model routing

## Compatibility Matrix

| Feature | MCP Spec | Claude Code SDK | CUI | BAIGEL Support |
|---------|----------|-----------------|-----|----------------|
| HTTP Transport | ✅ | ✅ | ✅ | Phase 1 |
| SSE Streaming | ✅ | ✅ | ✅ | Phase 2 |
| Tool Invocation | ✅ | ✅ | ✅ | Phase 1 |
| Auth Headers | ✅ | ✅ | ✅ | Phase 1 |
| Capability Negotiation | ✅ | ✅ | ✅ | Phase 1 |
| Cost Tracking | ✅ | ✅ | ✅ | Phase 2 |
| Parallel Sessions | ➖ | ➖ | ✅ | Phase 3 |
| WebSocket | 🔄 | 🔄 | ➖ | Phase 3 |

Legend: ✅ Supported | ➖ Not Required | 🔄 Planned/Implied

## Benefits of This Approach

### For BAIGEL
1. **Reduced Complexity:** One adapter for entire MCP ecosystem
2. **Future Proof:** Automatic compatibility with MCP updates
3. **Broader Compatibility:** Works with any MCP server
4. **Cleaner Architecture:** No protocol-specific code in UI

### For Users
1. **Seamless Integration:** Claude Code tools just work
2. **Consistent Experience:** Same UI for all MCP tools
3. **Tool Discovery:** Automatic capability detection
4. **Performance:** Optimal transport selection

## Risk Mitigation

### Identified Risks
1. **MCP Spec Changes:** Protocol evolves incompatibly
   - *Mitigation:* Version negotiation, adapter versioning

2. **Performance Issues:** Abstraction overhead
   - *Mitigation:* Direct transport access when needed

3. **Feature Gaps:** MCP doesn't expose all Claude features
   - *Mitigation:* Extension points in adapter

4. **Authentication Complexity:** Different servers need different auth
   - *Mitigation:* Pluggable auth strategies

## Success Criteria

### Short Term (3 months)
- [ ] MCP adapter connects to Claude Code SDK
- [ ] Basic tool invocation working
- [ ] Streaming responses displayed in UI
- [ ] Authentication properly abstracted

### Medium Term (6 months)  
- [ ] Full tool suite accessible
- [ ] Performance on par with native clients
- [ ] Multiple MCP servers supported simultaneously
- [ ] WebSocket patterns implemented

### Long Term (12 months)
- [ ] Seamless multi-model support via routing
- [ ] Advanced agent coordination patterns
- [ ] Community MCP tools integrated
- [ ] BAIGEL becomes reference MCP client implementation

## Recommended Next Steps

1. **Immediate:** Continue with planned MCP adapter development
2. **Testing:** Use Claude Code SDK as primary MCP test target
3. **Documentation:** Note that Claude Code = MCP in all docs
4. **Community:** Engage with MCP ecosystem for tool discovery
5. **Monitoring:** Track MCP spec evolution for breaking changes

## Conclusion

The Claude Code SDK's use of MCP validates BAIGEL's protocol selection. No custom work is needed for Claude Code compatibility - the standard MCP adapter provides full support. This discovery simplifies the development roadmap and ensures broad compatibility with the growing MCP ecosystem.

## References

- [[elements/protocols/mcp]] - MCP protocol details
- [[research/claude-code-sdk-protocol/findings]] - Detailed research findings
- [[planning/roadmap]] - Updated to reflect this integration strategy