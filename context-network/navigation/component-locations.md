# Component Location Index

## Discovery System Components

### Core Discovery Logic
- **Discovery Types**: `/types/discovery.ts` - TypeScript interfaces and types for the discovery system
- **Discovery Prober**: `/lib/discovery/prober.ts` - Main discovery service with parallel endpoint probing  
- **Protocol Parsers**: `/lib/discovery/protocols.ts` - Protocol-specific parsing for A2A, MCP, OpenAI responses

### UI Components
- **AgentDiscovery**: `/components/discovery/AgentDiscovery.tsx` - Main discovery interface container
- **DiscoveryResults**: `/components/discovery/DiscoveryResults.tsx` - Results display with status and agent list
- **DiscoveryCard**: `/components/discovery/DiscoveryCard.tsx` - Individual agent/tool cards

### Pages
- **Discovery Page**: `/app/discovery/page.tsx` - Discovery page with full interface and navigation

### Tests
- **Discovery Tests**: `/__tests__/components/discovery/AgentDiscovery.test.tsx` - Comprehensive test suite

## Settings & Configuration

### Settings Management
- **Settings Store**: `/lib/stores/settings.ts` - Zustand store for configuration export/import/reset
- **Settings Page**: `/app/settings/page.tsx` - Settings UI with clear/reset/export/import functionality

## Navigation Components

### Headers and Navigation  
- **Chat Header**: `/components/chat/ChatHeader.tsx` - Chat page header with hamburger menu navigation
- **Navigation Pattern**: Hamburger menu with dropdown for page navigation (used in chat, discovery, settings)

## Chat System Components

### Chat Interface
- **ChatInterface**: `/components/chat/ChatInterface.tsx` - Main chat interface container
- **ChatProvider**: `/components/chat/ChatProvider.tsx` - Chat state management and context
- **ChatHeader**: `/components/chat/ChatHeader.tsx` - Header with navigation and connection info
- **MessageList**: `/components/chat/MessageList.tsx` - Chat message display
- **MessageInput**: `/components/chat/MessageInput.tsx` - Message input component

### Connection Management
- **ConnectionSelector**: `/components/connections/ConnectionSelector.tsx` - Connection selection UI

## Pages and Routing

### Main Pages
- **Home Page**: `/app/page.tsx` - Landing/onboarding page with routing logic
- **Chat Page**: `/app/chat/page.tsx` - Main chat interface page
- **Discovery Page**: `/app/discovery/page.tsx` - Agent/tool discovery interface
- **Settings Page**: `/app/settings/page.tsx` - Configuration management interface

### Layout and Root
- **Root Layout**: `/app/layout.tsx` - App-wide layout with theme provider and metadata
- **Global Styles**: `/app/globals.css` - Tailwind CSS imports and global styles

## Onboarding System

### Onboarding Components
- **OnboardingPage**: `/components/onboarding/OnboardingPage.tsx` - Main onboarding interface

### Onboarding Store
- **Onboarding Store**: `/lib/stores/onboarding.ts` - Onboarding state management

## UI Framework Components

### Shadcn UI Components
- **Button**: `/components/ui/button.tsx` - Button component with variants
- **Card**: `/components/ui/card.tsx` - Card components (Card, CardHeader, CardTitle, etc.)
- **Input**: `/components/ui/input.tsx` - Input field component
- **Badge**: `/components/ui/badge.tsx` - Badge component for labels
- **Alert**: `/components/ui/alert.tsx` - Alert/notification components
- **DropdownMenu**: `/components/ui/dropdown-menu.tsx` - Dropdown menu components
- **AlertDialog**: `/components/ui/alert-dialog.tsx` - Modal dialog components
- **Tooltip**: `/components/ui/tooltip.tsx` - Tooltip components
- **Collapsible**: `/components/ui/collapsible.tsx` - Collapsible content components
- **ScrollArea**: `/components/ui/scroll-area.tsx` - Custom scrollable area components

### Theme System
- **Theme Provider**: `/components/theme-provider.tsx` - Theme context provider for dark/light mode

## Store/State Management

### Zustand Stores
- **Settings Store**: `/lib/stores/settings.ts` - App settings, export/import, reset functionality
- **Onboarding Store**: `/lib/stores/onboarding.ts` - Onboarding completion state
- **Connection Store**: `/lib/stores/connections.ts` - Connection management state
- **Chat Store**: Part of ChatProvider context - Chat messages and state

## Utility and Configuration

### Utilities
- **CN Utility**: `/lib/utils.ts` - Class name utility for conditional styling
- **Tailwind Config**: `/tailwind.config.ts` - Tailwind CSS configuration
- **TypeScript Config**: `/tsconfig.json` - TypeScript configuration

### Test Configuration  
- **Vitest Config**: `/vitest.config.ts` - Test configuration
- **Test Setup**: `/vitest.setup.ts` - Test environment setup

