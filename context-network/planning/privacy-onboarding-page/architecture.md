# Architecture Design: Privacy-First Onboarding Page

## High-Level Architecture

### System Context
```
┌─────────────────────────────────────────────────┐
│                 User Browser                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐     ┌──────────────┐         │
│  │   Route      │────▶│  Detection   │         │
│  │   Handler    │     │   Service    │         │
│  │   (/)        │     └──────────────┘         │
│  └──────────────┘              │                │
│         │                      ▼                │
│         │              ┌──────────────┐         │
│         │              │  Storage     │         │
│         ├─────────────▶│  Check       │         │
│         │              └──────────────┘         │
│         │                      │                │
│         ▼                      ▼                │
│  ┌──────────────┐     ┌──────────────┐         │
│  │  Onboarding  │     │   Main App   │         │
│  │   Page       │     │   (Chat)     │         │
│  └──────────────┘     └──────────────┘         │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │        Browser Storage              │         │
│  │  ┌──────────┐  ┌──────────┐       │         │
│  │  │localStorage│  │IndexedDB │       │         │
│  │  └──────────┘  └──────────┘       │         │
│  └────────────────────────────────────┘         │
└─────────────────────────────────────────────────┘
```

### Component Architecture

```typescript
interface OnboardingArchitecture {
  // Core Components
  components: {
    OnboardingPage: {
      // Main container component
      responsibilities: [
        "Orchestrate onboarding flow",
        "Handle user acknowledgment",
        "Transition to main app"
      ]
    },
    StorageDetector: {
      // Storage detection service
      responsibilities: [
        "Check for existing user data",
        "Validate storage availability",
        "Determine user status"
      ]
    },
    PrivacyHero: {
      // Hero section with privacy message
      responsibilities: [
        "Display privacy promise",
        "Explain local storage",
        "Build trust"
      ]
    },
    QuickStart: {
      // Acknowledgment and start section
      responsibilities: [
        "Present agreement text",
        "Handle user acknowledgment",
        "Save first-use flag"
      ]
    },
    FeatureHighlights: {
      // Optional feature showcase
      responsibilities: [
        "Show key features",
        "Maintain engagement",
        "Progressive disclosure"
      ]
    }
  },
  
  // State Management
  state: {
    OnboardingStore: {
      userStatus: "new" | "returning" | "checking",
      storageAvailable: boolean,
      hasAcknowledged: boolean,
      detectionError: Error | null
    }
  },
  
  // Services
  services: {
    StorageService: {
      checkUserStatus(): UserStatus,
      saveAcknowledgment(): void,
      isStorageAvailable(): boolean,
      getStorageInfo(): StorageInfo
    }
  }
}
```

## Detailed Component Design

### 1. Route Handler Component
```typescript
// app/page.tsx
interface RouteHandlerDesign {
  purpose: "Entry point that determines what to show",
  
  flow: {
    1: "Component mounts",
    2: "Check storage for user status",
    3: "Route to appropriate view",
    4: "Handle loading states"
  },
  
  states: {
    loading: "Checking user status",
    newUser: "Show onboarding",
    returningUser: "Redirect to app",
    error: "Show fallback UI"
  },
  
  implementation: `
    const HomePage = () => {
      const [status, setStatus] = useState<UserStatus>('checking');
      
      useEffect(() => {
        const checkStatus = async () => {
          const detector = new StorageDetector();
          const userStatus = await detector.getUserStatus();
          setStatus(userStatus);
          
          if (userStatus === 'returning') {
            router.push('/chat');
          }
        };
        checkStatus();
      }, []);
      
      if (status === 'checking') return <LoadingSpinner />;
      if (status === 'new') return <OnboardingPage />;
      return null; // Redirecting
    };
  `
}
```

