# Technical Stack Decisions

## Decision Record
- **Date:** 2025-08-20
- **Status:** Approved
- **Deciders:** Project Team
- **Category:** Architecture

## Context
BAIGEL requires a modern, flexible technical stack that can handle multiple transport protocols (HTTP, SSE, WebSocket, STDIO) while providing an excellent developer experience with React and Shadcn UI.

## Decision

### Frontend Stack

#### Core Framework
- **Next.js 14** with App Router
  - Provides SSR/SSG capabilities for better performance
  - Built-in API routes for protocol proxying
  - Excellent TypeScript support
  - Streaming support aligns with AG-UI protocol

#### UI Layer
- **Shadcn UI** - Modern, accessible component library
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Underlying primitives for Shadcn
- **next-themes** - Dark mode support
- **Lucide React** - Icon library

#### State Management
- **Zustand** - Primary state management for UI and protocol state
- **TanStack Query** - Server state and caching
- **Valtio** - For complex reactive state (if needed)

#### Forms & Validation
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **@hookform/resolvers** - Zod integration

#### Code Display
- **Shiki** - Syntax highlighting for code in agent responses
- **@tailwindcss/typography** - Prose styling for markdown

### Protocol Communication Layer

#### Transport Implementations
```typescript
// All transports needed for complete protocol support
{
  "http": {
    "library": "Native fetch API",
    "use_cases": ["MCP HTTP", "A2A HTTPS", "OpenAI API"]
  },
  "websocket": {
    "library": "Native WebSocket API + reconnecting-websocket",
    "use_cases": ["AG-UI WebSocket", "Real-time updates"]
  },
  "sse": {
    "library": "Native EventSource + eventsource polyfill",
    "use_cases": ["MCP SSE", "A2A SSE", "AG-UI SSE"]
  },
  "stdio": {
    "library": "Node.js child_process (for Electron/Tauri)",
    "use_cases": ["MCP local servers"]
  },
  "grpc": {
    "library": "grpc-web (if needed)",
    "use_cases": ["Future protocol support"]
  }
}
```

### Backend/API Layer

#### API Framework
- **Next.js API Routes** - Built into Next.js
- **tRPC** - Type-safe API layer (optional)
- **Zod** - Runtime validation for API

#### Protocol Adapters
- Each protocol gets its own package
- Shared interface for all adapters
- Plugin system for community adapters

### Development Environment

#### Package Management
- **pnpm** - Fast, efficient package manager
- **Turborepo** - Monorepo build system
- **Changesets** - Version management

#### TypeScript Configuration
- **TypeScript 5.3+** - Latest features
- **Strict mode** enabled
- **Path aliases** for clean imports

#### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

#### Code Quality
- **ESLint** - Linting with Next.js config
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

### Project Structure
```
baigel/
├── apps/
│   ├── web/                      # Next.js application
│   │   ├── app/                  # App router pages
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Shadcn components
│   │   │   ├── chat/            # Chat interface
│   │   │   ├── tools/           # Tool execution UI
│   │   │   └── protocols/       # Protocol-specific UI
│   │   ├── lib/                 # Utilities
│   │   ├── hooks/               # Custom React hooks
│   │   └── stores/              # Zustand stores
│   │
│   └── docs/                     # Documentation site (Nextra)
│
├── packages/
│   ├── core/                     # Core abstractions
│   │   ├── src/
│   │   │   ├── message-bus/     # Internal messaging
│   │   │   ├── state/           # State management
│   │   │   ├── auth/            # Authentication
│   │   │   └── types/           # Core types
│   │   └── package.json
│   │
│   ├── transports/               # Transport implementations
│   │   ├── http/                # HTTP client
│   │   ├── websocket/           # WebSocket client
│   │   ├── sse/                 # SSE client
│   │   ├── stdio/               # STDIO handler
│   │   └── package.json
│   │
│   ├── adapters/                 # Protocol adapters
│   │   ├── mcp/                 # MCP adapter
│   │   ├── a2a/                 # A2A adapter
│   │   ├── ag-ui/               # AG-UI adapter
│   │   ├── openai/              # OpenAI adapter
│   │   └── langchain/           # LangChain adapter
│   │
│   ├── ui/                       # Shared UI library
│   │   ├── src/
│   │   │   ├── components/      # Reusable components
│   │   │   └── hooks/           # Shared hooks
│   │   └── package.json
│   │
│   └── types/                    # Shared TypeScript types
│       ├── protocols/            # Protocol-specific types
│       ├── messages/             # Message types
│       └── package.json
│
├── plugins/                      # Community plugins
│   └── example-plugin/
│
├── config/                       # Shared configs
│   ├── eslint/
│   ├── typescript/
│   └── tailwind/
│
└── tests/                        # E2E tests
    ├── fixtures/                 # Test data
    └── e2e/                      # Playwright tests
```

