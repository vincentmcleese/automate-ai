'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainCircuit, ClipboardCheck, GitMerge } from 'lucide-react'
import { motion } from 'framer-motion'

const benefits = [
  {
    icon: <BrainCircuit className="text-primary h-8 w-8" />,
    title: 'AI-Powered Builder',
    description: 'Transform natural language into production-ready automation workflows.',
  },
  {
    icon: <ClipboardCheck className="text-primary h-8 w-8" />,
    title: 'Instant Blueprints',
    description: 'Get JSON configurations and detailed implementation guides in seconds.',
  },
  {
    icon: <GitMerge className="text-primary h-8 w-8" />,
    title: 'Universal Integration',
    description: 'Works with any platform—n8n, Make, or custom solutions.',
  },
]

export function KeyBenefitsSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            A Radically Faster Way to Build
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            Go from idea to implementation in minutes, not days. AutomateAI is perfect for
            developers and non-technical users alike.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
            >
              <Card className="bg-background/50 hover:bg-card h-full transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-foreground text-xl font-semibold">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-base">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