### 2. Storage Detection Service
```typescript
// lib/services/storageDetector.ts
interface StorageDetectorDesign {
  purpose: "Detect if user has saved data",
  
  detection_keys: [
    "baigel:acknowledged",      // Onboarding completed
    "baigel:settings",          // User preferences  
    "connection-storage",       // Saved connections
    "chat-history"             // Previous conversations
  ],
  
  methods: {
    getUserStatus(): {
      logic: [
        "Check if localStorage is available",
        "Look for any BAIGEL keys",
        "Check IndexedDB for data",
        "Return appropriate status"
      ],
      returns: "new" | "returning" | "restricted"
    },
    
    isFirstVisit(): {
      logic: [
        "Check for acknowledgment flag",
        "Verify no existing data",
        "Handle edge cases"
      ],
      returns: boolean
    },
    
    canUseStorage(): {
      logic: [
        "Test localStorage write/read",
        "Test IndexedDB availability",
        "Check quota availability"
      ],
      returns: {
        localStorage: boolean,
        indexedDB: boolean,
        quotaAvailable: number
      }
    }
  },
  
  edge_cases: [
    "Private browsing mode",
    "Storage disabled by user",
    "Quota exceeded",
    "Browser restrictions"
  ]
}
```

### 3. Onboarding Page Component
```typescript
// components/onboarding/OnboardingPage.tsx
interface OnboardingPageDesign {
  purpose: "Main onboarding experience",
  
  sections: {
    hero: {
      title: "Your AI Conversations Stay With You",
      subtitle: "Everything happens in your browser",
      icon: "Shield or Lock icon"
    },
    
    privacy_message: {
      heading: "Nothing Gets Stored on Our Servers",
      content: `
        Seeing this message means we truly don't know who you are.
        Your conversations, settings, and connections stay on your device.
        You own your data. Export it anytime. Delete it anytime.
      `,
      visual: "Illustration showing browser vs cloud"
    },
    
    quick_start: {
      heading: "Ready to start?",
      agreement: "I understand my data stays in my browser",
      cta: "Start Using BAIGEL",
      secondary: "Learn more about local storage"
    },
    
    features: {
      // Optional progressive disclosure
      items: [
        "Connect to any AI protocol",
        "No accounts needed",
        "Works offline",
        "Export your data anytime"
      ]
    }
  },
  
  interactions: {
    onAgree: {
      actions: [
        "Save acknowledgment flag",
        "Initialize default settings",
        "Navigate to chat interface",
        "Show optional quick tour"
      ]
    },
    
    onLearnMore: {
      actions: [
        "Expand detailed explanation",
        "Show technical details",
        "Link to documentation"
      ]
    }
  }
}
```

### 4. State Management
```typescript
// lib/stores/onboarding.ts
interface OnboardingStore {
  // State
  state: {
    userStatus: "checking" | "new" | "returning",
    hasAcknowledged: boolean,
    storageAvailable: boolean,
    showDetails: boolean,
    error: Error | null
  },
  
  // Actions
  actions: {
    checkUserStatus(): Promise<void>,
    acknowledgePrivacy(): Promise<void>,
    toggleDetails(): void,
    skipOnboarding(): void,
    resetOnboarding(): void  // For testing
  },
  
  // Persistence
  persistence: {
    key: "baigel:onboarding",
    data: {
      acknowledged: boolean,
      acknowledgedAt: Date,
      version: string
    }
  }
}
```

## Data Flow

### New User Flow
```
1. User visits "/" 
   └─> RouteHandler mounts
   
2. StorageDetector.getUserStatus()
   └─> Checks localStorage
   └─> Finds no BAIGEL keys
   └─> Returns "new"
   
3. Display OnboardingPage
   └─> Show privacy hero
   └─> Display agreement section
   
4. User clicks "Start Using BAIGEL"
   └─> Save acknowledgment flag
   └─> Initialize settings
   └─> Route to /chat
   
5. Future visits
   └─> Detect acknowledgment flag
   └─> Route directly to /chat
```

### Returning User Flow
```
1. User visits "/"
   └─> RouteHandler mounts
   
2. StorageDetector.getUserStatus()
   └─> Checks localStorage
   └─> Finds existing data
   └─> Returns "returning"
   
3. Immediate redirect
   └─> router.push("/chat")
   └─> No onboarding shown
```