## Key File Patterns

### Component Organization
```
/components/
  ├── chat/           # Chat-related components
  ├── discovery/      # Discovery system components  
  ├── connections/    # Connection management components
  ├── onboarding/     # Onboarding flow components
  └── ui/            # Reusable UI components (Shadcn)
```

### Page Organization
```  
/app/
  ├── page.tsx           # Home/onboarding page
  ├── chat/page.tsx      # Chat interface
  ├── discovery/page.tsx # Discovery interface
  ├── settings/page.tsx  # Settings interface
  └── layout.tsx         # Root layout
```

### Store Organization
```
/lib/stores/
  ├── settings.ts     # App configuration management
  ├── onboarding.ts   # Onboarding state
  └── connections.ts  # Connection management
```

### Discovery System Files
```
/types/discovery.ts           # Type definitions
/lib/discovery/
  ├── prober.ts              # Main discovery logic
  └── protocols.ts           # Protocol-specific parsers
/components/discovery/
  ├── AgentDiscovery.tsx     # Main container
  ├── DiscoveryResults.tsx   # Results display  
  └── DiscoveryCard.tsx      # Individual agent cards
```

## Connection Management System

### Core Components
- **ConnectionManager**: `/components/connections/ConnectionManager.tsx` - Central connection lifecycle management
- **ConnectionForm**: `/components/connections/ConnectionForm.tsx` - Protocol-specific configuration forms  
- **ConnectionTestDialog**: `/components/connections/ConnectionTestDialog.tsx` - Real-time connection validation
- **ConnectionSelector**: `/components/connections/ConnectionSelector.tsx` - Connection selection with protocol grouping
- **QuickConnect**: `/components/connections/QuickConnect.tsx` - Rapid connection setup with templates
- **CapabilitySelector**: `/components/connections/CapabilitySelector.tsx` - Feature selection interface

### State Management
- **Connection Store**: `/lib/stores/connections.ts` - Zustand store for connection state with persistence

### Documentation
- **System Documentation**: `/context-network/elements/ui-systems/connection-management.md`

## Workflow System

### Core Components
- **WorkflowExecutor**: `/components/workflows/WorkflowExecutor.tsx` - Main execution interface
- **UniversalFormRenderer**: `/components/workflows/UniversalFormRenderer.tsx` - Schema-driven form generation
- **ExecutionProgress**: `/components/workflows/ExecutionProgress.tsx` - Real-time progress tracking
- **ResultsDisplay**: `/components/workflows/ResultsDisplay.tsx` - Multi-format result display
- **WorkflowCatalog**: `/components/workflows/WorkflowCatalog.tsx` - Workflow browsing with search/filter
- **WorkflowDiscoveryCard**: `/components/workflows/WorkflowDiscoveryCard.tsx` - Discovery integration

### Adapter System
- **Base Adapter**: `/lib/adapters/workflow-adapter.ts` - Abstract workflow adapter interface
- **Mastra Adapter**: `/lib/adapters/mastra-adapter.ts` - Production-ready Mastra implementation

### Type System
- **Workflow Types**: `/types/workflows.ts` - Comprehensive TypeScript definitions

### Documentation
- **System Documentation**: `/context-network/elements/ui-systems/workflow-system.md`

## Layout & Navigation System

### Layout Components
- **AppLayout**: `/components/layout/AppLayout.tsx` - Responsive application layout container
- **Sidebar**: `/components/layout/Sidebar.tsx` - Desktop navigation sidebar with theme integration
- **MobileNav**: `/components/layout/MobileNav.tsx` - Mobile-optimized navigation with drawer

### Documentation
- **System Documentation**: `/context-network/elements/ui-systems/layout-navigation.md`

## Recent Additions (2025-08-30)

### Documentation Sprint Results
- **Connection Management System**: Complete documentation for production-ready connection handling
- **Workflow System**: Comprehensive documentation for schema-driven workflow execution  
- **Layout & Navigation**: Full documentation for responsive, accessible navigation system
- **Implementation Status**: Updated to reflect actual completion percentage (78% vs previous 17%)

### Major System Discoveries
- 4 complete systems were fully implemented but undocumented
- Live testing validated against real Mastra workflow services
- WCAG 2.1 AA accessibility compliance confirmed
- Production-ready state confirmed for all documented systems

### Discovery System (Previously Added 2025-08-21)
- Complete agent/tool discovery UI system with protocol detection
- Settings management with export/import/reset functionality  
- Navigation integration across all pages
- Comprehensive test coverage for discovery functionality

### Navigation Enhancements
- Hamburger menu navigation pattern established
- Consistent header across chat, discovery, and settings pages
- Dropdown menu with proper routing and accessibility

### State Management
- Settings store for configuration management
- Export/import functionality for backup/restore
- Complete reset functionality for testing and cleanup