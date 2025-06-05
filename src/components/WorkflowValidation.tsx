'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WorkflowValidationResult } from '@/types/admin'
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
} from 'lucide-react'

interface WorkflowValidationProps {
  validation: WorkflowValidationResult
  workflowDescription: string
  isRevalidating: boolean
  onRevalidate: () => void
  onCreateAutomation: () => void
}

export function WorkflowValidation({
  validation,
  workflowDescription: _workflowDescription,
  isRevalidating,
  onRevalidate,
  onCreateAutomation,
}: WorkflowValidationProps) {
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

  return (
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
              {validation.is_valid ? 'Workflow Can Be Automated' : 'Workflow Needs Refinement'}
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
          {validation.estimated_time > 0 && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-[#6b7280]" />
              <span className="text-sm text-[#6b7280]">
                Est. setup time: {validation.estimated_time}h
              </span>
            </div>
          )}
        </div>

        {/* Triggers */}
        {validation.triggers && validation.triggers.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center font-semibold text-[#000000]">
              <Zap className="mr-2 h-4 w-4 text-[#32da94]" />
              Identified Triggers
            </h4>
            <div className="flex flex-wrap gap-2">
              {validation.triggers.map((trigger, index) => (
                <Badge key={index} variant="outline" className="border-[#32da94] text-[#32da94]">
                  {trigger}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Processes */}
        {validation.processes && validation.processes.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center font-semibold text-[#000000]">
              <Settings className="mr-2 h-4 w-4 text-[#32da94]" />
              Identified Processes
            </h4>
            <div className="flex flex-wrap gap-2">
              {validation.processes.map((process, index) => (
                <Badge key={index} variant="outline" className="border-blue-500 text-blue-700">
                  {process}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tools Needed */}
        {validation.tools_needed && validation.tools_needed.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center font-semibold text-[#000000]">
              <Settings className="mr-2 h-4 w-4 text-[#6b7280]" />
              Tools & Integrations Required
            </h4>
            <div className="flex flex-wrap gap-2">
              {validation.tools_needed.map((tool, index) => (
                <Badge key={index} variant="secondary" className="bg-gray-100">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {validation.suggestions && validation.suggestions.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center font-semibold text-[#000000]">
              <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
              Suggestions for Improvement
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
            onClick={onCreateAutomation}
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
  )
}
