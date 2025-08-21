import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { storageDetector, type UserStatus, type StorageInfo } from '@/lib/services/storageDetector'

interface OnboardingState {
  // State
  userStatus: UserStatus
  hasAcknowledged: boolean
  storageAvailable: boolean
  storageInfo: StorageInfo | null
  showDetails: boolean
  error: string | null
  
  // Actions
  checkUserStatus: () => Promise<void>
  acknowledgePrivacy: () => Promise<boolean>
  toggleDetails: () => void
  skipOnboarding: () => void
  resetOnboarding: () => void
  setError: (error: string | null) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userStatus: 'checking',
        hasAcknowledged: false,
        storageAvailable: true,
        storageInfo: null,
        showDetails: false,
        error: null,

        // Check if user is new or returning
        checkUserStatus: async () => {
          try {
            // Get storage info first
            const storageInfo = await storageDetector.getStorageInfo()
            const storageAvailable = storageInfo.localStorage || storageInfo.indexedDB
            
            // Get user status
            const status = await storageDetector.getUserStatus()
            
            // Check if user has acknowledged
            const hasAcknowledged = storageDetector.hasAcknowledged()
            
            set({
              userStatus: status,
              hasAcknowledged,
              storageAvailable,
              storageInfo,
              error: null
            })
          } catch (error) {
            console.error('Error checking user status:', error)
            set({
              userStatus: 'new',
              error: 'Could not determine user status',
              storageAvailable: false
            })
          }
        },

        // Save user acknowledgment and proceed
        acknowledgePrivacy: async () => {
          try {
            // Save acknowledgment to localStorage
            const saved = storageDetector.saveAcknowledgment()
            
            if (saved) {
              set({
                hasAcknowledged: true,
                userStatus: 'returning',
                error: null
              })
              
              // Initialize default settings if needed
              if (!localStorage.getItem('baigel:settings')) {
                const defaultSettings = {
                  theme: 'system',
                  initialized: true,
                  initializedAt: new Date().toISOString()
                }
                localStorage.setItem('baigel:settings', JSON.stringify(defaultSettings))
              }
              
              return true
            } else {
              // Storage failed but we can still proceed
              set({
                hasAcknowledged: true,
                error: 'Could not save preferences, but you can still use the app'
              })
              return true
            }
          } catch (error) {
            console.error('Error acknowledging privacy:', error)
            set({
              error: 'An error occurred. You can still proceed to use the app.'
            })
            // Let user proceed even if saving fails
            return true
          }
        },

        // Toggle detailed explanation
        toggleDetails: () => {
          set((state) => ({
            showDetails: !state.showDetails
          }))
        },

        // Skip onboarding (for returning users or errors)
        skipOnboarding: () => {
          set({
            userStatus: 'returning',
            hasAcknowledged: true
          })
        },

        // Reset onboarding (useful for testing)
        resetOnboarding: () => {
          try {
            // Clear acknowledgment from storage
            storageDetector.clearAcknowledgment()
            
            // Reset state
            set({
              userStatus: 'new',
              hasAcknowledged: false,
              showDetails: false,
              error: null
            })
          } catch (error) {
            console.error('Error resetting onboarding:', error)
            set({
              error: 'Could not reset onboarding'
            })
          }
        },

        // Set error message
        setError: (error) => {
          set({ error })
        }
      }),
      {
        name: 'baigel:onboarding',
        // Only persist certain fields
        partialize: (state) => ({
          hasAcknowledged: state.hasAcknowledged,
          showDetails: state.showDetails
        })
      }
    ),
    {
      name: 'onboarding-store'
    }
  )
)

// Helper hook to check if onboarding should be shown
export const useShouldShowOnboarding = () => {
  const { userStatus, hasAcknowledged } = useOnboardingStore()
  return userStatus === 'new' && !hasAcknowledged
}

// Helper hook to check if storage is restricted
export const useIsStorageRestricted = () => {
  const { userStatus, storageAvailable } = useOnboardingStore()
  return userStatus === 'restricted' || !storageAvailable
}