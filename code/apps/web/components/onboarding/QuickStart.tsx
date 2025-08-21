'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button, Checkbox, Card, CardContent } from '@/components/ui'
import { useOnboardingStore, useIsStorageRestricted } from '@/lib/stores/onboarding'
import { cn } from '@/lib/utils'

export function QuickStart() {
  const router = useRouter()
  const { acknowledgePrivacy, error } = useOnboardingStore()
  const isStorageRestricted = useIsStorageRestricted()
  const [agreed, setAgreed] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    if (!agreed && !isStorageRestricted) return

    setIsStarting(true)
    
    // Attempt to save acknowledgment
    const success = await acknowledgePrivacy()
    
    // Navigate to chat regardless of save success
    // User can still use the app even if storage fails
    setTimeout(() => {
      router.push('/chat')
    }, 300) // Small delay for better UX
  }

  return (
    <section className="max-w-2xl mx-auto">
      <Card className="border-2">
        <CardContent className="pt-8 pb-6 px-6 md:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Ready to Start?</h3>
            <p className="text-muted-foreground">
              Use our hosted version with zero tracking, or self-host for complete control.
            </p>
          </div>

          {!isStorageRestricted && (
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="acknowledge"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="acknowledge"
                className="text-sm leading-relaxed cursor-pointer select-none"
              >
                I understand my data stays in my browser and won&apos;t be backed up to any servers. 
                I can export my data anytime if I want to save it elsewhere.
              </label>
            </div>
          )}

          {isStorageRestricted && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Note:</strong> Storage is restricted in your browser. 
                You can still use BAIGEL, but your data won&apos;t persist between sessions.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleStart}
                disabled={(!agreed && !isStorageRestricted) || isStarting}
                className={cn(
                  "min-w-[200px] transition-all",
                  agreed && "shadow-lg shadow-primary/25"
                )}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Using BAIGEL
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('https://github.com/jwynia/baigel', '_blank')}
              >
                View Source Code
              </Button>
            </div>
            
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://github.com/jwynia/baigel#self-hosting', '_blank')}
                className="text-muted-foreground hover:text-primary"
              >
                Learn about self-hosting →
              </Button>
            </div>
          </div>

          {(!agreed && !isStorageRestricted) && (
            <p className="text-xs text-center text-muted-foreground">
              Please check the box above to continue
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}