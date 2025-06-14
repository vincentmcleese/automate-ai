'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { toast } from 'sonner'
import { WorkflowValidationResult } from '@/types/admin'
import { AnimatedLoading } from '@/components/generate/AnimatedLoading'
import { ValidationResultsDisplay } from '@/components/generate/ValidationResultsDisplay'
import { useAuth } from '@/lib/auth/context'
import { CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'

type PageState = 'idle' | 'validating' | 'reviewing' | 'creating'

function GenerateAutomationContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [pageState, setPageState] = useState<PageState>('idle')
  const [prompt, setPrompt] = useState('')
  const [selectedTools, setSelectedTools] = useState<Record<number, string>>({})
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null)
  const [refinedPrompt, setRefinedPrompt] = useState('')

  const claimAutomation = useCallback(
    async (pendingAutomationId: string) => {
      setPageState('creating')
      try {
        const response = await fetch('/api/automations/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingAutomationId }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to claim automation.')
        }
        toast.success('Automation creation started!')
        router.push(`/automations/${data.automationId}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
        setPageState('reviewing')
      }
    },
    [router]
  )

  useEffect(() => {
    // This effect handles the post-login claim process
    if (user && !authLoading) {
      const pendingId = localStorage.getItem('pendingAutomationId')
      if (pendingId) {
        localStorage.removeItem('pendingAutomationId')
        claimAutomation(pendingId)
      }
    }
  }, [user, authLoading, claimAutomation])

  const handleToolSelect = (stepNumber: number, tool: string) => {
    setSelectedTools(prev => ({ ...prev, [stepNumber]: tool }))
  }

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
    if (!user) {
      // User is not authenticated, create a pending automation
      try {
        setPageState('creating') // Give feedback that something is happening
        const response = await fetch('/api/automations/pending/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput: refinedPrompt,
            selectedTools,
            validationResult,
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Could not save your work.')
        }
        localStorage.setItem('pendingAutomationId', data.pendingAutomationId)
        router.push('/login?redirectedFrom=/generate-automation')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
        setPageState('reviewing')
      }
    } else {
      // User is authenticated, create automation directly
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
        setPageState('reviewing')
      }
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          {pageState === 'reviewing' && validationResult ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center gap-2">
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
              <div className="mt-2 flex flex-col items-center">
                <ChevronDown className="text-muted-foreground h-7 w-7 animate-bounce" />
                <span className="text-text-secondary mt-1 text-base">
                  Scroll down to see the analysis and begin creation
                </span>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-text-primary text-4xl font-extrabold tracking-tight sm:text-5xl">
                Create a New Automation
              </h1>
              <p className="text-text-secondary mt-4 text-xl">
                Describe your workflow, and our AI will build it for you.
              </p>
            </>
          )}
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
                <Image
                  src="/ghost_white_transparent.png"
                  alt="Ghost Logo"
                  width={20}
                  height={20}
                  className="mr-2 h-5 w-5"
                />
                Analyze & Plan Workflow
              </Button>
            </CardContent>
          </Card>
        )}

        {pageState === 'validating' && <AnimatedLoading text="Analyzing your prompt..." />}
        {pageState === 'creating' && <AnimatedLoading text="Building your automation..." />}

        {pageState === 'reviewing' && validationResult && (
          <div className="space-y-8">
            <ValidationResultsDisplay
              results={validationResult}
              selectedTools={selectedTools}
              onToolSelect={handleToolSelect}
            />
            <Button
              onClick={handleCreateAutomation}
              className="flex w-full items-center justify-center text-lg"
            >
              <Image
                src="/ghost_white_transparent.png"
                alt="Ghost Logo"
                width={28}
                height={28}
                className="mr-2 h-7 w-7"
              />
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
