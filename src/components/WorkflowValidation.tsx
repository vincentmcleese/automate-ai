'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddToolModal } from '@/components/admin/AddToolModal'
import { WorkflowValidationResult, WorkflowStep } from '@/types/admin'
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Settings,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  Code,
  ArrowRightCircle,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface WorkflowValidationProps {
  validation: WorkflowValidationResult & { user_input: string }
  isRevalidating: boolean
  onRevalidate: () => void
}

export function WorkflowValidation({
  validation,
  isRevalidating,
  onRevalidate,
}: WorkflowValidationProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(validation.steps)
  const [selectedTools, setSelectedTools] = useState<Record<number, string>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setSteps(validation.steps)
    const defaultTools: Record<number, string> = {}
    validation.steps.forEach(step => {
      if (step.default_tool) {
        defaultTools[step.step_number] = step.default_tool
      }
    })
    setSelectedTools(defaultTools)
  }, [validation.steps])

  const handleToolSelect = (stepNumber: number, tool: string) => {
    if (tool === 'add_new_tool') {
      // This part of the logic will need to be improved.
      // Let's open the modal for now.
      setIsModalOpen(true)
    } else if (tool === 'none') {
      // If user selects "No tool", remove it from the state
      const newSelectedTools = { ...selectedTools }
      delete newSelectedTools[stepNumber]
      setSelectedTools(newSelectedTools)
    } else {
      setSelectedTools(prev => ({ ...prev, [stepNumber]: tool }))
    }
  }

  const handleToolAdded = (newTool: { id: string; name: string; logo_url?: string }) => {
    // This is a simplified version. We'd need to find which step to add it to.
    // And also update the available_tools for that step.
    console.log('New tool added:', newTool)
    // For now, just closes modal. A full implementation would be more complex.
    setIsModalOpen(false)
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'complex':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="h-5 w-5 text-yellow-500" />
      case 'action':
        return <ArrowRightCircle className="h-5 w-5 text-blue-500" />
      case 'logic':
        return <Code className="h-5 w-5 text-purple-500" />
      default:
        return <Settings className="h-5 w-5 text-gray-500" />
    }
  }

  const handleCreateAutomation = async () => {
    try {
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

      const response = await fetch('/api/automations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: validation.user_input,
          selectedTools,
        }),
      })

      if (!response.ok) {
        const errorData: { error?: string } = await response.json()
        throw new Error(errorData?.error || 'Failed to start automation creation.')
      }

      const data: { automationId: string } = await response.json()
      toast.success('Automation is generating! Redirecting...')
      router.push(`/automations/${data.automationId}`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
      console.error('Error creating automation:', error)
      toast.error(errorMessage)
    }
  }

  return (
    <>
      <AddToolModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToolAdded={handleToolAdded}
        categoryId={''} // This needs real data
      />
      <Card className="mt-6 border border-[#e5e7eb] shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {validation.is_valid ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <CardTitle className="text-xl">
                {validation.is_valid ? 'Workflow Blueprint Ready' : 'Workflow Needs Refinement'}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#6b7280]">Confidence:</span>
              <span className={`font-semibold ${getConfidenceColor(validation.confidence)}`}>
                {Math.round(validation.confidence * 100)}%
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Complexity and Time Estimate */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-[#6b7280]" />
              <span className="text-sm text-[#6b7280]">Complexity:</span>
              <Badge className={getComplexityColor(validation.complexity)}>
                {validation.complexity.charAt(0).toUpperCase() + validation.complexity.slice(1)}
              </Badge>
            </div>
            {validation.estimated_time_hours > 0 && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#6b7280]" />
                <span className="text-sm text-[#6b7280]">
                  Est. setup time: {validation.estimated_time_hours}h
                </span>
              </div>
            )}
          </div>

          {/* Steps */}
          <div>
            <h4 className="mb-3 flex items-center font-semibold text-[#000000]">
              <ChevronDown className="mr-2 h-5 w-5 text-[#32da94]" />
              Workflow Steps
            </h4>
            <div className="space-y-4 border-l-2 border-gray-200 pl-4">
              {steps.map(step => (
                <div key={step.step_number} className="relative space-y-3">
                  <div className="absolute top-1 -left-[26px] flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    {getStepIcon(step.type)}
                  </div>
                  <div className="pl-4">
                    <p className="font-semibold text-black">{step.description}</p>
                    <p className="text-sm text-gray-500">{step.details}</p>

                    {step.tool_category === 'Custom Integration' && step.technical_note && (
                      <Alert variant="default" className="mt-2 border-amber-500/50 bg-amber-50/50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong className="font-semibold">Developer Note:</strong>{' '}
                          {step.technical_note}
                        </AlertDescription>
                      </Alert>
                    )}

                    {step.tool_category &&
                      !['Code', 'HTTPRequest', 'Custom Integration'].includes(step.tool_category) &&
                      step.available_tools && (
                        <div className="mt-2 max-w-xs">
                          <Select
                            onValueChange={value => handleToolSelect(step.step_number, value)}
                            value={selectedTools[step.step_number] || step.default_tool || ''}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a tool..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No tool required</SelectItem>
                              {step.available_tools.map(tool => (
                                <SelectItem key={tool.name} value={tool.name}>
                                  {tool.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="add_new_tool" className="text-blue-600">
                                <PlusCircle className="mr-2 inline-block h-4 w-4" />
                                Add a new tool...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                    {(step.tool_category === 'Code' ||
                      step.tool_category === 'HTTPRequest' ||
                      (step.tool_category && !step.available_tools)) && (
                      <div className="mt-2">
                        <Badge variant="secondary">{step.default_tool || step.tool_category}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center font-semibold text-[#000000]">
                <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                Suggestions for improvements (update prompt above)
              </h4>
              <div className="space-y-2">
                {validation.suggestions.map((suggestion, index) => (
                  <Alert key={index} className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-yellow-800">
                      {suggestion}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row">
            <Button
              onClick={onRevalidate}
              disabled={isRevalidating}
              variant="outline"
              className="w-full border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8f9fa] sm:w-auto"
            >
              {isRevalidating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
                  Revalidating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Revalidate
                </>
              )}
            </Button>

            <Button
              onClick={handleCreateAutomation}
              disabled={!validation.is_valid || isRevalidating}
              className="w-full bg-[#32da94] font-semibold text-white hover:bg-[#2bb885] sm:w-auto"
            >
              Create Automation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {!validation.is_valid && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                Please refine your workflow description based on the suggestions above, then click
                &ldquo;Revalidate&rdquo; to check again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </>
  )
}
