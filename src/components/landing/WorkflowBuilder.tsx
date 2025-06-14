'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/context'
import { WorkflowValidationResult, WorkflowStep } from '@/types/admin'
import { AnimatedLoading } from '@/components/generate/AnimatedLoading'
import { ValidationResultsDisplay } from '@/components/generate/ValidationResultsDisplay'
import { HeroSection } from '@/components/landing/HeroSection'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react'
import { inspirationalPrompts } from '@/lib/inspirational-prompts'
import { KeyBenefitsSection } from '@/components/landing/KeyBenefitsSection'

type PageState = 'idle' | 'validating' | 'reviewing' | 'creating'

export function WorkflowBuilder() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [pageState, setPageState] = useState<PageState>('idle')
  const [prompt, setPrompt] = useState('')
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null)
  const [refinedPrompt, setRefinedPrompt] = useState('')
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1)
  const [selectedTools, setSelectedTools] = useState<Record<number, string>>({})

  const handleCreateAutomation = useCallback(
    async (promptToCreate: string, toolsToUse: Record<number, string>) => {
      if (!promptToCreate) return

      setPageState('creating')
      try {
        // Check auth state FIRST instead of trying API and handling 401
        if (!user && !authLoading) {
          // User is not logged in - create pending automation
          const pendingResponse = await fetch('/api/automations/pending/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInput: promptToCreate,
              selectedTools: toolsToUse,
              validationResult: null, // No validation on home page
            }),
          })

          if (!pendingResponse.ok) {
            throw new Error('Failed to save your work')
          }

          const pendingData = await pendingResponse.json()
          router.push(
            `/login?pendingAutomationId=${pendingData.pendingAutomationId}&reason=create_automation`
          )
          return
        }

        if (user) {
          // User is logged in - create automation directly
          const response = await fetch('/api/automations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: promptToCreate, selectedTools: toolsToUse }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to create automation')
          }

          toast.success('Automation created successfully!')
          router.push(`/automations/${data.automationId}`)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
        setPageState('reviewing')
      }
    },
    [router, user, authLoading]
  )

  const handleValidate = useCallback(
    async (
      promptToValidate: string,
      autoCreateOnSuccess = false,
      preSelectedTools: Record<number, string> | undefined = undefined
    ) => {
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
        setRefinedPrompt(promptToValidate)

        let toolsToUse: Record<number, string>
        if (preSelectedTools) {
          setSelectedTools(preSelectedTools)
          toolsToUse = preSelectedTools
        } else {
          const defaultTools: Record<number, string> = {}
          data.validation.steps.forEach((step: WorkflowStep) => {
            if (step.default_tool) {
              defaultTools[step.step_number] = step.default_tool
            }
          })
          setSelectedTools(defaultTools)
          toolsToUse = defaultTools
        }

        setPageState('reviewing')

        if (autoCreateOnSuccess) {
          handleCreateAutomation(promptToValidate, toolsToUse)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
        setPageState('idle')
      }
    },
    [handleCreateAutomation]
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userInput = params.get('userInput')
    const toolsParam = params.get('selectedTools')
    const action = params.get('action')

    if (action === 'create' && userInput) {
      const selectedTools = toolsParam ? JSON.parse(toolsParam) : undefined
      handleValidate(userInput, true, selectedTools)

      // Clean up URL params to avoid re-triggering on refresh
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // IMPORTANT: Run only on initial mount

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

  const handleToolSelect = (stepNumber: number, tool: string) => {
    setSelectedTools(prev => ({ ...prev, [stepNumber]: tool }))
  }

  const isLoading = pageState === 'validating' || pageState === 'creating'

  return (
    <>
      {pageState === 'idle' && (
        <>
          <HeroSection
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={() => handleValidate(prompt)}
            loading={isLoading}
            buttonText="Analyze My Automation"
            onInspireMe={handleInspireMe}
          />
          <KeyBenefitsSection />
        </>
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

          <ValidationResultsDisplay
            results={validationResult}
            selectedTools={selectedTools}
            onToolSelect={handleToolSelect}
          />

          <Button
            onClick={() => handleCreateAutomation(refinedPrompt, selectedTools)}
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
            pageState === 'validating' ? 'Analyzing your prompt...' : 'Building your automation...'
          }
        />
      )}
    </>
  )
}
