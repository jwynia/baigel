'use client'

import { useState } from 'react'
import { Cloud, HardDrive, ChevronDown, ChevronUp, X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
// Removed unused cn import

export function PrivacyMessage() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      {/* Main Message */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-8 pb-6 px-6 md:px-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Nothing Gets Stored on Our Servers
          </h2>
          
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            Seeing this message means <span className="font-semibold text-foreground">we truly don&apos;t know who you are</span>. 
            Your conversations, settings, and connections stay on your device. 
            You own your data. Export it anytime. Delete it anytime. 
            Or <span className="font-semibold text-foreground">self-host it</span> for complete control.
          </p>

          {/* Visual Comparison */}
          <div className="grid grid-cols-2 gap-4 md:gap-8 pt-4">
            {/* Your Browser */}
            <div className="text-center space-y-3">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <div className="relative bg-green-500/10 p-4 rounded-full">
                  <HardDrive className="h-8 w-8 md:h-10 md:w-10 text-green-500" />
                </div>
              </div>
              <div>
                <p className="font-semibold flex items-center justify-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Your Browser
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All data stays here
                </p>
              </div>
            </div>

            {/* Not on Servers */}
            <div className="text-center space-y-3">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <div className="relative bg-red-500/10 p-4 rounded-full">
                  <Cloud className="h-8 w-8 md:h-10 md:w-10 text-red-500" />
                </div>
              </div>
              <div>
                <p className="font-semibold flex items-center justify-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  Our Servers
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  No data sent here
                </p>
              </div>
            </div>
          </div>

          {/* Learn More Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mx-auto flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {showDetails ? 'Show Less' : 'Learn More About Local Storage'}
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardContent>
      </Card>

      {/* Detailed Explanation */}
      {showDetails && (
        <Card className="animate-in slide-in-from-top-2 duration-300">
          <CardContent className="pt-6 pb-6 px-6 md:px-8 space-y-4">
            <h3 className="font-semibold text-lg">How Local Storage Works</h3>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Browser Storage:</strong> Your conversations and settings are saved in your browser&apos;s local storage, 
                similar to how websites remember your preferences. This data never leaves your device unless you explicitly export it.
              </p>
              
              <p>
                <strong className="text-foreground">No Cloud Sync:</strong> Unlike most apps, we don&apos;t sync your data across devices. 
                Each browser on each device has its own separate data. This means maximum privacy but no automatic backup.
              </p>
              
              <p>
                <strong className="text-foreground">You&apos;re in Control:</strong> You can export your data to a file anytime for backup or to move to another device. 
                You can also clear all data instantly from your browser settings. Want even more control? Self-host BAIGEL on your own infrastructure.
              </p>
              
              <p>
                <strong className="text-foreground">Storage Limits:</strong> Browsers typically allow 5-10MB for basic storage and much more for advanced storage. 
                BAIGEL will manage this automatically and prompt you if you&apos;re running low.
              </p>
              
              <p>
                <strong className="text-foreground">Self-Hosting Option:</strong> Want to run BAIGEL on your own servers? 
                The entire application is open source and can be deployed on your infrastructure. This gives you complete control over 
                the code, data, and deployment environment. Perfect for organizations with strict compliance requirements or individuals 
                who prefer maximum control.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}