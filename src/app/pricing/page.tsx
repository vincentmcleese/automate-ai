import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing - Launch GhostTeam',
  description: 'Pricing plans for Launch GhostTeam automation platform coming soon.',
}

export default function PricingPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-sm text-gray-600">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Coming Soon Content */}
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-foreground text-4xl font-bold sm:text-5xl lg:text-6xl">
              <span className="font-chunko tracking-wider">
                <span className="from-primary bg-gradient-to-r to-teal-400 bg-clip-text text-transparent">
                  PRICING
                </span>
              </span>
            </h1>
            <p className="text-muted-foreground text-xl sm:text-2xl">Coming Soon</p>
          </div>

          <div className="max-w-2xl space-y-6">
            <p className="text-muted-foreground text-lg">
              We are working on creating flexible pricing plans that will make AI-powered automation
              accessible for everyone.
            </p>

            <div className="space-y-4">
              <h2 className="text-foreground text-xl font-semibold">What to expect:</h2>
              <ul className="text-muted-foreground space-y-2 text-left">
                <li>• Free tier for getting started</li>
                <li>• Pay-per-automation options</li>
                <li>• Monthly and annual subscriptions</li>
                <li>• Enterprise solutions for teams</li>
              </ul>
            </div>

            <div className="pt-6">
              <p className="text-muted-foreground mb-4">
                Want to be notified when pricing is available?
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/">Try Launch GhostTeam Now</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://discord.gg/pfKVnH3P" target="_blank" rel="noopener noreferrer">
                    Join Discord for Updates
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
