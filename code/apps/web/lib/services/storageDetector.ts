/**
 * StorageDetector Service
 * Detects if a user is new or returning based on browser storage
 */

export type UserStatus = 'new' | 'returning' | 'checking' | 'restricted'

export interface StorageInfo {
  localStorage: boolean
  indexedDB: boolean
  sessionStorage: boolean
  quotaAvailable?: number
  error?: string
}

export class StorageDetector {
  // Keys that indicate a returning user
  private readonly STORAGE_KEYS = [
    'baigel:acknowledged',    // User has seen onboarding
    'baigel:onboarding',      // Onboarding state (Zustand persist)
    'baigel:settings',        // User settings
    'connection-storage',     // Saved connections (Zustand persist)
    'chat-store',            // Chat history
    'baigel_workflow_services' // Workflow discovery cache
  ]

  /**
   * Check if localStorage is available and working
   */
  private canUseLocalStorage(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if IndexedDB is available
   */
  private async canUseIndexedDB(): Promise<boolean> {
    if (!('indexedDB' in window)) {
      return false
    }

    try {
      const testDB = await new Promise<boolean>((resolve) => {
        const request = indexedDB.open('__test_db__', 1)
        request.onsuccess = () => {
          request.result.close()
          indexedDB.deleteDatabase('__test_db__')
          resolve(true)
        }
        request.onerror = () => resolve(false)
        request.onblocked = () => resolve(false)
      })
      return testDB
    } catch {
      return false
    }
  }

  /**
   * Check if user has any BAIGEL data stored
   */
  private hasStoredData(): boolean {
    if (!this.canUseLocalStorage()) {
      return false
    }

    console.log('[StorageDetector] Checking for stored data...');

    // Check for any BAIGEL keys in localStorage with actual content
    for (const key of this.STORAGE_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        console.log(`[StorageDetector] Found key: ${key}, value:`, value.substring(0, 100));
        // Check if the value has meaningful content
        try {
          const parsed = JSON.parse(value);
          
          // For Zustand stores, check if they have actual data
          if (parsed && typeof parsed === 'object') {
            // Check if it's a Zustand persist store
            if ('state' in parsed && parsed.state) {
              const state = parsed.state;
              
              // For connections store - check for actual connections
              if (state.connections !== undefined) {
                if (Array.isArray(state.connections) && state.connections.length > 0) {
                  return true;
                }
                // Empty connections array - not a returning user
                continue;
              }
              
              // For onboarding store - check if user actually acknowledged
              if (state.hasAcknowledged !== undefined) {
                console.log(`[StorageDetector] Found hasAcknowledged: ${state.hasAcknowledged}`);
                if (state.hasAcknowledged === true) {
                  console.log('[StorageDetector] User has acknowledged - returning user');
                  return true;
                }
                // hasAcknowledged is false - not a returning user
                console.log('[StorageDetector] hasAcknowledged is false - new user');
                continue;
              }
              
              // For other stores with meaningful data
              const hasContent = Object.keys(state).some(key => {
                const value = state[key];
                if (value === null || value === undefined || value === false || value === '') {
                  return false;
                }
                if (Array.isArray(value) && value.length === 0) {
                  return false;
                }
                if (typeof value === 'object' && Object.keys(value).length === 0) {
                  return false;
                }
                return true;
              });
              
              if (hasContent) {
                return true;
              }
              
              // Skip Zustand stores with only default/empty values
              continue;
            }
            // For non-Zustand objects, check if they have content
            if (Object.keys(parsed).length > 0) {
              return true;
            }
          }
        } catch {
          // If it's not JSON, check if it's a non-empty string
          if (value && value.trim().length > 0) {
            return true;
          }
        }
      }
    }

    console.log('[StorageDetector] No meaningful data found - new user');
    return false
  }

  /**
   * Get storage availability information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    const info: StorageInfo = {
      localStorage: false,
      indexedDB: false,
      sessionStorage: false
    }

    // Check localStorage
    info.localStorage = this.canUseLocalStorage()

    // Check sessionStorage
    try {
      const test = '__test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      info.sessionStorage = true
    } catch {
      info.sessionStorage = false
    }

    // Check IndexedDB
    info.indexedDB = await this.canUseIndexedDB()

    // Check storage quota if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        if (estimate.quota && estimate.usage !== undefined) {
          info.quotaAvailable = estimate.quota - estimate.usage
        }
      } catch (e) {
        console.warn('Could not estimate storage quota:', e)
      }
    }

    return info
  }

  /**
   * Determine if this is a new or returning user
   */
  async getUserStatus(): Promise<UserStatus> {
    try {
      // First check if storage is available at all
      const storageInfo = await this.getStorageInfo()
      
      if (!storageInfo.localStorage && !storageInfo.indexedDB) {
        // Storage is restricted/unavailable
        return 'restricted'
      }

      // Check for existing user data
      if (this.hasStoredData()) {
        return 'returning'
      }

      // Check if there's data in IndexedDB (for thorough checking)
      if (storageInfo.indexedDB) {
        const hasIndexedData = await this.checkIndexedDBData()
        if (hasIndexedData) {
          return 'returning'
        }
      }

      // No data found, user is new
      return 'new'
    } catch (error) {
      console.error('Error detecting user status:', error)
      // On error, assume new user to show onboarding
      return 'new'
    }
  }

  /**
   * Check if there's any data in IndexedDB
   */
  private async checkIndexedDBData(): Promise<boolean> {
    if (!('indexedDB' in window)) {
      return false
    }

    try {
      // Check for common BAIGEL databases
      const databases = await indexedDB.databases?.() || []
      
      for (const db of databases) {
        if (db.name?.includes('baigel') || db.name?.includes('chat')) {
          return true
        }
      }

      // Fallback: try to open known databases
      const knownDBs = ['baigel-db', 'chat-db', 'baigel-storage']
      
      for (const dbName of knownDBs) {
        try {
          const request = indexedDB.open(dbName)
          await new Promise((resolve, reject) => {
            request.onsuccess = () => {
              const db = request.result
              const hasData = db.objectStoreNames.length > 0
              db.close()
              resolve(hasData)
            }
            request.onerror = () => reject(false)
            request.onupgradeneeded = () => {
              // Database doesn't exist
              request.transaction?.abort()
              reject(false)
            }
          })
          return true
        } catch {
          // Database doesn't exist or can't be opened
          continue
        }
      }
    } catch (error) {
      console.warn('Could not check IndexedDB:', error)
    }

    return false
  }

  /**
   * Save acknowledgment that user has seen onboarding
   */
  saveAcknowledgment(): boolean {
    try {
      const acknowledgment = {
        acknowledged: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      
      localStorage.setItem('baigel:acknowledged', JSON.stringify(acknowledgment))
      return true
    } catch (error) {
      console.error('Could not save acknowledgment:', error)
      return false
    }
  }

  /**
   * Clear acknowledgment (useful for testing)
   */
  clearAcknowledgment(): void {
    try {
      localStorage.removeItem('baigel:acknowledged')
    } catch (error) {
      console.error('Could not clear acknowledgment:', error)
    }
  }

  /**
   * Check if user has previously acknowledged
   */
  hasAcknowledged(): boolean {
    try {
      const ack = localStorage.getItem('baigel:acknowledged')
      if (!ack) return false
      
      const parsed = JSON.parse(ack)
      return parsed.acknowledged === true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const storageDetector = new StorageDetector()