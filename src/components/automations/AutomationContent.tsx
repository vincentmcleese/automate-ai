'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Zap, User, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AutomationJsonDisplay } from '@/components/AutomationJsonDisplay'
import { Automation } from '@/types/admin'

// Interface for the updated automation data from the status endpoint
interface AutomationUpdate {
  status: 'pending' | 'generating' | 'completed' | 'failed'
  generated_json: Record<string, unknown>
  error_message?: string | null
  updated_at: string
  title?: string | null
  description?: string | null
}

export function AutomationContent({ initialAutomation }: { initialAutomation: Automation }) {
  const [automation, setAutomation] = useState<Automation>(initialAutomation)

  useEffect(() => {
    // Only poll if the automation is in a processing state
    if (automation.status === 'generating' || automation.status === 'pending') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/automations/${automation.id}/status`)
          if (!response.ok) {
            clearInterval(interval)
            return
          }
          const data: AutomationUpdate = await response.json()

          // If status has changed, update the state and stop polling
          if (data.status !== 'generating' && data.status !== 'pending') {
            setAutomation(prev => ({ ...prev, ...data }))
            clearInterval(interval)
          } else {
            // Otherwise, just update the updated_at to show it's still alive
            setAutomation(prev => ({ ...prev, updated_at: data.updated_at }))
          }
        } catch (error) {
          console.error('Failed to fetch automation status:', error)
          clearInterval(interval)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [automation.status, automation.id])

  const displayTitle =
    automation.title ||
    automation.user_input.slice(0, 60) + (automation.user_input.length > 60 ? '...' : '')

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild>
                <Link href="/automations" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Automations</span>
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  disabled
                  variant="outline"
                  className="flex cursor-not-allowed items-center space-x-2 border-purple-300 bg-gradient-to-r from-purple-100 to-blue-100 font-semibold text-purple-700 opacity-80 hover:from-purple-100 hover:to-blue-100"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Guide (coming soon)</span>
                </Button>
                <Button
                  asChild
                  className="bg-black text-white hover:bg-gray-800"
                  title="book a call with an AI automation expert"
                >
                  <Link
                    href="https://www.ghostteam.ai/begin?utm_source=automation"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Help me implement
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#000000]">{displayTitle}</h1>
              <p className="text-[#6b7280]">Automation Details</p>
            </div>
          </div>

          {/* Automation Metadata */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-[#32da94]" />
                  <span>Automation Details</span>
                </CardTitle>
                <CardDescription>Basic information about this automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-[#6b7280]" />
                    <span className="font-medium text-[#6b7280]">Created:</span>
                    <span className="text-[#000000]">
                      {new Date(automation.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-[#6b7280]" />
                    <span className="font-medium text-[#6b7280]">ID:</span>
                    <span className="font-mono text-[#000000]">{automation.id}</span>
                  </div>
                  {automation.description && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-[#6b7280]">Description:</span>
                      <p className="text-sm text-[#000000]">{automation.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Info */}
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-[#32da94]" />
                  <span>Status Information</span>
                </CardTitle>
                <CardDescription>Current status and processing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6b7280]">Status:</span>
                    <Badge
                      variant={
                        automation.status === 'completed'
                          ? 'default'
                          : automation.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className={
                        automation.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : automation.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-[#6b7280]">Last Updated:</span>
                    <span className="text-[#000000]">
                      {new Date(automation.updated_at).toLocaleString()}
                    </span>
                  </div>
                  {automation.generated_json && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-[#6b7280]">JSON Size:</span>
                      <span className="text-[#000000]">
                        {JSON.stringify(automation.generated_json).length} characters
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Original User Prompt */}
          <Card className="border-[#e5e7eb]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-[#32da94]" />
                <span>Original Workflow Description</span>
              </CardTitle>
              <CardDescription>
                The workflow description provided by the user for automation generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-[#f8f9fa] p-4">
                <p className="text-sm whitespace-pre-wrap text-[#000000]">
                  {automation.user_input}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* JSON Display - Only show if automation is completed */}
          {automation.status === 'completed' && automation.generated_json && (
            <AutomationJsonDisplay automation={automation} showSuccessCard={false} />
          )}

          {/* Failed State */}
          {automation.status === 'failed' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Generation Failed</CardTitle>
                <CardDescription className="text-red-600">
                  This automation failed to generate successfully.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-semibold text-red-800">Reason:</p>
                <div className="rounded-md bg-red-100 p-3">
                  <p className="font-mono text-xs text-red-900">
                    {automation.error_message || 'No specific error message was provided.'}
                  </p>
                </div>
                <p className="pt-2 text-sm text-red-700">
                  You may want to try creating a new automation with a refined description.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generating State */}
          {(automation.status === 'generating' || automation.status === 'pending') && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-800"></div>
                  Still Generating
                </CardTitle>
                <CardDescription className="text-blue-600">
                  This automation is still being processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  The AI is currently building the workflow. This page will automatically update
                  when it&apos;s complete. Please check back in a few moments.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
