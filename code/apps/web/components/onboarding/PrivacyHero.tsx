'use client'

import { Shield, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PrivacyHero() {
  return (
    <section className="text-center space-y-6 py-8 md:py-12">
      {/* Icon */}
      <div className="relative inline-flex">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-full">
          <Shield className="h-16 w-16 md:h-20 md:w-20 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Main Heading */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Your AI Conversations
          <span className="block text-primary mt-2">Stay With You</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Everything happens in your browser. No servers, no accounts, no tracking.
        </p>
      </div>

      {/* Visual Indicators */}
      <div className="flex items-center justify-center gap-4 md:gap-8 pt-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm md:text-base">
          <Lock className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">100% Private</span>
        </div>
        <div className="flex items-center gap-2 text-sm md:text-base">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-muted-foreground">Local Only</span>
        </div>
        <div className="flex items-center gap-2 text-sm md:text-base">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">Self-Hostable</span>
        </div>
      </div>
    </section>
  )
}