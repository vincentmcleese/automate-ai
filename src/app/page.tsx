'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { WorkflowValidation } from '@/components/WorkflowValidation'
import { WorkflowValidationResult } from '@/types/admin'
import { Sparkles, Zap, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const [workflow, setWorkflow] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null)
  const [hasValidated, setHasValidated] = useState(false)

  const validateWorkflow = async (description: string) => {
    try {
      const response = await fetch('/api/workflow/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_description: description,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to validate workflow')
      }

      const data = await response.json()
      return data.validation
    } catch (error) {
      console.error('Error validating workflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to validate workflow')
      throw error
    }
  }

  const handleAutomate = async () => {
    if (!workflow.trim()) return

    setIsLoading(true)
    try {
      const validation = await validateWorkflow(workflow)
      setValidationResult(validation)
      setHasValidated(true)

      if (validation.is_valid) {
        toast.success('Workflow validation complete! Ready for automation.')
      } else {
        toast.warning('Workflow needs refinement. Check the suggestions below.')
      }
    } catch {
      // Error already handled in validateWorkflow
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevalidate = async () => {
    if (!workflow.trim()) return

    setIsRevalidating(true)
    try {
      const validation = await validateWorkflow(workflow)
      setValidationResult(validation)

      if (validation.is_valid) {
        toast.success('Revalidation complete! Workflow is ready for automation.')
      } else {
        toast.warning('Workflow still needs refinement. Check the updated suggestions.')
      }
    } catch {
      // Error already handled in validateWorkflow
    } finally {
      setIsRevalidating(false)
    }
  }

  const handleCreateAutomation = () => {
    // TODO: Implement automation creation logic
    toast.success('Creating automation... (This feature will be implemented next!)')
    console.log('Creating automation for:', workflow)
    console.log('Validation result:', validationResult)
  }

  const handleClear = () => {
    setWorkflow('')
    setValidationResult(null)
    setHasValidated(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] p-4">
      <div className="mx-auto w-full max-w-4xl space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <Sparkles className="h-8 w-8 text-[#32da94]" />
            <h1 className="text-4xl font-bold text-[#000000] md:text-6xl">AutomateAI</h1>
            <Zap className="h-8 w-8 text-[#32da94]" />
          </div>

          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-[#6b7280] md:text-2xl">
            Describe your workflow in plain English, and watch as AI transforms it into powerful
            automation
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="border border-[#e5e7eb] shadow-lg transition-shadow duration-300 hover:shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-6">
              <div className="text-left">
                <label
                  htmlFor="workflow-input"
                  className="mb-3 block text-lg font-semibold text-[#000000]"
                >
                  What would you like to automate?
                </label>
                <p className="mb-4 text-sm text-[#6b7280]">
                  Examples: &ldquo;Send weekly reports to my team&rdquo;, &ldquo;Organize my emails
                  by priority&rdquo;, &ldquo;Schedule social media posts&rdquo;
                </p>
              </div>

              <div className="relative">
                <Textarea
                  id="workflow-input"
                  placeholder="Describe your workflow automation idea here... Be as detailed as you'd like!"
                  value={workflow}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setWorkflow(e.target.value)
                  }
                  className="focus:ring-opacity-20 min-h-[120px] resize-none border-2 border-[#e5e7eb] text-base transition-colors duration-200 focus:border-[#32da94] focus:ring-2 focus:ring-[#32da94]"
                  disabled={isLoading || isRevalidating}
                />

                {/* Character count */}
                <div className="absolute right-3 bottom-3 text-xs text-[#6b7280]">
                  {workflow.length} characters
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                {!hasValidated ? (
                  <>
                    <Button
                      onClick={handleAutomate}
                      disabled={!workflow.trim() || isLoading}
                      className="w-full rounded-lg bg-[#32da94] px-8 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-[#2bb885] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                          Validating...
                        </>
                      ) : (
                        <>
                          Automate
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    {workflow.trim() && !isLoading && (
                      <Button
                        variant="outline"
                        onClick={handleClear}
                        className="w-full border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8f9fa] sm:w-auto"
                      >
                        Clear
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={isLoading || isRevalidating}
                    className="w-full border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8f9fa] sm:w-auto"
                  >
                    Start Over
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Results */}
        {validationResult && (
          <WorkflowValidation
            validation={validationResult}
            workflowDescription={workflow}
            isRevalidating={isRevalidating}
            onRevalidate={handleRevalidate}
            onCreateAutomation={handleCreateAutomation}
          />
        )}

        {/* Feature Highlights */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card className="border border-[#e5e7eb] transition-colors duration-300 hover:border-[#32da94]">
            <CardContent className="p-6 text-center">
              <div className="bg-opacity-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#32da94]">
                <Sparkles className="h-6 w-6 text-[#32da94]" />
              </div>
              <h3 className="mb-2 font-semibold text-[#000000]">AI-Powered</h3>
              <p className="text-sm text-[#6b7280]">
                Advanced AI understands your workflow descriptions and creates intelligent
                automations
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#e5e7eb] transition-colors duration-300 hover:border-[#32da94]">
            <CardContent className="p-6 text-center">
              <div className="bg-opacity-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#32da94]">
                <Zap className="h-6 w-6 text-[#32da94]" />
              </div>
              <h3 className="mb-2 font-semibold text-[#000000]">Instant Setup</h3>
              <p className="text-sm text-[#6b7280]">
                No coding required. Just describe what you want and we&apos;ll handle the technical
                details
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#e5e7eb] transition-colors duration-300 hover:border-[#32da94]">
            <CardContent className="p-6 text-center">
              <div className="bg-opacity-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#32da94]">
                <ArrowRight className="h-6 w-6 text-[#32da94]" />
              </div>
              <h3 className="mb-2 font-semibold text-[#000000]">Easy Integration</h3>
              <p className="text-sm text-[#6b7280]">
                Seamlessly connects with your existing tools and workflows
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
