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
    'baigel:onboarding',      // Onboarding state
    'baigel:settings',        // User settings
    'connection-storage',     // Saved connections
    'chat-store'             // Chat history
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

    // Check for any BAIGEL keys in localStorage
    for (const key of this.STORAGE_KEYS) {
      if (localStorage.getItem(key) !== null) {
        return true
      }
    }

    // Also check for any keys starting with 'baigel:'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('baigel:')) {
        return true
      }
    }

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