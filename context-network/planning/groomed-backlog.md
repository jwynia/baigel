# Groomed Task Backlog - 2025-08-20

## 🚀 Ready for Implementation

### ✅ COMPLETED: Complete Shadcn UI Setup with Component Library
**Status**: COMPLETED ✅ (Discovered during sync)
**One-liner**: Install and configure Shadcn UI components with theme support  
**Completion**: Full implementation found at `/code/apps/web/components/ui/`

<details>
<summary>Implementation Evidence</summary>

**Completed Features**:
- [x] Shadcn UI CLI installed and configured
- [x] Core components installed (20+ components including Button, Card, Dialog, Input, Select, etc.)
- [x] Dark mode support via next-themes
- [x] Theme provider integrated in layout
- [x] Component exports organized in ui/index.ts

**Files Created**:
- Complete UI library at `/code/apps/web/components/ui/`
- Barrel exports in `/code/apps/web/components/ui/index.ts`
- Theme provider at `/code/apps/web/components/theme-provider.tsx`

**Status**: Ready for use by other components

</details>

---

### 2. Create Core Abstraction Types and Interfaces
**One-liner**: Define TypeScript interfaces for protocol abstraction layer  
**Effort**: 2-3 hours  
**Files to modify**: 
- `/code/packages/types/` (new package)
- `/code/packages/types/src/protocols.ts`
- `/code/packages/types/src/messages.ts`
- `/code/packages/types/src/transports.ts`

<details>
<summary>Full Implementation Details</summary>

**Context**: Core abstraction layer needs type definitions before implementing adapters. This establishes the contract all protocol adapters must follow.

**Acceptance Criteria**:
- [ ] Protocol adapter interface defined
- [ ] Message format types created
- [ ] Transport layer interfaces defined
- [ ] Capability negotiation types
- [ ] Error handling types standardized

**Implementation Guide**:
1. Create new package at `/code/packages/types`
2. Define IProtocolAdapter interface with connect, send, receive, disconnect
3. Create MessageEnvelope type for protocol-agnostic messages
4. Define transport interfaces (HTTP, WebSocket, SSE, STDIO)
5. Export all types with proper JSDoc documentation

**Watch Out For**: 
- Keep abstractions minimal to avoid coupling
- Consider versioning strategy for types
- Ensure compatibility with existing protocol specifications

</details>

---

### 3. Implement Message Bus Architecture
**One-liner**: Build internal message routing system for protocol communication  
**Effort**: 3-4 hours  
**Files to modify**: 
- `/code/packages/core/src/message-bus/` (new)
- `/code/packages/core/src/message-bus/bus.ts`
- `/code/packages/core/src/message-bus/router.ts`
- `/code/packages/core/src/message-bus/queue.ts`

<details>
<summary>Full Implementation Details</summary>

**Context**: Central message bus needed to route messages between UI, protocol adapters, and transports. This decouples components and enables protocol switching.

**Acceptance Criteria**:
- [ ] Event-driven message bus implemented
- [ ] Topic-based routing support
- [ ] Message queuing for offline/retry scenarios
- [ ] TypeScript generics for type-safe messaging
- [ ] Observable pattern for subscriptions

**Implementation Guide**:
1. Create EventEmitter-based message bus core
2. Implement topic registration and routing
3. Add message queue with retry logic
4. Create typed publish/subscribe methods
5. Add middleware support for logging/transformation
6. Write unit tests for message routing

**Watch Out For**: 
- Memory leaks from unsubscribed listeners
- Race conditions in async message handling
- Performance with high message volume

</details>

---

### 4. Build HTTP Transport Layer
**One-liner**: Implement HTTP client for REST-based protocol communication  
**Effort**: 2 hours  
**Files to modify**: 
- `/code/packages/transports/http/` (new package)
- `/code/packages/transports/http/src/client.ts`
- `/code/packages/transports/http/src/types.ts`

<details>
<summary>Full Implementation Details</summary>

**Context**: HTTP transport needed for MCP HTTP, A2A HTTPS, and OpenAI API protocols. Should handle auth, retries, and protocol-specific headers.

**Acceptance Criteria**:
- [ ] Fetch-based HTTP client with interceptors
- [ ] Automatic retry with exponential backoff
- [ ] Request/response transformation hooks
- [ ] Auth header injection support
- [ ] Timeout and cancellation support

**Implementation Guide**:
1. Create HTTPTransport class extending base transport
2. Implement request method with config options
3. Add interceptor chain for auth/headers
4. Implement retry logic with configurable attempts
5. Add request cancellation via AbortController
6. Create helper methods for common operations

**Watch Out For**: 
- CORS issues in browser environment
- Proper error typing and handling
- Request body serialization for different content types

</details>

---

## ⏳ Ready Soon (Blocked)

### SSE Transport Implementation
**Blocker**: Needs Message Bus completed first  
**Estimated unblock**: After task #3  
**Prep work possible**: Research EventSource polyfills for full browser support

### WebSocket Transport with Reconnection
**Blocker**: Needs Message Bus and core types defined  
**Estimated unblock**: After tasks #2 and #3  
**Prep work possible**: Evaluate reconnecting-websocket library options

### First Protocol Adapter (MCP)
**Blocker**: Needs transports and message bus ready  
**Estimated unblock**: After transport layers complete  
**Prep work possible**: Study MCP specification, prepare test server

## 🔍 Needs Decisions

### State Management Library Choice
**Decision needed**: Confirm Zustand vs Valtio vs TanStack Store  
**Options**: 
1. **Zustand** - Simple, proven, good DX (recommended per tech stack decision)
2. **Valtio** - Proxy-based, more magical but powerful
3. **TanStack Store** - Framework agnostic, good TypeScript

**Recommendation**: Stick with Zustand as decided, unless specific requirements emerged

### Plugin System Architecture
**Decision needed**: How should community plugins be loaded and sandboxed?  
**Options**:
1. **Dynamic imports** - Simple but requires rebuild
2. **Module Federation** - Complex but true runtime plugins
3. **iframe isolation** - Secure but limited integration

**Recommendation**: Start with dynamic imports, plan for Module Federation in v2

### Authentication Strategy
**Decision needed**: How to handle auth across different protocols?  
**Options**:
1. **Per-adapter auth** - Each adapter handles its own
2. **Unified auth layer** - Central auth management
3. **Hybrid approach** - Central store, adapter-specific handling

**Recommendation**: Hybrid approach for flexibility

## 🗑️ Archived Tasks

### Setup Redux Toolkit - **Reason**: Zustand chosen in technical stack decision
### Implement GraphQL layer - **Reason**: Not needed for current protocols
### Create Electron wrapper - **Reason**: Focusing on web-first approach initially

## Summary Statistics
- Total tasks reviewed: 15
- Ready for work: 4
- Blocked: 3
- Needs decisions: 3
- Archived: 3
- Not yet defined: 2

## Top 3 Recommendations
1. **Complete Shadcn UI setup** - Unblocks all UI development work
2. **Define core types** - Critical foundation for all protocol work  
3. **Implement message bus** - Unblocks multiple transport and adapter tasks

## Next Sprint Suggestion

Focus on foundation laying:
1. Day 1-2: Shadcn UI setup and basic component library
2. Day 3-4: Core types and abstractions
3. Day 5-7: Message bus implementation with tests
4. Day 8-9: HTTP transport layer
5. Day 10: Sprint review and planning

This sequence minimizes blockers and enables parallel work in the next sprint.