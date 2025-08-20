# Client-Only Architecture Decision

## Decision Record
- **Date:** 2025-08-20
- **Status:** Approved
- **Deciders:** Project Team
- **Category:** Architecture

## Context
BAIGEL is a protocol-agnostic frontend for AI agents. We need to decide whether to implement server-side storage or keep everything client-side with local persistence.

## Decision
**We will implement a client-only architecture with browser local storage and export/import capabilities.**

## Rationale

### Why Client-Only is Optimal for BAIGEL

#### 1. Privacy and Security
- **No Data Leaves the Browser**: Conversations with AI agents remain completely private
- **No Server Attack Surface**: Eliminates server-side security concerns
- **User-Controlled Encryption**: Users can encrypt exports with their own keys
- **Compliance Simplified**: No GDPR/CCPA concerns as we don't store user data

#### 2. Architectural Simplicity
- **No Backend Required**: Just static files served from CDN
- **No Database Management**: No migrations, backups, or scaling concerns
- **No Authentication System**: No passwords, OAuth, or session management
- **Simplified Development**: Focus entirely on frontend features

#### 3. Cost and Scalability
- **Zero Infrastructure Costs**: Only static hosting needed (often free)
- **Infinite Scalability**: CDN handles any load
- **No API Rate Limits**: Direct agent connections from browser
- **No Bandwidth Costs**: Agent communication happens client-side

#### 4. User Experience Benefits
- **Instant Setup**: No account creation required
- **Offline Capability**: Works with local MCP servers without internet
- **Zero Latency**: No round-trips to backend for UI state
- **Full Data Ownership**: Users control their data completely

#### 5. Perfect Fit for Use Case
- **Stateless Protocol Gateway**: BAIGEL doesn't need server state
- **Agent State Lives Elsewhere**: Agents maintain their own state
- **Temporary Conversation Context**: Only needs to persist current session

## Implementation Strategy

### Local Storage Architecture

#### Storage Layers
```typescript
interface StorageArchitecture {
  // Browser Storage (5-10MB limit)
  localStorage: {
    settings: UserSettings;
    protocolConfigs: ProtocolConfig[];
    uiPreferences: UIPreferences;
  };
  
  // IndexedDB (50MB+ available)
  indexedDB: {
    conversations: Conversation[];
    messages: Message[];
    toolExecutions: ToolExecution[];
    agentProfiles: AgentProfile[];
  };
  
  // Session Storage (temporary)
  sessionStorage: {
    activeConnections: Connection[];
    streamingState: StreamingState;
  };
}
```

### Storage Service Implementation
```typescript
class BrowserStorageService {
  private db: IDBDatabase;
  
  async initialize() {
    // Initialize IndexedDB
    this.db = await this.openDatabase();
    
    // Migrate localStorage if needed
    await this.migrateLocalStorage();
    
    // Setup auto-save
    this.setupAutoSave();
  }
  
  // Conversations
  async saveConversation(conversation: Conversation) {
    const tx = this.db.transaction(['conversations'], 'readwrite');
    await tx.objectStore('conversations').put(conversation);
  }
  
  async getConversations(limit = 50): Promise<Conversation[]> {
    const tx = this.db.transaction(['conversations'], 'readonly');
    return tx.objectStore('conversations')
      .index('timestamp')
      .getAll(null, limit);
  }
  
  // Settings (localStorage for quick access)
  saveSettings(settings: UserSettings) {
    localStorage.setItem('baigel:settings', JSON.stringify(settings));
  }
  
  getSettings(): UserSettings {
    const stored = localStorage.getItem('baigel:settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  }
  
  // Storage management
  async getStorageUsage(): Promise<StorageEstimate> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return { usage: 0, quota: 0 };
  }
  
  async clearOldData(daysToKeep = 30) {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const tx = this.db.transaction(['conversations'], 'readwrite');
    const store = tx.objectStore('conversations');
    const index = store.index('timestamp');
    
    const range = IDBKeyRange.upperBound(cutoff);
    await index.openCursor(range).then(function deleteOld(cursor) {
      if (!cursor) return;
      cursor.delete();
      return cursor.continue().then(deleteOld);
    });
  }
}
```

### Export/Import System

