# Component and System Relationships

## Discovery System Relationships

### Discovery Flow Dependencies
```
AgentDiscovery (Container)
├── uses → DiscoveryResults (Display)
│   └── uses → DiscoveryCard (Individual Items)
├── uses → Discovery Prober Service
│   ├── uses → Protocol Parsers (A2A, MCP, OpenAI)
│   └── uses → Discovery Types
└── integrates with → Settings Store (for configuration)
```

### Protocol Integration Relationships
```
Discovery Prober
├── probes → A2A Agent Cards (/.well-known/agent-card.json)
├── probes → MCP Servers (/v1/models, /tools/list, /resources/list)  
├── probes → OpenAI APIs (/v1/models, /v1/chat/completions)
└── parses responses → Protocol-specific parsers
    ├── A2A Parser → Agent Card JSON
    ├── MCP Parser → Tool/Resource lists
    └── OpenAI Parser → Model listings
```

## Navigation System Relationships

### Page Navigation Flow
```
Home Page (/) 
├── redirects to → Chat Page (/chat) [if returning user]
├── shows → Onboarding Page [if new user]

Chat Page (/chat)
├── includes → ChatHeader with Navigation Menu
├── links to → Discovery Page (/discovery)
├── links to → Settings Page (/settings)
└── links to → Home Page (/)

Discovery Page (/discovery)  
├── includes → Navigation Header (same pattern as Chat)
├── contains → AgentDiscovery Component
└── can add agents to → Settings Store

Settings Page (/settings)
├── includes → Navigation Header (same pattern)
├── manages → All App Configuration
├── can export → Discovery results, Chat settings, etc.
└── can reset → Return to Home Page (onboarding)
```

### Header Component Relationships
```
ChatHeader, Discovery Page Header, Settings Page Header
├── all use → Same Navigation Pattern (hamburger menu)
├── all include → DropdownMenu component
├── all link to → Same pages (Home, Chat, Discovery, Settings)
└── consistent → UI/UX across app
```

## State Management Relationships

### Store Dependencies
```
Settings Store
├── manages → Export/Import of all other stores
├── can reset → All other stores (clearAllSettings)
├── reads from → connections-store, agents-store, preferences-store, onboarding-store
└── writes to → localStorage (all app data)

Onboarding Store
├── determines → Home page routing behavior
├── affects → Settings reset behavior
└── integrates with → Settings export/import

Connection Store
├── provides data to → Chat interface
├── managed by → Settings store operations
└── integrated with → Discovery system (future)

Chat Store (ChatProvider)
├── manages → Chat messages and state
├── depends on → Connection Store for active connection
└── integrated with → Settings store for persistence
```

## UI Component Relationships

### Shadcn UI Component Dependencies
```
Discovery Components
├── AgentDiscovery uses → Card, Button, Input, Alert, DropdownMenu, Collapsible, Tooltip
├── DiscoveryResults uses → Alert, Button, ScrollArea
└── DiscoveryCard uses → Card, Button, Badge

Settings Components
├── Settings Page uses → Card, Button, Alert, AlertDialog, DropdownMenu
└── Settings Store integrates with → All UI components

Navigation Components  
├── All Headers use → Button, DropdownMenu
└── Consistent → Link components for routing
```

### Theme Integration Relationships
```
Theme Provider (Root)
├── wraps → All UI components
├── provides → Dark/light mode support
├── integrates with → Settings Store (theme preference)
└── affects → All Shadcn UI components
```

## Data Flow Relationships

### Discovery to Configuration Flow
```
1. User enters URL in AgentDiscovery
2. Discovery Prober makes parallel API calls  
3. Protocol Parsers process responses
4. DiscoveryResults displays found agents
5. User selects agents to add
6. AgentConfiguration objects created
7. Settings Store receives configurations
8. localStorage updated with new agents
9. Future: Protocol Adapters consume configurations
```

