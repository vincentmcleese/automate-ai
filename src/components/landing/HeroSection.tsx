'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Wand2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface HeroSectionProps {
  title: string
  description: string
  prompt: string
  setPrompt: (value: string) => void
  onGenerate: () => void
  loading: boolean
  buttonText: string
}

export function HeroSection({
  title,
  description,
  prompt,
  setPrompt,
  onGenerate,
  loading,
  buttonText,
}: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-text-primary text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-text-secondary mx-auto mt-4 max-w-2xl text-xl"
        >
          {description}
        </motion.p>
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <Textarea
            placeholder="e.g., When a new lead signs up on our website, send their info to Salesforce, add them to a Mailchimp nurturing sequence, and notify the sales team in Slack."
            rows={5}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="border-border focus-visible:ring-primary text-base"
          />
          <Button
            onClick={onGenerate}
            disabled={loading}
            className="mt-4 w-full bg-[#32da94] text-lg text-white hover:bg-[#2bb885]"
          >
            <Wand2 className="mr-2 h-5 w-5" />
            {loading ? 'Analyzing...' : buttonText}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