#### Export Formats
```typescript
interface ExportFormat {
  version: '1.0';
  timestamp: string;
  metadata: {
    appVersion: string;
    exportedFrom: string;
    conversationCount: number;
    totalMessages: number;
  };
  data: {
    settings: UserSettings;
    protocolConfigs: ProtocolConfig[];
    conversations: Conversation[];
    agentProfiles: AgentProfile[];
  };
}

class DataExporter {
  async exportAll(): Promise<Blob> {
    const storage = new BrowserStorageService();
    
    const exportData: ExportFormat = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      metadata: {
        appVersion: APP_VERSION,
        exportedFrom: window.location.hostname,
        conversationCount: 0,
        totalMessages: 0
      },
      data: {
        settings: storage.getSettings(),
        protocolConfigs: await storage.getProtocolConfigs(),
        conversations: await storage.getConversations(),
        agentProfiles: await storage.getAgentProfiles()
      }
    };
    
    // Calculate metadata
    exportData.metadata.conversationCount = exportData.data.conversations.length;
    exportData.metadata.totalMessages = exportData.data.conversations
      .reduce((sum, conv) => sum + conv.messages.length, 0);
    
    // Create blob
    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }
  
  async exportAsEncrypted(password: string): Promise<Blob> {
    const data = await this.exportAll();
    const encrypted = await this.encrypt(data, password);
    return new Blob([encrypted], { type: 'application/octet-stream' });
  }
  
  downloadExport(blob: Blob, filename?: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `baigel-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

#### Import System
```typescript
class DataImporter {
  async importData(file: File): Promise<ImportResult> {
    const text = await file.text();
    const data: ExportFormat = JSON.parse(text);
    
    // Validate format
    if (data.version !== '1.0') {
      throw new Error(`Unsupported version: ${data.version}`);
    }
    
    // Import strategy options
    const strategy = await this.promptImportStrategy();
    
    const storage = new BrowserStorageService();
    
    switch (strategy) {
      case 'replace':
        await storage.clearAll();
        await this.importAllData(data.data);
        break;
        
      case 'merge':
        await this.mergeData(data.data);
        break;
        
      case 'selective':
        const selected = await this.promptSelectiveImport(data);
        await this.importSelectedData(selected);
        break;
    }
    
    return {
      success: true,
      imported: {
        conversations: data.metadata.conversationCount,
        messages: data.metadata.totalMessages
      }
    };
  }
  
  private async mergeData(importData: ExportData) {
    const storage = new BrowserStorageService();
    
    // Merge settings (prefer imported)
    const currentSettings = storage.getSettings();
    const mergedSettings = { ...currentSettings, ...importData.settings };
    storage.saveSettings(mergedSettings);
    
    // Merge conversations (avoid duplicates)
    for (const conversation of importData.conversations) {
      const exists = await storage.conversationExists(conversation.id);
      if (!exists) {
        await storage.saveConversation(conversation);
      }
    }
  }
}
```

### Sync Between Tabs/Windows

```typescript
class CrossTabSync {
  private channel: BroadcastChannel;
  
  constructor() {
    this.channel = new BroadcastChannel('baigel-sync');
    this.setupListeners();
  }
  
  private setupListeners() {
    // Listen for changes from other tabs
    this.channel.addEventListener('message', (event) => {
      switch (event.data.type) {
        case 'settings-updated':
          this.handleSettingsUpdate(event.data.settings);
          break;
          
        case 'conversation-added':
          this.handleNewConversation(event.data.conversation);
          break;
          
        case 'protocol-connected':
          this.handleProtocolConnection(event.data.protocol);
          break;
      }
    });
    
    // Sync on storage events (fallback for older browsers)
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('baigel:')) {
        this.handleStorageChange(event);
      }
    });
  }
  
  broadcast(type: string, data: any) {
    this.channel.postMessage({ type, data, timestamp: Date.now() });
  }
}
```

### Progressive Web App (PWA) Support

```typescript
// Enable offline access and installability
const PWAConfig = {
  manifest: {
    name: 'BAIGEL - Universal Agent Interface',
    short_name: 'BAIGEL',
    description: 'Protocol-agnostic frontend for AI agents',
    start_url: '/',
    display: 'standalone',
    theme_color: '#000000',
    background_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  
  serviceWorker: {
    // Cache all static assets
    staticAssets: [
      '/',
      '/chat',
      '/settings',
      '/static/js/bundle.js',
      '/static/css/app.css'
    ],
    
    // Runtime caching strategies
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: { cacheName: 'api-cache' }
      }
    ]
  }
};
```

