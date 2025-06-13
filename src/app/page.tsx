'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WorkflowValidationResult } from '@/types/admin'
import { AnimatedLoading } from '@/components/generate/AnimatedLoading'
import { ValidationResultsDisplay } from '@/components/generate/ValidationResultsDisplay'
import { KeyBenefitsSection } from '@/components/landing/KeyBenefitsSection'
import { HeroSection } from '@/components/landing/HeroSection'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react'
import { inspirationalPrompts } from '@/lib/inspirational-prompts'

type PageState = 'idle' | 'validating' | 'reviewing' | 'creating'

export default function HomePage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('idle')
  const [prompt, setPrompt] = useState('')
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null)
  const [refinedPrompt, setRefinedPrompt] = useState('')
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1)

  const handleValidate = useCallback(
    async (promptToValidate: string) => {
      if (!promptToValidate.trim()) {
        toast.error('Please enter a workflow description.')
        return
      }
      setPageState('validating')
      try {
        const response = await fetch('/api/workflow/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_description: promptToValidate }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Validation failed')
        }
        const data = await response.json()
        setValidationResult(data.validation)
        // Set refined prompt only on initial validation
        if (pageState === 'idle') {
          setRefinedPrompt(promptToValidate)
        }
        setPageState('reviewing')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
        setPageState('idle')
      }
    },
    [pageState]
  )

  const handleInspireMe = useCallback(() => {
    const nextIndex = (currentPromptIndex + 1) % inspirationalPrompts.length
    setCurrentPromptIndex(nextIndex)
    const newPrompt = inspirationalPrompts[nextIndex]
    if (pageState === 'reviewing') {
      setRefinedPrompt(newPrompt)
    } else {
      setPrompt(newPrompt)
    }
  }, [currentPromptIndex, pageState])

  const handleCreateAutomation = useCallback(async () => {
    setPageState('creating')
    try {
      const response = await fetch('/api/automations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: refinedPrompt, selectedTools: {} }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create automation')
      }

      toast.success('Automation created successfully!')
      router.push(`/automations/${data.automationId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
      setPageState('reviewing')
    }
  }, [refinedPrompt, router])

  const isLoading = pageState === 'validating' || pageState === 'creating'

  return (
    <div className="relative min-h-screen">
      <div className="animate-background-glow bg-background absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(50,218,148,0.15),transparent_70%)]"></div>
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-16">
        {pageState === 'idle' && (
          <HeroSection
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={() => handleValidate(prompt)}
            loading={isLoading}
            buttonText="Generate My Automation"
            onInspireMe={handleInspireMe}
          />
        )}

        {pageState === 'reviewing' && validationResult && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                {validationResult.is_valid ? (
                  <CheckCircle className="text-brand-primary h-8 w-8" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                )}
                <h1
                  className={`text-4xl font-extrabold tracking-tight sm:text-5xl ${
                    validationResult.is_valid ? 'text-brand-primary' : 'text-yellow-600'
                  }`}
                >
                  {validationResult.is_valid ? 'Looks Good!' : 'Needs Improvement'}
                </h1>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Refine Your Prompt (Optional)</CardTitle>
                <CardDescription>
                  You can edit your prompt for a better result, or re-validate your changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  rows={4}
                  value={refinedPrompt}
                  onChange={e => setRefinedPrompt(e.target.value)}
                  className="border-border/80 bg-background/50 focus-visible:ring-ring focus-visible:ring-offset-background resize-none text-base shadow-inner focus-visible:ring-2 focus-visible:ring-offset-2"
                />
                <Button
                  onClick={() => handleValidate(refinedPrompt)}
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-Analyze Plan
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center text-center">
              <ChevronDown className="text-muted-foreground h-7 w-7 animate-bounce" />
              <span className="text-text-secondary mt-1 text-base">
                Scroll down to see the analysis and begin creation
              </span>
            </div>

            <ValidationResultsDisplay results={validationResult} />

            <Button
              onClick={handleCreateAutomation}
              className="w-full text-lg font-semibold"
              size="lg"
              disabled={isLoading}
            >
              <Image
                src="/ghost_white_transparent.png"
                alt="Ghost Logo"
                width={28}
                height={28}
                className="mr-2 h-7 w-7"
              />
              {isLoading ? 'Generating...' : 'Yes, Generate this Automation!'}
            </Button>
          </div>
        )}

        {isLoading && (
          <AnimatedLoading
            text={
              pageState === 'validating'
                ? 'Analyzing your prompt...'
                : 'Building your automation...'
            }
          />
        )}

        {pageState === 'idle' && <KeyBenefitsSection />}
      </main>
    </div>
  )
}
