'use client'

import { PrivacyHero } from './PrivacyHero'
import { PrivacyMessage } from './PrivacyMessage'
import { QuickStart } from './QuickStart'
import { FeatureHighlights } from './FeatureHighlights'
import { useOnboardingStore, useIsStorageRestricted } from '@/lib/stores/onboarding'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function OnboardingPage() {
  const { error } = useOnboardingStore()
  const isStorageRestricted = useIsStorageRestricted()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-16 space-y-12">
        {/* Storage Warning */}
        {isStorageRestricted && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Storage Access Limited</AlertTitle>
            <AlertDescription>
              Your browser is blocking local storage (perhaps you&apos;re in private browsing mode). 
              BAIGEL needs local storage to save your preferences and conversations. 
              You can still use the app, but your data won&apos;t be saved between sessions.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !isStorageRestricted && (
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <PrivacyHero />

        {/* Privacy Message */}
        <PrivacyMessage />

        {/* Quick Start */}
        <QuickStart />

        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Footer */}
        <footer className="text-center pt-8 pb-4">
          <p className="text-sm text-muted-foreground">
            Named after the &ldquo;everything bagel&rdquo; from &ldquo;Everything Everywhere All at Once&rdquo;
          </p>
        </footer>
      </div>
    </main>
  )
}