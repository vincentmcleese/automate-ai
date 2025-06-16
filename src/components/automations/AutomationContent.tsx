'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Download, Info, Share2, Copy } from 'lucide-react'
import Link from 'next/link'
import { Automation, Tool } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormattedDate } from './FormattedDate'
import { LeaderboardCreatorCard } from './LeaderboardCreatorCard'
import Image from 'next/image'
import { toast } from 'sonner'
import { AnimatedLoading } from '../generate/AnimatedLoading'

export function AutomationContent({ automationId }: { automationId: string }) {
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)

  const getCleanJson = () => {
    if (!automation?.generated_json) return ''
    let rawContent = ''
    if (typeof automation.generated_json === 'string') {
      rawContent = automation.generated_json
    } else {
      return JSON.stringify(automation.generated_json, null, 2)
    }

    try {
      const jsonRegex = /```(json)?\s*([\s\S]*?)\s*```/
      const match = rawContent.match(jsonRegex)

      let jsonString = rawContent.trim()
      if (match && match[2]) {
        jsonString = match[2]
      } else {
        const firstBrace = jsonString.indexOf('{')
        const lastBrace = jsonString.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1)
        }
      }
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return rawContent // Fallback to raw content if parsing fails
    }
  }

  const copyJson = () => {
    const jsonString = getCleanJson()
    if (!jsonString) return
    navigator.clipboard.writeText(jsonString)
    toast.success('Content copied to clipboard!')
  }

  const downloadJson = () => {
    const content = getCleanJson()
    if (!content) return
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `automation-${automation?.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

              {/* Workflow Steps Section */}
              <div>
                <h2 className="mb-4 flex items-center space-x-2 text-lg font-semibold text-gray-800">
                  <Copy className="h-5 w-5" />
                  <span>Generated Workflow</span>
                </h2>

                {automation.status === 'completed' && automation.generated_json ? (
                  <div className="space-y-4">
                    <div className="max-h-[500px] overflow-auto rounded-md bg-gray-900 p-4 font-mono text-sm text-green-400">
                      <pre>{getCleanJson()}</pre>
                    </div>
                    <Button onClick={copyJson} variant="outline" className="w-full sm:w-auto">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Content
                    </Button>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center space-y-4 p-6 text-center text-gray-600">
                      {automation.status === 'failed' ? (
                        <div className="w-full text-left">
                          <p className="font-semibold text-red-500">Automation Failed</p>
                          {automation.error_message && (
                            <pre className="text-muted-foreground mt-2 rounded-md bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap">
                              {automation.error_message}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <AnimatedLoading text="Generating automation..." />
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
