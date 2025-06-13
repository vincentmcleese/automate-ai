'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { ProcessSteps } from './ProcessSteps'

interface HeroSectionProps {
  prompt: string
  setPrompt: (value: string) => void
  onGenerate: () => void
  loading: boolean
  buttonText: string
  onInspireMe: () => void
}

export function HeroSection({
  prompt,
  setPrompt,
  onGenerate,
  loading,
  buttonText,
  onInspireMe,
}: HeroSectionProps) {
  return (
    <div className="relative isolate py-16 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.05, type: 'spring', stiffness: 80 }}
            className="flex items-center justify-center gap-4"
          >
            <Image
              src="/speedyghost.png"
              alt="Speedy Ghost Mascot"
              width={64}
              height={64}
              className="h-12 w-12 rounded-xl bg-black/5 drop-shadow-lg sm:h-16 sm:w-16"
              priority
            />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-foreground text-4xl font-extrabold tracking-tight sm:text-6xl"
            >
              Prompt Automations
            </motion.h1>
          </motion.div>
          <div className="mt-8">
            <ProcessSteps />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          <Textarea
            placeholder="e.g., When a new lead signs up, send their info to Salesforce, add them to Mailchimp, and notify sales in Slack."
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="border-border/80 bg-background/50 focus-visible:ring-ring focus-visible:ring-offset-background resize-none text-base shadow-inner focus-visible:ring-2 focus-visible:ring-offset-2"
          />
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={onInspireMe}
              disabled={loading}
              variant="outline"
              size="lg"
              className="w-full text-base font-semibold sm:w-auto"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Inspire Me
            </Button>
            <Button
              onClick={onGenerate}
              disabled={loading}
              size="lg"
              className="w-full text-base font-semibold sm:w-auto"
            >
              <Image
                src="/ghost_white_transparent.png"
                alt="Ghost Logo"
                width={28}
                height={28}
                className="mr-2 h-7 w-7"
              />
              {loading ? 'Analyzing...' : buttonText}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
