'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { WorkflowValidation } from '@/components/WorkflowValidation'
import { WorkflowValidationResult, WorkflowStep } from '@/types/admin'
import {
  Sparkles,
  Zap,
  ArrowRight,
  FileText,
  FileJson2,
  Rocket,
  BrainCircuit,
  ClipboardCheck,
  GitMerge,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
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

  const handleCreateAutomation = async (selectedTools?: Record<number, string>) => {
    try {
      // Check authentication
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in to create automations')
        router.push(
          '/login?redirect=/generate-automation&message=Please+sign+in+to+create+automations'
        )
        return
      }

      // Create enhanced workflow description if tools were selected
      let description = workflow.trim()
      if (selectedTools && validationResult) {
        description = createEnhancedWorkflowDescription(
          workflow.trim(),
          validationResult.steps,
          selectedTools
        )
      }

      // Navigate to generation page with enhanced workflow description
      const params = new URLSearchParams({
        description: description,
      })
      router.push(`/generate-automation?${params.toString()}`)
    } catch (error) {
      console.error('Error checking authentication:', error)
      toast.error('Authentication check failed. Please try again.')
    }
  }

  // Helper function to create enhanced workflow description
  const createEnhancedWorkflowDescription = (
    originalDescription: string,
    workflowSteps: WorkflowStep[],
    toolSelections: Record<number, string>
  ): string => {
    let enhanced = originalDescription

    // Add tool specifications for each step that has a selected tool
    const toolSpecifications: string[] = []

    workflowSteps.forEach(step => {
      const selectedTool = toolSelections[step.step_number]
      if (
        selectedTool &&
        step.tool_category &&
        step.tool_category !== 'Code' &&
        step.tool_category !== 'HTTPRequest'
      ) {
        // Create a natural language specification for the tool choice
        const specification = createToolSpecification(step, selectedTool)
        if (specification) {
          toolSpecifications.push(specification)
        }
      }
    })

    // Append tool specifications to the original description
    if (toolSpecifications.length > 0) {
      enhanced += '\n\nSpecific tool requirements:\n' + toolSpecifications.join('\n')
    }

    return enhanced
  }

  // Helper function to create natural language tool specifications
  const createToolSpecification = (step: WorkflowStep, selectedTool: string): string => {
    const categoryToAction: Record<string, string> = {
      Communication: 'send notifications or messages',
      Email: 'send emails',
      CRM: 'manage customer data',
      'File Storage': 'store or retrieve files',
      'Project Management': 'manage tasks or projects',
    }

    const action = categoryToAction[step.tool_category!] || 'perform actions'
    return `- Use ${selectedTool} to ${action} for the step: "${step.description}"`
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
                  Build Powerful Automations with Just a Description
                </label>
                <p className="mb-4 text-sm text-[#6b7280]">
                  Describe any workflow in plain English and get instant automation blueprints -
                  complete with JSON configs and step-by-step implementation guides. No coding
                  required.
                </p>
              </div>

              <div className="relative">
                <Textarea
                  id="workflow-input"
                  placeholder="Describe the automation you want to build... (e.g., 'When a new lead submits a form, add them to my CRM, send a welcome email, and notify my sales team on Slack')"
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
                          Generate Automation
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
            isRevalidating={isRevalidating}
            onRevalidate={handleRevalidate}
            onCreateAutomation={handleCreateAutomation}
          />
        )}

        {/* How It Works */}
        <div className="mt-16 w-full text-center">
          <h2 className="mb-12 text-3xl font-bold text-[#000000]">How It Works</h2>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector Line */}
            <div className="absolute top-8 left-0 hidden h-0.5 w-full bg-gray-200 md:block">
              <div className="absolute top-1/2 left-1/2 h-full w-2/3 -translate-x-1/2 -translate-y-1/2 border-t-2 border-dashed border-[#e5e7eb]"></div>
            </div>
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#32da94] text-white ring-8 ring-[#f8f9fa]">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#000000]">
                1. Describe What You Want
              </h3>
              <p className="text-base text-[#6b7280]">
                Tell us your workflow in plain English - no technical knowledge needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#32da94] text-white ring-8 ring-[#f8f9fa]">
                <FileJson2 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#000000]">2. Get Your Files</h3>
              <p className="text-base text-[#6b7280]">
                Receive a JSON file and setup guide instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#32da94] text-white ring-8 ring-[#f8f9fa]">
                <Rocket className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#000000]">3. Upload & Go</h3>
              <p className="text-base text-[#6b7280]">
                Import the JSON into n8n, Zapier, or any automation platform. Configure and
                you&apos;re done.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 w-full text-left">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#000000]">
            Everything You Need to Automate
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="transform border-2 border-[#e5e7eb] text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#32da94] hover:shadow-2xl">
              <CardContent className="flex flex-col items-center p-8">
                <BrainCircuit className="mb-4 h-10 w-10 text-[#2bb885]" />
                <h3 className="mb-2 text-xl font-semibold text-[#000000]">
                  AI-Powered Automation Builder
                </h3>
                <p className="text-base text-[#6b7280]">
                  Transform natural language into production-ready automation workflows.
                </p>
              </CardContent>
            </Card>
            <Card className="transform border-2 border-[#e5e7eb] text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#32da94] hover:shadow-2xl">
              <CardContent className="flex flex-col items-center p-8">
                <ClipboardCheck className="mb-4 h-10 w-10 text-[#2bb885]" />
                <h3 className="mb-2 text-xl font-semibold text-[#000000]">
                  Instant Blueprint Generation
                </h3>
                <p className="text-base text-[#6b7280]">
                  Get JSON configurations and detailed implementation guides in seconds.
                </p>
              </CardContent>
            </Card>
            <Card className="transform border-2 border-[#e5e7eb] text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#32da94] hover:shadow-2xl">
              <CardContent className="flex flex-col items-center p-8">
                <GitMerge className="mb-4 h-10 w-10 text-[#2bb885]" />
                <h3 className="mb-2 text-xl font-semibold text-[#000000]">Universal Integration</h3>
                <p className="text-base text-[#6b7280]">
                  Works with any platform—n8n, Make, or custom solutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Benefits Section */}
        <div className="mt-24 w-full">
          <Card className="border-2 border-[#e5e7eb] bg-white p-8 shadow-xl md:p-12">
            <h2 className="mb-8 text-center text-3xl font-bold text-[#000000]">Key Benefits</h2>
            <ul className="space-y-6">
              <li className="flex items-start">
                <CheckCircle2 className="mt-1 mr-4 h-6 w-6 flex-shrink-0 text-[#32da94]" />
                <span className="text-lg text-[#6b7280]">
                  <strong className="font-semibold text-black">
                    Go from idea to implementation in minutes,
                  </strong>{' '}
                  not days. Radically speed up your workflow development.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="mt-1 mr-4 h-6 w-6 flex-shrink-0 text-[#32da94]" />
                <span className="text-lg text-[#6b7280]">
                  <strong className="font-semibold text-black">
                    Perfect for non-technical users and developers alike.
                  </strong>{' '}
                  An intuitive interface for everyone.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="mt-1 mr-4 h-6 w-6 flex-shrink-0 text-[#32da94]" />
                <span className="text-lg text-[#6b7280]">
                  <strong className="font-semibold text-black">
                    Export-ready configurations for popular platforms.
                  </strong>{' '}
                  Get started instantly with n8n, Zapier, and more.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