## UI Component Structure

### Visual Hierarchy
```
┌─────────────────────────────────────────┐
│                                         │
│            [Shield Icon]                │
│                                         │
│    Your AI Conversations Stay          │
│           With You                      │
│                                         │
│    Everything happens in your browser   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   Nothing Gets Stored on Our Servers    │
│                                         │
│   Seeing this message means we truly    │
│   don't know who you are. Your chats,   │
│   settings, and connections stay on     │
│   your device.                          │
│                                         │
│   [Browser Icon] ← Your Data            │
│   [Cloud Icon X] ← Not Here             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ✓ I understand my data stays local    │
│                                         │
│   [Start Using BAIGEL] [Learn More]     │
│                                         │
└─────────────────────────────────────────┘
```

### Responsive Design
```typescript
interface ResponsiveStrategy {
  mobile: {
    layout: "single column",
    hero_size: "reduced",
    illustration: "simplified",
    text_size: "base",
    cta_placement: "fixed bottom"
  },
  
  tablet: {
    layout: "single column wide",
    hero_size: "medium",
    illustration: "full",
    text_size: "lg",
    cta_placement: "inline"
  },
  
  desktop: {
    layout: "centered container",
    hero_size: "large",
    illustration: "animated",
    text_size: "xl",
    cta_placement: "inline",
    max_width: "800px"
  }
}
```

## Integration Points

### With Existing Systems
```typescript
interface IntegrationPoints {
  storage: {
    // Reuse existing storage service
    service: "@/lib/stores/connections",
    detection: "Check for any persisted data",
    initialization: "Set up default stores"
  },
  
  routing: {
    // Next.js App Router
    from: "app/page.tsx",
    to: "app/chat/page.tsx",
    method: "router.push() or redirect()"
  },
  
  theme: {
    // Respect user's theme preference
    detection: "Check for saved theme",
    default: "Follow system preference",
    consistency: "Use existing design tokens"
  },
  
  components: {
    // Reuse existing UI components
    Button: "@/components/ui/button",
    Card: "@/components/ui/card",
    Icons: "lucide-react"
  }
}
```

### API Contracts
```typescript
// No external APIs - all client-side
interface ClientSideContracts {
  localStorage: {
    read: {
      keys: string[],
      returns: Record<string, any> | null
    },
    write: {
      key: string,
      value: any,
      returns: void | Error
    }
  },
  
  indexedDB: {
    check: {
      database: "baigel-db",
      returns: boolean
    }
  },
  
  router: {
    navigate: {
      path: string,
      options?: NavigateOptions,
      returns: Promise<void>
    }
  }
}
```

## Performance Considerations

### Load Performance
```typescript
interface PerformanceTargets {
  metrics: {
    detection_time: "<50ms",
    first_paint: "<100ms",
    interactive: "<200ms",
    redirect_time: "<100ms for returning users"
  },
  
  optimizations: {
    detection: [
      "Check localStorage first (fastest)",
      "Async IndexedDB check",
      "Cache detection result in memory"
    ],
    
    rendering: [
      "Server-side render onboarding page",
      "Lazy load animations",
      "Preload chat route for quick transition"
    ],
    
    assets: [
      "Inline critical CSS",
      "Lazy load illustrations",
      "Use system fonts initially"
    ]
  },
  
  monitoring: {
    track: [
      "Time to detection",
      "Time to interaction",
      "Bounce rate",
      "Completion rate"
    ]
  }
}
```

### Storage Performance
```typescript
interface StoragePerformance {
  strategies: {
    detection: {
      // Minimize storage reads
      approach: "Single composite check",
      avoid: "Multiple sequential reads"
    },
    
    writing: {
      // Batch writes when possible
      approach: "Write acknowledgment with initial settings",
      avoid: "Multiple small writes"
    },
    
    fallback: {
      // Handle storage failures gracefully
      approach: "Show onboarding anyway",
      warning: "Display storage limitation notice"
    }
  }
}
```

## Security Considerations

