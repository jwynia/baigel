'use client'

import { Zap, Server, Download, Shield, Home, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

const features = [
  {
    icon: Zap,
    title: 'Protocol Agnostic',
    description: 'Connect to MCP, OpenAI, A2A, AG-UI, and more - all from one interface'
  },
  {
    icon: Server,
    title: 'Self-Hostable',
    description: 'Deploy on your own infrastructure for complete control and privacy'
  },
  {
    icon: Download,
    title: 'Export Anytime',
    description: 'Download all your data as a file to backup or move to another device'
  },
  {
    icon: Shield,
    title: 'Zero Trust Required',
    description: 'No accounts, no tracking, no data leaves your control - ever'
  },
  {
    icon: Home,
    title: 'Works Offline',
    description: 'Connect to local AI servers and agents without internet access'
  },
  {
    icon: Globe,
    title: 'Open Source',
    description: 'Fully transparent codebase you can inspect, modify, and contribute to'
  }
]

export function FeatureHighlights() {
  return (
    <section className="space-y-6">
      <h3 className="text-xl font-semibold text-center text-muted-foreground">
        Why BAIGEL?
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="border-muted hover:border-primary/20 transition-colors">
              <CardContent className="pt-6 pb-6 px-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}