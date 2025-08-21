'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding'
import { OnboardingPage } from '@/components/onboarding/OnboardingPage'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { userStatus, checkUserStatus } = useOnboardingStore()

  useEffect(() => {
    checkUserStatus()
  }, [checkUserStatus])

  // Redirect returning users directly to chat
  useEffect(() => {
    if (userStatus === 'returning') {
      router.push('/chat')
    }
  }, [userStatus, router])

  // Show loading state while checking
  if (userStatus === 'checking') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking your preferences...</p>
        </div>
      </main>
    )
  }

  // Show redirect message for returning users
  if (userStatus === 'returning') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Welcome back! Redirecting to chat...</p>
        </div>
      </main>
    )
  }

  // Show onboarding for new users (or when storage is restricted)
  return <OnboardingPage />
}