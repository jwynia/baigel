# BAIGEL 🥯

**B**ridge for **A**gent **I**nterfaces and **G**eneral **E**verything **L**ayers

A protocol-agnostic front-end for AI agents that provides a universal interface to interact with agents across different communication protocols (MCP, A2A, AG-UI, OpenAI Functions, etc.).

## 🎯 Project Overview

BAIGEL solves the N×M integration problem in the AI agent ecosystem. Instead of building custom front-ends for each agent protocol, BAIGEL provides a unified interface that can work with any agent system through a plugin-based architecture.

**Current Status**: ✅ Phase 1 Complete - Basic chat interface with privacy-first onboarding  
**Demo**: `pnpm dev` → http://localhost:3005

## 🌟 Key Features

### ✅ Currently Available
- **Privacy-First Design**: Everything runs in your browser, no server tracking
- **Clean Chat Interface**: Modern, responsive chat UI with streaming support
- **Protocol Selection**: Choose between different agent protocols
- **Connection Management**: Easy setup and switching between agent connections
- **File Upload Support**: Drag & drop files, multiple formats, progress tracking
- **Message Actions**: Copy, edit, delete, regenerate responses
- **Dark/Light Mode**: Adaptive theming with user preference persistence
- **Self-Hostable**: Run entirely on your own infrastructure

### 🚧 In Development
- **Protocol Adapters**: MCP, A2A, AG-UI implementations
- **Plugin System**: Easy addition of new protocol adapters
- **State Synchronization**: Cross-protocol state management
- **Tool Execution**: Universal tool interface across protocols
- **Resource Browser**: Unified access to agent resources

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

1. **New users** see a privacy-first onboarding explaining local-only operation
2. **Returning users** go directly to the chat interface
3. **Try the interface** with mock protocol responses
4. **Upload files** using drag & drop or click to browse
5. **Switch themes** with the theme toggle

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
├── components/
│   ├── chat/              # Chat interface components
│   ├── onboarding/        # Privacy onboarding flow
│   ├── connections/       # Connection management
│   └── ui/                # Shadcn UI components
├── lib/
│   ├── stores/            # Zustand state stores
│   ├── services/          # Core services
│   └── types.ts           # TypeScript definitions
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
| **MCP** | 🚧 Planning | Model Context Protocol - Local AI tool execution |
| **A2A** | 🚧 Planning | Agent-to-Agent - Multi-agent coordination |
| **AG-UI** | 🚧 Planning | Agent UI Protocol - Real-time streaming |
| **OpenAI Functions** | 🚧 Planning | OpenAI-compatible function calling |
| **Custom** | ✅ Supported | Plugin system for custom protocols |

## 🎨 UI Components

### Current Components
- **ChatInterface**: Main chat container with message history
- **MessageBubble**: Individual messages with streaming animation
- **MessageInput**: Text input with file attachment support  
- **MessageActions**: Context menu (copy, edit, delete, regenerate)
- **FileUpload**: Drag & drop file upload with validation
- **AttachmentViewer**: Multi-format file preview and download
- **ProtocolSelector**: Switch between different agent protocols
- **ConnectionStatus**: Real-time connection monitoring
- **OnboardingPage**: Privacy-first user onboarding

### Upcoming Components
- **ToolExecutor**: Universal tool execution interface
- **ResourceBrowser**: Cross-protocol resource exploration
- **DebugPanel**: Protocol message inspection and debugging
- **SettingsPanel**: Configuration and preferences

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