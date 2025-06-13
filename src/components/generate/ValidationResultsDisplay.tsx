'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, BarChart, AlertTriangle, Lightbulb } from 'lucide-react'
import { WorkflowValidationResult } from '@/types/admin'
import Image from 'next/image'

interface ValidationResultsDisplayProps {
  results: WorkflowValidationResult
}

export function ValidationResultsDisplay({ results }: ValidationResultsDisplayProps) {
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
              className={`text-2xl font-bold ${results.is_valid ? 'text-brand-primary' : 'text-yellow-600'}`}
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
              <div>
                <p className="text-text-primary font-semibold">{step.description}</p>
                <Badge variant="outline" className="mt-1 font-normal">
                  Tool: {step.default_tool || 'N/A'}
                </Badge>

                {step.available_tools && step.available_tools.length > 0 && (
                  <div className="mt-2">
                    <p className="text-text-secondary mb-2 text-xs font-medium">
                      Recommended Tools:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {step.available_tools.map(tool => (
                        <div
                          key={tool.name}
                          className="flex items-center space-x-2 rounded-full border bg-gray-50 px-2 py-1"
                        >
                          {tool.logo_url && (
                            <Image
                              src={tool.logo_url}
                              alt={`${tool.name} logo`}
                              width={16}
                              height={16}
                              className="h-4 w-4"
                            />
                          )}
                          <span className="text-xs text-gray-700">{tool.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
