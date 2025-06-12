'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { toast } from 'sonner'
import { WorkflowValidationResult } from '@/types/admin'
import { AnimatedLoading } from '@/components/generate/AnimatedLoading'
import { ValidationResultsDisplay } from '@/components/generate/ValidationResultsDisplay'

import { ArrowRight, Wand2 } from 'lucide-react'

type PageState = 'idle' | 'validating' | 'reviewing' | 'creating'

function GenerateAutomationContent() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('idle')
  const [prompt, setPrompt] = useState('')
  const [selectedTools] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null)
  const [refinedPrompt, setRefinedPrompt] = useState('')

  const handleValidate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a workflow description.')
      return
    }
    setPageState('validating')
    try {
      const response = await fetch('/api/workflow/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowDescription: prompt, selectedTools }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Validation failed')
      }
      const data: WorkflowValidationResult = await response.json()
      setValidationResult(data)
      setRefinedPrompt(prompt)
      setPageState('reviewing')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
      setPageState('idle')
    }
  }

  const handleCreateAutomation = async () => {
    setPageState('creating')
    try {
      const response = await fetch('/api/automations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: refinedPrompt, selectedTools }),
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
      setPageState('reviewing') // Go back to review state on error
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-text-primary text-4xl font-extrabold tracking-tight sm:text-5xl">
            Create a New Automation
          </h1>
          <p className="text-text-secondary mt-4 text-xl">
            Describe your workflow, and our AI will build it for you.
          </p>
        </header>

        {pageState === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>1. Describe Your Workflow</CardTitle>
              <CardDescription>
                Explain what you want to automate in plain English. The more detail, the better!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="e.g., When a new lead comes in from our website form, create a new record in Salesforce, send a welcome email via Gmail, and post a notification to our #leads channel in Slack."
                rows={6}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />

              <Button onClick={handleValidate} className="w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                Analyze & Plan Workflow
              </Button>
            </CardContent>
          </Card>
        )}

        {pageState === 'validating' && <AnimatedLoading text="Analyzing your prompt..." />}
        {pageState === 'creating' && <AnimatedLoading text="Building your automation..." />}

        {pageState === 'reviewing' && validationResult && (
          <div className="space-y-8">
            <ValidationResultsDisplay results={validationResult} />
            <Card>
              <CardHeader>
                <CardTitle>2. Refine Your Prompt (Optional)</CardTitle>
                <CardDescription>
                  Based on the plan above, you can refine your prompt for a better result.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  value={refinedPrompt}
                  onChange={e => setRefinedPrompt(e.target.value)}
                />
              </CardContent>
            </Card>
            <Button onClick={handleCreateAutomation} className="w-full text-lg">
              <ArrowRight className="mr-2 h-5 w-5" />
              Yes, Generate this Automation!
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GenerateAutomationPage() {
  return (
    <Suspense>
      <GenerateAutomationContent />
    </Suspense>
  )
}