### Settings Management Flow
```
1. User requests export → Settings Store reads all localStorage
2. Settings Store creates ExportData object
3. Browser downloads JSON file

1. User imports file → File picker selects JSON
2. Settings Store validates import data  
3. All localStorage stores updated
4. Page reloads to apply changes

1. User requests reset → Settings Store clears all localStorage
2. All app state cleared
3. Redirect to home page (onboarding)
```

## Integration Point Relationships

### Current Integration Points
```
Discovery System
├── ready for → Protocol Adapter integration (when available)
├── outputs → Standard AgentConfiguration format
├── compatible with → Planned Message Bus architecture
└── integrates with → Settings Store for persistence

Settings System
├── manages → All app configuration data
├── exports → Data from all stores
├── imports → Data to all stores
└── resets → All app state
```

### Future Integration Points
```
Discovery System (Future)
├── will connect to → Protocol Adapter System
├── will use → Message Bus for events
├── will integrate with → Authentication System
└── will support → Community Agent Registries

Message Bus (Planned)
├── will carry → Discovery events
├── will route → Configuration updates
├── will handle → Agent communication
└── will enable → Protocol switching
```

## Test Relationship Structure

### Test Dependencies
```
AgentDiscovery Tests
├── mocks → Discovery Prober service
├── mocks → Protocol parsers  
├── tests → User interactions (URL input, discovery flow)
├── tests → Error handling scenarios
└── verifies → Integration with Settings Store

Component Tests (Pattern)
├── Unit Tests → Individual component behavior
├── Integration Tests → Component interaction
├── Mock External Dependencies → API calls, stores
└── User Interaction Tests → Click, type, navigate
```

## File System Relationships

### Logical File Groupings
```
Discovery Feature
├── /types/discovery.ts (shared types)
├── /lib/discovery/ (business logic)  
├── /components/discovery/ (UI components)
├── /app/discovery/page.tsx (page integration)
└── /__tests__/components/discovery/ (tests)

Settings Feature
├── /lib/stores/settings.ts (business logic + state)
├── /app/settings/page.tsx (UI + integration)
└── tests embedded in main files

Navigation Feature  
├── /components/chat/ChatHeader.tsx (pattern implementation)
├── /app/discovery/page.tsx (pattern implementation)
├── /app/settings/page.tsx (pattern implementation)
└── shared dropdown menu component
```

### Import/Export Relationships
```
Type Definitions (/types/discovery.ts)
├── imported by → Discovery Prober
├── imported by → Protocol Parsers
├── imported by → All Discovery UI components
└── imported by → Settings Store

Discovery Prober (/lib/discovery/prober.ts)
├── imports → Protocol Parsers
├── imports → Discovery Types
├── imported by → AgentDiscovery component
└── could be imported by → Future background services

UI Components
├── import → Shadcn UI components
├── import → Business logic (stores, services)
├── import → Types
└── imported by → Page components
```

## Performance Relationship Impacts

### Parallel Processing Relationships
```
Discovery System
├── Prober runs → Multiple endpoint checks in parallel
├── Results processed → As responses arrive (streaming)
├── UI updates → Real-time during discovery
└── No blocking → Single endpoint failures don't stop others
```

### State Update Relationships
```
Settings Store Operations
├── Export → Reads multiple localStorage keys simultaneously
├── Import → Writes multiple localStorage keys sequentially
├── Reset → Clears all keys then redirects
└── All operations → Trigger page reloads for state consistency
```

## Security Relationship Considerations

### Data Privacy Relationships
```
Settings Store
├── exports → Configuration data (no sensitive credentials)
├── stores → Only connection metadata locally
├── resets → Completely clears user data
└── never transmits → Data to external servers

Discovery System  
├── makes → HTTP requests to user-specified URLs only
├── handles → CORS restrictions gracefully
├── stores → No sensitive data from discovery
└── respects → User privacy choices
```

---

This relationships document shows how the Discovery system, Settings management, Navigation patterns, and UI components all interconnect to form a cohesive user experience while maintaining clean architectural separation of concerns.