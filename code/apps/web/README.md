# BAIGEL 🥯

**B**ridge for **A**gent **I**nterfaces and **G**eneral **E**verything **L**ayers

A protocol-agnostic front-end for AI agents that provides a universal interface to interact with agents across different communication protocols (MCP, A2A, AG-UI, OpenAI Functions, etc.).

## 🎯 Project Overview

BAIGEL solves the N×M integration problem in the AI agent ecosystem. Instead of building custom front-ends for each agent protocol, BAIGEL provides a unified interface that can work with any agent system through a plugin-based architecture.

**Current Status**: ✅ Phase 2 Complete - Discovery, connections, tool execution, and protocol adapters  
**Demo**: `pnpm dev` → http://localhost:3005

## 🌟 Key Features

### ✅ Currently Available
- **Privacy-First Design**: Everything runs in your browser, no server tracking
- **Agent Discovery System**: Automatic discovery of MCP servers, A2A agents, and workflows
- **Protocol Adapters**: Full implementations for MCP (JSON-RPC 2.0), A2A (Agent-to-Agent), OpenAI
- **Connection Management**: Complete connection lifecycle with testing, authentication, and storage
- **Tool Execution**: Universal tool interface with form generation and execution across protocols
- **MCP Session Management**: Proper JSON-RPC 2.0 session initialization and management
- **Two-Phase Discovery**: Agent list discovery followed by individual agent card enrichment
- **Connection Interface Detection**: Automatic detection of chat vs tools vs hybrid interfaces
- **Standards Compliance**: Prioritizes standards-compliant discovery and interaction
- **Dark/Light Mode**: Adaptive theming with user preference persistence
- **Self-Hostable**: Run entirely on your own infrastructure

### 🚧 In Development  
- **Workflow Execution**: Execute discovered workflows through the UI
- **Resource Browser**: Unified access to agent resources
- **Multi-Agent Coordination**: Cross-protocol agent orchestration
- **Advanced Tool Schemas**: Complex form generation for tool parameters

## 🏗️ Architecture

BAIGEL follows a layered architecture designed for extensibility:

```
┌─────────────────────────────────────┐
│            UI Layer                 │  ← React components, Shadcn UI
├─────────────────────────────────────┤
│         State Layer                 │  ← Zustand stores, message bus
├─────────────────────────────────────┤
│       Abstraction Layer             │  ← Protocol-agnostic interfaces
├─────────────────────────────────────┤
│        Plugin Layer                 │  ← Protocol adapters (MCP, A2A, etc.)
├─────────────────────────────────────┤
│       Transport Layer               │  ← HTTP, WebSocket, SSE, STDIO
└─────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/jwynia/baigel.git
cd baigel

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open your browser
open http://localhost:3005
```

### First Run

1. **Discovery Page**: Start by discovering agents and services at a base URL
2. **Connection Setup**: Add discovered agents as connections with automatic configuration  
3. **Tool Interface**: Execute tools through automatically generated forms
4. **Chat Interface**: Chat with conversational agents (A2A, OpenAI)
5. **Connection Management**: Switch between different agent connections seamlessly

### Testing Discovery

Try these endpoints to test the discovery system:

```bash
# Example discovery endpoints (if available)
http://localhost:4111/       # Mastra MCP aggregator + A2A agents
http://your-mcp-server/      # Any MCP-compatible server
http://your-a2a-agent/       # Any A2A-compatible agent
```

**Discovery Flow:**
1. Enter base URL in Discovery page
2. System probes for MCP aggregators, OpenAPI specs, A2A agents
3. Displays discovered services with metadata  
4. Click "Add Connection" to convert to working connection
5. Use in Chat or Tools interface based on detected capabilities

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **UI Library**: Shadcn UI components + Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties
- **State Management**: Zustand with persistence
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Turbopack for fast development

### Project Structure

```
code/apps/web/
├── app/                    # Next.js App Router
│   ├── chat/              # Chat page
│   ├── discovery/         # Agent discovery page
│   ├── settings/          # Settings page
│   └── workflows/         # Workflow discovery page
├── components/
│   ├── chat/              # Chat interface components
│   ├── connections/       # Connection management UI
│   ├── discovery/         # Agent discovery components
│   ├── tools/             # Tool execution interface
│   ├── workflows/         # Workflow discovery components
│   └── ui/                # Shadcn UI components
├── lib/
│   ├── discovery/         # Discovery protocols and probing
│   ├── services/          # Protocol adapters and execution
│   ├── stores/            # Zustand state stores
│   ├── types/             # Protocol type definitions
│   └── utils/             # Discovery utilities and converters
└── __tests__/             # Test files
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Type check
pnpm check-types
```

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🔌 Protocol Support

BAIGEL is designed to support multiple agent communication protocols:

| Protocol | Status | Description |
|----------|--------|-------------|
| **MCP** | ✅ **Implemented** | Model Context Protocol with JSON-RPC 2.0 session management |
| **A2A** | ✅ **Implemented** | Agent-to-Agent with comprehensive method pattern support |
| **Workflow** | ✅ **Implemented** | Mastra workflow discovery and aggregation |
| **OpenAI** | ✅ **Implemented** | OpenAI-compatible function calling and chat |
| **AG-UI** | 🚧 **Planned** | Agent UI Protocol - Real-time streaming |
| **Custom** | ✅ **Supported** | Extensible plugin system for new protocols |

## 🎨 UI Components

### Current Components
- **DiscoveryCard**: Agent discovery with connection conversion
- **DiscoveryProber**: Multi-protocol endpoint probing
- **ConnectionManager**: Complete connection lifecycle management
- **ConnectionSelector**: Connection switching with interface detection
- **CapabilitySelector**: Multi-select for agent capabilities
- **ToolExecutionInterface**: Universal tool forms with schema validation
- **ChatInterface**: Multi-protocol chat with hybrid tool support  
- **WorkflowDiscoveryCard**: Workflow discovery and metadata display
- **MessageList**: Streaming message display with protocol indicators
- **ConnectionStatus**: Real-time connection monitoring and testing

### Protocol-Specific Components
- **MCPSessionManager**: JSON-RPC 2.0 session initialization UI
- **A2AInteractionPanel**: Agent-to-agent communication interface  
- **OpenAIConfigPanel**: OpenAI connection configuration
- **WorkflowExecutor**: Workflow parameter forms and execution

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Check Issues**: Look for open issues or create new ones
2. **Fork & Branch**: Create a feature branch from `main`
3. **Develop**: Follow the existing code style and patterns
4. **Test**: Ensure all tests pass and add new ones for features
5. **Document**: Update docs for any user-facing changes
6. **Pull Request**: Submit a PR with a clear description

### Development Workflow

1. **Follow TDD**: Write tests before implementation
2. **Use TypeScript**: Strict typing for all new code  
3. **Accessibility First**: WCAG 2.1 AA compliance
4. **Mobile Responsive**: Support all screen sizes
5. **Performance**: Monitor bundle size and runtime performance

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/jwynia/baigel
- **Documentation**: Coming soon
- **Issues**: https://github.com/jwynia/baigel/issues
- **Discussions**: https://github.com/jwynia/baigel/discussions

## 🙏 Acknowledgments

- **Everything Everywhere All at Once** - Inspiration for the "everything bagel" concept
- **Shadcn UI** - Beautiful, accessible component library
- **Radix UI** - Primitive components with excellent accessibility
- **Vercel** - Next.js framework and deployment platform
- **The AI agent community** - For creating the protocols we're bridging

---

**BAIGEL**: Because every agent deserves a universal interface 🥯