## Implementation Plan

### Phase 1: Foundation
1. Set up Next.js with TypeScript
2. Configure Shadcn UI
3. Implement basic transport layers
4. Create message bus architecture

### Phase 2: Protocol Support
1. Implement AG-UI adapter (primary UI protocol)
2. Add MCP adapter with HTTP+SSE
3. Create A2A adapter
4. Build OpenAI Functions adapter

### Phase 3: Advanced Features
1. Add WebSocket support for AG-UI
2. Implement STDIO for local MCP servers
3. Create plugin system
4. Add authentication layer

## Transport Layer Details

### HTTP Transport
```typescript
// Shared HTTP client with protocol-specific headers
class HTTPTransport {
  async request(config: RequestConfig): Promise<Response> {
    return fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(config.body)
    });
  }
}
```

### SSE Transport
```typescript
// Server-Sent Events with reconnection
class SSETransport {
  private eventSource: EventSource;
  
  connect(url: string): Observable<MessageEvent> {
    this.eventSource = new EventSource(url);
    return fromEvent(this.eventSource, 'message');
  }
}
```

### WebSocket Transport
```typescript
// WebSocket with automatic reconnection
class WebSocketTransport {
  private ws: ReconnectingWebSocket;
  
  connect(url: string): Observable<MessageEvent> {
    this.ws = new ReconnectingWebSocket(url);
    return fromEvent(this.ws, 'message');
  }
}
```

### STDIO Transport (Electron/Tauri only)
```typescript
// Local process communication
class STDIOTransport {
  private process: ChildProcess;
  
  spawn(command: string, args: string[]): Observable<string> {
    this.process = spawn(command, args);
    return fromEvent(this.process.stdout, 'data');
  }
}
```

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "shiki": "^1.0.0",
    "lucide-react": "^0.400.0",
    "next-themes": "^0.3.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  }
}
```

### Transport Dependencies
```json
{
  "dependencies": {
    "eventsource": "^2.0.0",
    "reconnecting-websocket": "^4.4.0",
    "comlink": "^4.4.0"
  }
}
```

## Alternatives Considered

### Vite vs Next.js
- **Vite**: Faster dev server, simpler setup
- **Next.js** (chosen): Better for production, built-in SSR, API routes

### Redux vs Zustand
- **Redux**: More mature, larger ecosystem
- **Zustand** (chosen): Simpler API, less boilerplate, better DX

### Socket.io vs Native WebSocket
- **Socket.io**: More features, fallback support
- **Native WebSocket** (chosen): Lighter, standard-compliant, sufficient for our needs

## Risks and Mitigations

### Risk: Transport Compatibility
- **Mitigation**: Test all transports extensively, provide fallbacks

### Risk: State Synchronization
- **Mitigation**: Use event sourcing, implement conflict resolution

### Risk: Performance with Multiple Protocols
- **Mitigation**: Lazy load adapters, use Web Workers for heavy processing

## References
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Protocol Transport Requirements](../elements/protocols/comparison-matrix.md)
- [Integration Strategies](../elements/protocols/integration-strategies.md)

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Review Date:** 2025-09-20
- **Status:** Approved