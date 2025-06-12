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
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type PageState = 'idle' | 'validating' | 'reviewing' | 'creating'

export default function HomePage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('idle')
  const [prompt, setPrompt] = useState('')
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null)
  const [refinedPrompt, setRefinedPrompt] = useState('')

  const handleValidate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a workflow description.')
      return
    }
    setPageState('validating')
    try {
      const response = await fetch('/api/workflow/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_description: prompt }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Validation failed')
      }
      const data = await response.json()
      setValidationResult(data.validation)
      setRefinedPrompt(prompt)
      setPageState('reviewing')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
      setPageState('idle')
    }
  }, [prompt])

  const handleCreateAutomation = useCallback(async () => {
    setPageState('creating')
    try {
      const response = await fetch('/api/automations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: refinedPrompt, selectedTools: {} }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create automation')
      }
      const data = await response.json()
      toast.success('Automation creation started!')
      router.push(`/automations/${data.automationId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
      setPageState('reviewing')
    }
  }, [refinedPrompt, router])

  const isLoading = pageState === 'validating' || pageState === 'creating'

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        {(pageState === 'idle' || pageState === 'reviewing') && (
          <HeroSection
            title={
              pageState === 'idle'
                ? 'Build Automations with a Single Prompt'
                : 'Refine Your Workflow'
            }
            description={
              pageState === 'idle'
                ? 'Describe your workflow in plain English. Our AI will analyze it, create a step-by-step plan, and generate the production-ready JSON for you.'
                : 'Based on the AI-generated plan below, you can edit your prompt for a better result.'
            }
            prompt={pageState === 'idle' ? prompt : refinedPrompt}
            setPrompt={pageState === 'idle' ? setPrompt : setRefinedPrompt}
            onGenerate={handleValidate}
            loading={isLoading}
            buttonText={pageState === 'idle' ? 'Generate My Automation' : 'Re-Analyze Plan'}
          />
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

        {pageState === 'reviewing' && validationResult && (
          <div className="mt-8 space-y-8">
            <ValidationResultsDisplay results={validationResult} />
            <Card>
              <CardHeader>
                <CardTitle>Refine Your Prompt (Optional)</CardTitle>
                <CardDescription>
                  You can edit your prompt for a better result, or generate as is.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  value={refinedPrompt}
                  onChange={e => setRefinedPrompt(e.target.value)}
                  className="border-border focus-visible:ring-primary text-base"
                />
              </CardContent>
            </Card>
            <Button
              onClick={handleCreateAutomation}
              className="w-full bg-[#32da94] text-lg text-white hover:bg-[#2bb885]"
              disabled={isLoading}
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              {isLoading ? 'Generating...' : 'Yes, Generate this Automation!'}
            </Button>
          </div>
        )}

        {pageState === 'idle' && <KeyBenefitsSection />}
      </main>
    </div>
  )
}
