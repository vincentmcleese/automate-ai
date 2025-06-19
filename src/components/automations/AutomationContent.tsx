'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Download, Info, Share2 } from 'lucide-react'
import Link from 'next/link'
import { Automation, Tool } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormattedDate } from './FormattedDate'
import { LeaderboardCreatorCard } from './LeaderboardCreatorCard'
import Image from 'next/image'
import { toast } from 'sonner'
import { AnimatedLoading } from '../generate/AnimatedLoading'
import { SetupGuide } from '../SetupGuide'

export function AutomationContent({ automationId }: { automationId: string }) {
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)

  const getProgressWidth = (status: string) => {
    switch (status) {
      case 'generating_workflow':
        return '50%'
      case 'generating_guide':
        return '75%'
      case 'completed':
        return '100%'
      default:
        return '25%'
    }
  }

  const downloadJson = () => {
    if (!automation?.generated_json) return
    const jsonString = JSON.stringify(automation.generated_json, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `automation-${automation?.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('JSON downloaded successfully!')
  }

  // Polling logic
  useEffect(() => {
    let isMounted = true

    if (!automation || automation.status === 'completed' || automation.status === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      if (!isMounted) return

      try {
        const response = await fetch(`/api/automations/${automation.id}/status`)
        const data = await response.json()

        if (!isMounted) return

        if (data.status === 'completed' || data.status === 'failed') {
          // Fetch the full details one last time and stop polling
          const finalResponse = await fetch(`/api/automations/${automation.id}/details`)
          const finalData = await finalResponse.json()
          setAutomation(finalData)
          clearInterval(interval)
        } else if (data.status !== automation.status) {
          // Status changed but not completed - update the automation to show new status
          setAutomation(prev => (prev ? { ...prev, status: data.status } : prev))
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [automation])

  useEffect(() => {
    const fetchAutomationDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/automations/${automationId}/details`)
        if (!response.ok) {
          throw new Error('Failed to fetch automation details')
        }
        const data: Automation = await response.json()
        setAutomation(data)
      } catch (error) {
        toast.error('Failed to load automation. It may have been deleted or an error occurred.')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchAutomationDetails()
  }, [automationId])

  if (loading) {
    // This is a minimal loading state, as the page shell has a Suspense fallback
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!automation) {
    return <div className="p-8 text-center text-red-500">Automation not found.</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <header className="space-y-4">
            {/* Desktop: Normal layout */}
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <Button variant="ghost" asChild className="text-sm text-gray-600">
                <Link href="/automations">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Automations
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={downloadJson}
                  disabled={!automation.generated_json}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                <Button asChild variant="outline" className="text-sm">
                  <Link
                    href="https://www.ghostteam.ai/begin?utm_source=automation"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Help me implement
                  </Link>
                </Button>
                <Button variant="outline" className="text-sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Mobile: Back button only */}
            <div className="sm:hidden">
              <Button variant="ghost" asChild className="w-fit text-sm text-gray-600">
                <Link href="/automations">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Automations
                </Link>
              </Button>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900 sm:text-3xl">{automation.title}</h1>
            </div>

            {/* Mobile: Action buttons under title */}
            <div className="flex flex-col space-y-2 sm:hidden">
              <Button
                variant="outline"
                className="text-sm"
                onClick={downloadJson}
                disabled={automation.status !== 'completed'}
              >
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
              <Button asChild variant="outline" className="text-sm">
                <Link
                  href="https://www.ghostteam.ai/begin?utm_source=automation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Help me implement
                </Link>
              </Button>
              <Button variant="outline" className="text-sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <main className="space-y-8 lg:col-span-2">
              {/* Status & Metadata Section */}
              <Card className="border">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {automation.description && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-sm text-gray-800">{automation.description}</p>
                    </div>
                  )}
                  {automation.user_input && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">User Prompt</p>
                      <p className="text-sm text-gray-800">{automation.user_input}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Created</p>
                        <p className="text-sm text-gray-800">
                          <FormattedDate dateString={automation.created_at} />
                        </p>
                      </div>
                    </div>
                    {automation.complexity && automation.estimated_time_hours && (
                      <div className="flex items-center space-x-3">
                        <Info className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Complexity</p>
                          <p className="text-sm text-gray-800 capitalize">
                            {automation.complexity} ({automation.estimated_time_hours} hours)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {automation.tools && automation.tools.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="mb-2 text-sm font-medium text-gray-600">Tools Used</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {automation.tools.map(
                          (tool: Tool) =>
                            tool && (
                              <div
                                key={tool.id}
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
                            )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Setup Guide Section */}
              <div>
                {automation.status === 'failed' ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center space-y-4 p-6 text-center text-gray-600">
                      <div className="w-full text-left">
                        <p className="font-semibold text-red-500">Automation Failed</p>
                        {automation.error_message && (
                          <pre className="text-muted-foreground mt-2 rounded-md bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap">
                            {automation.error_message}
                          </pre>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : automation.status === 'completed' ? (
                  <SetupGuide
                    automationGuide={automation.automation_guide || null}
                    automationId={automation.id}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center space-y-6 p-6 text-center text-gray-600">
                      {/* Progress Steps */}
                      <div className="w-full max-w-md space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div
                            className={`flex items-center space-x-2 ${
                              ['generating_workflow', 'generating_guide', 'completed'].includes(
                                automation.status
                              )
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                ['generating_workflow', 'generating_guide', 'completed'].includes(
                                  automation.status
                                )
                                  ? 'bg-green-600'
                                  : 'bg-gray-300'
                              }`}
                            />
                            <span>Crafting automation</span>
                          </div>
                          <div
                            className={`flex items-center space-x-2 ${
                              ['generating_guide', 'completed'].includes(automation.status)
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                ['generating_guide', 'completed'].includes(automation.status)
                                  ? 'bg-green-600'
                                  : 'bg-gray-300'
                              }`}
                            />
                            <span>Compiling guide</span>
                          </div>
                        </div>
                        <div className="h-1 w-full rounded-full bg-gray-200">
                          <div
                            className="h-1 rounded-full bg-green-600 transition-all duration-500"
                            style={{ width: getProgressWidth(automation.status) }}
                          />
                        </div>
                      </div>

                      {/* Loading Message */}
                      {automation.status === 'generating_workflow' && (
                        <AnimatedLoading text="🤖 Crafting your automation..." />
                      )}
                      {automation.status === 'generating_guide' && (
                        <AnimatedLoading text="📚 Compiling setup guide..." />
                      )}
                      {!automation.status.includes('generating') && (
                        <AnimatedLoading text="Getting started..." />
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </main>
            {/* Sidebar */}
            <aside className="space-y-8 lg:col-span-1">
              <div className="sticky top-24">
                <LeaderboardCreatorCard
                  name={automation.user_name || 'Community Member'}
                  avatarUrl={automation.user_avatar_url || null}
                  rank={automation.creator_rank || null}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
