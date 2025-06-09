import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Zap, User, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AutomationJsonDisplay } from '@/components/AutomationJsonDisplay'
import { createClient } from '@/lib/supabase/server'
import { Automation } from '@/types/admin'

interface AutomationPageProps {
  params: Promise<{
    id: string
  }>
}

async function getAutomation(id: string): Promise<Automation | null> {
  try {
    const supabase = await createClient()

    const { data: automation, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching automation:', error)
      return null
    }

    return automation
  } catch (error) {
    console.error('Error in getAutomation:', error)
    return null
  }
}

async function AutomationContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const automation = await getAutomation(id)

  if (!automation) {
    notFound()
  }

  // Get display title - use title if available, otherwise extract from user_input
  const displayTitle =
    automation.title ||
    automation.user_input.slice(0, 60) + (automation.user_input.length > 60 ? '...' : '')

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/automations" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Automations</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#000000]">{displayTitle}</h1>
                <p className="text-[#6b7280]">Automation Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                disabled
                variant="outline"
                className="flex cursor-not-allowed items-center space-x-2 border-purple-300 bg-gradient-to-r from-purple-100 to-blue-100 font-semibold text-purple-700 opacity-80 hover:from-purple-100 hover:to-blue-100"
              >
                <BookOpen className="h-4 w-4" />
                <span>Guide (coming soon)</span>
              </Button>
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
                    ? 'border-green-200 bg-green-100 text-green-800'
                    : automation.status === 'failed'
                      ? 'border-red-200 bg-red-100 text-red-800'
                      : 'border-blue-200 bg-blue-100 text-blue-800'
                }
              >
                {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
              </Badge>
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
                  This automation failed to generate successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">
                  The automation generation process encountered an error. You may want to try
                  creating a new automation with a refined description.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generating State */}
          {automation.status === 'generating' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Still Generating</CardTitle>
                <CardDescription className="text-blue-600">
                  This automation is still being processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  The automation generation is still in progress. Please check back later or refresh
                  the page to see if it has completed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AutomationPage({ params }: AutomationPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
          <div className="flex items-center space-x-2 text-[#6b7280]">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#32da94]"></div>
            <span>Loading automation...</span>
          </div>
        </div>
      }
    >
      <AutomationContent params={params} />
    </Suspense>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AutomationPageProps) {
  const { id } = await params
  const automation = await getAutomation(id)

  if (!automation) {
    return {
      title: 'Automation Not Found',
      description: 'The requested automation could not be found.',
    }
  }

  const title =
    automation.title ||
    automation.user_input.slice(0, 60) + (automation.user_input.length > 60 ? '...' : '')

  return {
    title: `${title} | AutomateAI`,
    description:
      automation.description ||
      automation.user_input.slice(0, 160) + (automation.user_input.length > 160 ? '...' : ''),
  }
}