### Client-Side Security
```typescript
interface SecurityMeasures {
  storage: {
    // No sensitive data in detection
    safe_keys: [
      "acknowledged",
      "hasSettings",
      "themePreference"
    ],
    
    // Don't expose user data
    avoid_exposing: [
      "Conversation content",
      "Connection credentials",
      "Personal settings"
    ]
  },
  
  xss_prevention: {
    // All content is static
    user_input: "None on this page",
    sanitization: "Not needed",
    csp: "Strict Content Security Policy"
  },
  
  privacy: {
    // No tracking or analytics
    tracking: "None",
    cookies: "None",
    external_requests: "None",
    logs: "Client-side only"
  }
}
```

## Accessibility Design

### WCAG 2.1 Compliance
```typescript
interface AccessibilityRequirements {
  structure: {
    landmarks: [
      "main",
      "navigation",
      "contentinfo"
    ],
    headings: "Logical hierarchy (h1 → h2 → h3)",
    focus: "Visible focus indicators"
  },
  
  interactions: {
    keyboard: {
      tab_order: "Logical flow",
      shortcuts: "None needed",
      skip_links: "Skip to main content"
    },
    
    screen_reader: {
      announcements: [
        "Page purpose on load",
        "Status changes",
        "Navigation actions"
      ],
      labels: "All interactive elements labeled",
      descriptions: "Complex concepts explained"
    }
  },
  
  visual: {
    contrast: "WCAG AAA where possible",
    text_size: "Minimum 16px base",
    animations: "Respect prefers-reduced-motion"
  }
}
```

## Testing Strategy

### Component Testing
```typescript
interface TestingApproach {
  unit_tests: {
    StorageDetector: [
      "Correctly identifies new users",
      "Correctly identifies returning users",
      "Handles storage failures",
      "Works in private browsing"
    ],
    
    OnboardingPage: [
      "Renders all sections",
      "Handles acknowledgment",
      "Saves flag correctly",
      "Navigates on completion"
    ]
  },
  
  integration_tests: {
    flows: [
      "New user complete flow",
      "Returning user redirect",
      "Storage failure handling",
      "Mobile responsive behavior"
    ]
  },
  
  e2e_tests: {
    scenarios: [
      "First visit → acknowledgment → chat",
      "Return visit → immediate redirect",
      "Clear data → see onboarding again",
      "Private browsing behavior"
    ]
  }
}
```

## Migration Strategy

### From Current Landing Page
```typescript
interface MigrationPlan {
  phases: {
    1: {
      name: "Add detection logic",
      changes: [
        "Implement StorageDetector",
        "Add conditional routing",
        "Keep existing page as fallback"
      ]
    },
    
    2: {
      name: "Build onboarding page",
      changes: [
        "Create OnboardingPage component",
        "Add privacy messaging",
        "Implement acknowledgment flow"
      ]
    },
    
    3: {
      name: "Integration",
      changes: [
        "Wire up detection to routing",
        "Test with real storage",
        "Add proper redirects"
      ]
    },
    
    4: {
      name: "Polish",
      changes: [
        "Add animations",
        "Optimize performance",
        "Finalize copy"
      ]
    }
  },
  
  rollback: {
    strategy: "Feature flag",
    toggle: "ENABLE_PRIVACY_ONBOARDING",
    default: false
  }
}
```

## Decision Log

### Key Architecture Decisions

1. **Client-Side Detection Only**
   - Rationale: Maintains privacy promise
   - Alternative: Server-side user tracking
   - Decision: Client-side aligns with values

2. **Simple Acknowledgment vs TOS**
   - Rationale: Reduces friction
   - Alternative: Full legal terms
   - Decision: Simple checkbox sufficient

3. **Redirect vs SPA Transition**
   - Rationale: Clear navigation intent
   - Alternative: Soft navigation
   - Decision: Hard redirect clearer

4. **Storage Detection Strategy**
   - Rationale: Fast and reliable
   - Alternative: Complex heuristics
   - Decision: Simple key presence check

---
*Created: 2025-08-21*  
*Domain: Architecture*  
*Stability: Semi-stable*  
*Confidence: High*