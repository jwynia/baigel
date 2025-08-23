import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExportData {
  version: string;
  timestamp: string;
  connections: any[];
  agents: any[];
  preferences: any;
  onboardingCompleted: boolean;
}

interface SettingsStore {
  // Export/Import
  exportConfiguration: () => ExportData;
  importConfiguration: (data: ExportData) => Promise<void>;
  validateImportData: (data: any) => { valid: boolean; errors: string[] };
  
  // Clear/Reset
  clearAllSettings: () => Promise<void>;
  clearConnectionData: () => void;
  clearAgentData: () => void;
  clearPreferences: () => void;
  
  // Backup
  lastExportTime: string | null;
  setLastExportTime: (time: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      lastExportTime: null,
      
      exportConfiguration: () => {
        // Gather all data from localStorage
        const connections = JSON.parse(localStorage.getItem('connections-store') || '{}');
        const agents = JSON.parse(localStorage.getItem('agents-store') || '{}');
        const preferences = JSON.parse(localStorage.getItem('preferences-store') || '{}');
        const onboarding = JSON.parse(localStorage.getItem('onboarding-store') || '{}');
        
        const exportData: ExportData = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          connections: connections.state?.connections || [],
          agents: agents.state?.agents || [],
          preferences: preferences.state || {},
          onboardingCompleted: onboarding.state?.hasCompletedOnboarding || false,
        };
        
        set({ lastExportTime: exportData.timestamp });
        return exportData;
      },
      
      importConfiguration: async (data: ExportData) => {
        try {
          // Validate data first
          const validation = get().validateImportData(data);
          if (!validation.valid) {
            throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
          }
          
          // Import connections
          if (data.connections) {
            const connectionsStore = JSON.parse(localStorage.getItem('connections-store') || '{}');
            connectionsStore.state = { ...connectionsStore.state, connections: data.connections };
            localStorage.setItem('connections-store', JSON.stringify(connectionsStore));
          }
          
          // Import agents
          if (data.agents) {
            const agentsStore = JSON.parse(localStorage.getItem('agents-store') || '{}');
            agentsStore.state = { ...agentsStore.state, agents: data.agents };
            localStorage.setItem('agents-store', JSON.stringify(agentsStore));
          }
          
          // Import preferences
          if (data.preferences) {
            const preferencesStore = JSON.parse(localStorage.getItem('preferences-store') || '{}');
            preferencesStore.state = { ...preferencesStore.state, ...data.preferences };
            localStorage.setItem('preferences-store', JSON.stringify(preferencesStore));
          }
          
          // Import onboarding status
          if (data.onboardingCompleted !== undefined) {
            const onboardingStore = JSON.parse(localStorage.getItem('onboarding-store') || '{}');
            onboardingStore.state = { ...onboardingStore.state, hasCompletedOnboarding: data.onboardingCompleted };
            localStorage.setItem('onboarding-store', JSON.stringify(onboardingStore));
          }
          
          // Reload to apply changes
          window.location.reload();
        } catch (error) {
          console.error('Import failed:', error);
          throw error;
        }
      },
      
      validateImportData: (data: any) => {
        const errors: string[] = [];
        
        if (!data || typeof data !== 'object') {
          errors.push('Invalid data format');
          return { valid: false, errors };
        }
        
        if (!data.version) {
          errors.push('Missing version field');
        }
        
        if (!data.timestamp) {
          errors.push('Missing timestamp field');
        }
        
        if (data.connections && !Array.isArray(data.connections)) {
          errors.push('Connections must be an array');
        }
        
        if (data.agents && !Array.isArray(data.agents)) {
          errors.push('Agents must be an array');
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      },
      
      clearAllSettings: async () => {
        try {
          console.log('Starting full reset of application data...');
          
          // Clear ALL localStorage - for a true reset
          // This is what the user expects when clicking reset
          localStorage.clear();
          console.log('Cleared all localStorage');
          
          // Clear all session storage
          sessionStorage.clear();
          console.log('Cleared all sessionStorage');
          
          // Clear all cookies for this domain (if any)
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          console.log('Cleared all cookies');
          
          // Clear IndexedDB databases if any
          if ('indexedDB' in window) {
            try {
              const databases = await indexedDB.databases();
              for (const db of databases) {
                if (db.name) {
                  indexedDB.deleteDatabase(db.name);
                  console.log('Deleted IndexedDB:', db.name);
                }
              }
            } catch (e) {
              // Some browsers don't support databases() method
              console.log('Could not enumerate IndexedDB databases');
            }
          }
          
          // Small delay to ensure storage operations complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Use replace to prevent back button from restoring state
          // and reload with cache bypass to ensure fresh start
          window.location.replace('/');
          
          // Force hard reload to bypass any service workers or caches
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
        } catch (error) {
          console.error('Error clearing settings:', error);
          // Even if there's an error, try to navigate home
          window.location.href = '/';
        }
      },
      
      clearConnectionData: () => {
        localStorage.removeItem('connections-store');
        window.location.reload();
      },
      
      clearAgentData: () => {
        localStorage.removeItem('agents-store');
        window.location.reload();
      },
      
      clearPreferences: () => {
        localStorage.removeItem('preferences-store');
        localStorage.removeItem('theme');
        window.location.reload();
      },
      
      setLastExportTime: (time: string) => set({ lastExportTime: time }),
    }),
    {
      name: 'settings-store',
    }
  )
)