### Desktop App Distribution

```typescript
// Electron/Tauri wrapper for desktop
const DesktopConfig = {
  // Tauri advantages for BAIGEL:
  // - Smaller bundle size (no Chromium)
  // - Better STDIO access for local MCP
  // - Native OS integration
  
  tauri: {
    // Enable local MCP server spawning
    allowlist: {
      shell: {
        all: false,
        execute: true,
        sidecar: true,
        scope: [
          { name: 'mcp-server', sidecar: true }
        ]
      },
      fs: {
        all: false,
        readFile: true,
        writeFile: true,
        scope: ['$APP', '$DOWNLOAD']
      }
    }
  }
};
```

## Storage Limits and Strategies

### Browser Storage Limits
- **localStorage**: 5-10MB (varies by browser)
- **sessionStorage**: 5-10MB (temporary)
- **IndexedDB**: 
  - Chrome: Up to 60% of disk space
  - Firefox: Up to 50% of free disk space
  - Safari: Up to 1GB initially, can request more

### Storage Management Strategy
```typescript
class StorageManager {
  // Auto-cleanup old conversations
  async manageStorage() {
    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage! / estimate.quota!) * 100;
    
    if (usagePercent > 80) {
      // Delete old conversations
      await this.deleteOldConversations(60); // 60 days
    }
    
    if (usagePercent > 90) {
      // More aggressive cleanup
      await this.deleteOldConversations(30); // 30 days
      await this.compressMessages();
    }
    
    if (usagePercent > 95) {
      // Prompt user to export and clean
      this.promptUserToExport();
    }
  }
  
  // Request persistent storage
  async requestPersistence() {
    if ('persist' in navigator.storage) {
      const granted = await navigator.storage.persist();
      return granted;
    }
    return false;
  }
}
```

## Migration Path

### From Server-Based to Client-Only
1. Users export data from server
2. Import into local browser storage
3. No account needed going forward

### Between Devices
1. Export from Device A
2. Transfer file (cloud drive, USB, email)
3. Import on Device B
4. Optional: Use browser sync (Chrome/Firefox) for settings

## Benefits Summary

### For Users
- ✅ Complete privacy
- ✅ No accounts required
- ✅ Instant start
- ✅ Works offline
- ✅ Full data ownership

### For Development
- ✅ Simplified architecture
- ✅ No backend maintenance
- ✅ Faster development
- ✅ Lower complexity
- ✅ Easier testing

### For Deployment
- ✅ Static hosting only
- ✅ CDN distribution
- ✅ Zero infrastructure cost
- ✅ Infinite scalability
- ✅ Multiple distribution options (web, PWA, desktop)

## Risks and Mitigations

### Risk: Data Loss
- **Mitigation**: Auto-export reminders, persistent storage API, regular backups

### Risk: Storage Limits
- **Mitigation**: Automatic cleanup, compression, export prompts

### Risk: Cross-Device Sync
- **Mitigation**: Easy export/import, optional cloud sync services

### Risk: User Confusion
- **Mitigation**: Clear UI about local storage, prominent export button

## Alternatives Considered

### Server-Side Storage
- **Pros**: Automatic sync, no storage limits
- **Cons**: Privacy concerns, infrastructure costs, complexity
- **Decision**: Rejected - unnecessary for BAIGEL's use case

### Hybrid Approach
- **Pros**: Optional server sync
- **Cons**: Complex architecture, auth system needed
- **Decision**: Rejected - can add later if needed

### Cloud Storage Integration
- **Pros**: Automatic backup
- **Cons**: Privacy concerns, API complexity
- **Decision**: Deferred - users can manually use cloud drives

## Implementation Priority

1. **Phase 1**: Local storage with IndexedDB
2. **Phase 2**: Export/import functionality
3. **Phase 3**: PWA support
4. **Phase 4**: Desktop app (Tauri)
5. **Phase 5**: Advanced features (encryption, compression)

## References
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Tauri Documentation](https://tauri.app/)

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Review Date:** 2025-09-20
- **Status:** Approved