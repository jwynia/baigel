import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DiscoveryEndpoint {
  url: string;
  description: string;
  addedAt: string;
  lastUsed?: string;
  successCount: number;
}

export interface DiscoveryPreferences {
  // Auto-discovery settings
  enableLocalhostDiscovery: boolean;
  enableAutoSave: boolean;

  // User-saved discovery endpoints
  savedEndpoints: DiscoveryEndpoint[];

  // Disabled default endpoints (user explicitly disabled)
  disabledDefaults: string[];

  // Discovery history for analytics/debugging
  discoveryHistory: Array<{
    url: string;
    timestamp: string;
    success: boolean;
    protocol?: string;
  }>;
}

interface DiscoveryPreferencesStore extends DiscoveryPreferences {
  // Settings actions
  setLocalhostDiscovery: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;

  // Endpoint management
  addSavedEndpoint: (url: string, description?: string) => void;
  removeSavedEndpoint: (url: string) => void;
  updateEndpointSuccess: (url: string) => void;

  // Default endpoint management
  disableDefaultEndpoint: (url: string) => void;
  enableDefaultEndpoint: (url: string) => void;
  isDefaultDisabled: (url: string) => boolean;

  // Combined discovery URLs
  getDiscoveryUrls: () => Array<{ url: string; description: string; source: 'default' | 'user' }>;
  getDefaultDiscoveryUrls: () => Array<{ url: string; description: string }>;

  // History tracking
  recordDiscovery: (url: string, success: boolean, protocol?: string) => void;
  clearHistory: () => void;

  // Utilities
  reset: () => void;
}

const DEFAULT_DISCOVERY_URLS = [
  { url: 'http://localhost:3001', description: 'Local MCP Server' },
  { url: 'http://localhost:11434', description: 'Local Ollama Server' },
  { url: 'http://localhost:4111', description: 'Local Mastra Instance' },
  { url: 'http://localhost:8080', description: 'Common Workflow Port' },
] as const;

export const useDiscoveryPreferencesStore = create<DiscoveryPreferencesStore>()(
  persist(
    (set, get) => ({
      // Default settings
      enableLocalhostDiscovery: true,
      enableAutoSave: true,
      savedEndpoints: [],
      disabledDefaults: [],
      discoveryHistory: [],

      // Settings actions
      setLocalhostDiscovery: (enabled: boolean) =>
        set({ enableLocalhostDiscovery: enabled }),

      setAutoSave: (enabled: boolean) =>
        set({ enableAutoSave: enabled }),

      // Endpoint management
      addSavedEndpoint: (url: string, description?: string) => {
        const endpoints = get().savedEndpoints;
        const existing = endpoints.find(e => e.url === url);

        if (!existing) {
          const newEndpoint: DiscoveryEndpoint = {
            url,
            description: description || `Custom endpoint`,
            addedAt: new Date().toISOString(),
            successCount: 0,
          };

          set({
            savedEndpoints: [...endpoints, newEndpoint]
          });
        }
      },

      removeSavedEndpoint: (url: string) => {
        const endpoints = get().savedEndpoints.filter(e => e.url !== url);
        set({ savedEndpoints: endpoints });
      },

      updateEndpointSuccess: (url: string) => {
        const endpoints = get().savedEndpoints.map(endpoint =>
          endpoint.url === url
            ? {
                ...endpoint,
                lastUsed: new Date().toISOString(),
                successCount: endpoint.successCount + 1
              }
            : endpoint
        );
        set({ savedEndpoints: endpoints });
      },

      // Default endpoint management
      disableDefaultEndpoint: (url: string) => {
        const disabled = get().disabledDefaults;
        if (!disabled.includes(url)) {
          set({ disabledDefaults: [...disabled, url] });
        }
      },

      enableDefaultEndpoint: (url: string) => {
        const disabled = get().disabledDefaults.filter(u => u !== url);
        set({ disabledDefaults: disabled });
      },

      isDefaultDisabled: (url: string) => {
        return get().disabledDefaults.includes(url);
      },

      // Combined discovery URLs
      getDefaultDiscoveryUrls: () => {
        const { enableLocalhostDiscovery, disabledDefaults } = get();

        if (!enableLocalhostDiscovery) {
          return [];
        }

        return DEFAULT_DISCOVERY_URLS.filter(
          endpoint => !disabledDefaults.includes(endpoint.url)
        );
      },

      getDiscoveryUrls: () => {
        const { savedEndpoints } = get();
        const defaultUrls = get().getDefaultDiscoveryUrls();

        const urls = [
          ...defaultUrls.map(url => ({ ...url, source: 'default' as const })),
          ...savedEndpoints.map(endpoint => ({
            url: endpoint.url,
            description: endpoint.description,
            source: 'user' as const
          }))
        ];

        // Remove duplicates, preferring user-saved over defaults
        const uniqueUrls = new Map();
        urls.forEach(url => {
          const existing = uniqueUrls.get(url.url);
          if (!existing || url.source === 'user') {
            uniqueUrls.set(url.url, url);
          }
        });

        return Array.from(uniqueUrls.values());
      },

      // History tracking
      recordDiscovery: (url: string, success: boolean, protocol?: string) => {
        const history = get().discoveryHistory;
        const newEntry = {
          url,
          timestamp: new Date().toISOString(),
          success,
          protocol,
        };

        // Keep last 100 entries
        const updatedHistory = [newEntry, ...history].slice(0, 100);
        set({ discoveryHistory: updatedHistory });

        // Auto-save successful endpoints if enabled
        if (success && get().enableAutoSave) {
          const isDefault = DEFAULT_DISCOVERY_URLS.some(d => d.url === url);
          const isAlreadySaved = get().savedEndpoints.some(e => e.url === url);

          if (!isDefault && !isAlreadySaved) {
            get().addSavedEndpoint(url, `Auto-discovered ${protocol || 'service'}`);
          }

          // Update success count for saved endpoints
          get().updateEndpointSuccess(url);
        }
      },

      clearHistory: () => set({ discoveryHistory: [] }),

      // Utilities
      reset: () => set({
        enableLocalhostDiscovery: true,
        enableAutoSave: true,
        savedEndpoints: [],
        disabledDefaults: [],
        discoveryHistory: [],
      }),
    }),
    {
      name: 'discovery-preferences-store',
      version: 1,
    }
  )
)

// Convenience hooks
export const useDiscoveryUrls = () => {
  const store = useDiscoveryPreferencesStore();
  return store.getDiscoveryUrls();
}

export const useDiscoverySettings = () => {
  const store = useDiscoveryPreferencesStore();
  return {
    enableLocalhostDiscovery: store.enableLocalhostDiscovery,
    enableAutoSave: store.enableAutoSave,
    setLocalhostDiscovery: store.setLocalhostDiscovery,
    setAutoSave: store.setAutoSave,
  };
}