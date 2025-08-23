'use client'

import { DynamicInterface } from './DynamicInterface'

export function ChatInterface() {
  return (
    <div 
      className="flex flex-col h-full bg-background"
      role="application"
      aria-label="AI Chat Interface"
    >
      <DynamicInterface />
    </div>
  )
}