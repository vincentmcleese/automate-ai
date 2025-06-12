'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainCircuit, ClipboardCheck, GitMerge } from 'lucide-react'

const benefits = [
  {
    icon: <BrainCircuit className="text-brand-primary h-8 w-8" />,
    title: 'AI-Powered Builder',
    description: 'Transform natural language into production-ready automation workflows.',
  },
  {
    icon: <ClipboardCheck className="text-brand-primary h-8 w-8" />,
    title: 'Instant Blueprints',
    description: 'Get JSON configurations and detailed implementation guides in seconds.',
  },
  {
    icon: <GitMerge className="text-brand-primary h-8 w-8" />,
    title: 'Universal Integration',
    description: 'Works with any platform—n8n, Make, or custom solutions.',
  },
]

export function KeyBenefitsSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-text-primary text-3xl font-extrabold">
            A Radically Faster Way to Build
          </h2>
          <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg">
            Go from idea to implementation in minutes, not days. AutomateAI is perfect for
            developers and non-technical users alike.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {benefits.map(benefit => (
            <Card
              key={benefit.title}
              className="border-border bg-card hover:border-brand-primary transform rounded-xl border-2 text-left shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <CardHeader>
                {benefit.icon}
                <CardTitle className="text-text-primary mt-4 text-xl font-semibold">
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary text-base">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
