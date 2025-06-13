'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, BarChart, AlertTriangle, Lightbulb } from 'lucide-react'
import { WorkflowValidationResult, WorkflowStep } from '@/types/admin'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ValidationResultsDisplayProps {
  results: WorkflowValidationResult
  selectedTools: Record<number, string>
  onToolSelect: (stepNumber: number, tool: string) => void
}

export function ValidationResultsDisplay({
  results,
  selectedTools,
  onToolSelect,
}: ValidationResultsDisplayProps) {
  const isChangeable = (step: WorkflowStep) => {
    return (
      step.tool_category &&
      !['Code', 'HTTPRequest', 'Custom Integration'].includes(step.tool_category)
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Validation Status</CardTitle>
            {results.is_valid ? (
              <CheckCircle className="text-brand-primary h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                results.is_valid ? 'text-brand-primary' : 'text-yellow-600'
              }`}
            >
              {results.is_valid ? 'Looks Good!' : 'Needs Improvement'}
            </div>
            <p className="text-text-secondary text-xs">Our AI has analyzed your prompt.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complexity</CardTitle>
            <BarChart className="text-text-secondary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{results.complexity}</div>
            <p className="text-text-secondary text-xs">
              {results.estimated_time_hours} hours estimated setup
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Step-by-Step Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.steps.map(step => (
            <div key={step.step_number} className="flex items-start space-x-4">
              <div className="bg-brand-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white">
                {step.step_number}
              </div>
              <div className="flex-1">
                <p className="text-text-primary font-semibold">{step.description}</p>
                <div className="mt-2">
                  {isChangeable(step) && step.available_tools ? (
                    <Select
                      onValueChange={value => onToolSelect(step.step_number, value)}
                      value={selectedTools[step.step_number] || 'none'}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select a tool..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No tool required</SelectItem>
                        {step.available_tools.map(tool => (
                          <SelectItem key={tool.name} value={tool.name}>
                            {tool.name}
                          </SelectItem>
                        ))}
                        {/* Option to add a new tool can be added here later */}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{step.default_tool || 'N/A'}</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {results.suggestions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-800">Suggestions for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-yellow-700">
              {results.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
