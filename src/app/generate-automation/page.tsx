'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Download, Copy, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Automation } from '@/types/admin'
import { Suspense } from 'react'

function GenerateAutomationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workflowDescription = searchParams.get('description') || ''

  const [automation, setAutomation] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'generating' | 'completed' | 'failed'>('generating')
  const [error, setError] = useState<string>('')
  const hasStartedRef = useRef(false)

  const generateAutomation = useCallback(async () => {
    if (hasStartedRef.current) return // Prevent multiple calls
    hasStartedRef.current = true

    try {
      setLoading(true)
      setStatus('generating')
      setProgress(10)

      console.log('Starting automation generation...')

      const response = await fetch('/api/automations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_description: workflowDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate automation')
      }

      const data = await response.json()
      console.log('Automation generation started:', data)

      // Set initial automation data
      setAutomation(data.automation)
      setProgress(30)

      // Start polling for status updates
      console.log('Starting status polling for automation:', data.automation.id)
      await pollForAutomationStatus(data.automation.id)
    } catch (error) {
      console.error('Error generating automation:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setStatus('failed')
      setProgress(0)
      setLoading(false) // Make sure to stop loading on error
      toast.error('Failed to generate automation')
    }
    // Note: Don't set loading to false here - let polling handle it
  }, [workflowDescription])

  // Poll for automation status updates
  const pollForAutomationStatus = async (automationId: string) => {
    const maxAttempts = 60 // Maximum 5 minutes of polling (60 * 5 seconds)
    let attempts = 0

    const poll = async (): Promise<void> => {
      try {
        attempts++
        console.log(`Polling attempt ${attempts} for automation ${automationId}`)

        const statusResponse = await fetch(`/api/automations/${automationId}/status`)
        if (!statusResponse.ok) {
          throw new Error('Failed to check automation status')
        }

        const statusData = await statusResponse.json()
        console.log('Status update:', statusData)

        // Update progress based on status
        if (statusData.status === 'generating') {
          const progressValue = Math.min(30 + attempts * 2, 90) // Gradually increase to 90%
          setProgress(progressValue)
          // Keep loading and generating status
          setLoading(true)
          setStatus('generating')
        } else if (statusData.status === 'completed') {
          setProgress(100)
          setStatus('completed')
          setLoading(false) // Stop loading when completed

          // Fetch the complete automation data
          const automationResponse = await fetch(`/api/automations/${automationId}`)
          if (automationResponse.ok) {
            const automationData = await automationResponse.json()
            setAutomation(automationData)
          }

          toast.success('Automation generated successfully!')
          return // Stop polling
        } else if (statusData.status === 'failed') {
          setStatus('failed')
          setProgress(0)
          setLoading(false) // Stop loading when failed
          setError(statusData.description || 'Generation failed')
          toast.error('Automation generation failed')
          return // Stop polling
        }

        // Continue polling if still generating and haven't exceeded max attempts
        if (statusData.status === 'generating' && attempts < maxAttempts) {
          setTimeout(() => poll(), 5000) // Poll every 5 seconds
        } else if (attempts >= maxAttempts) {
          // Timeout after max attempts
          console.error('Polling timeout after', maxAttempts, 'attempts')
          setStatus('failed')
          setLoading(false) // Stop loading on timeout
          setError('Generation timeout - please try again')
          toast.error('Generation timeout - please try again')
        }
      } catch (error) {
        console.error('Error polling automation status:', error)
        if (attempts < maxAttempts) {
          // Retry after a longer delay on error
          setTimeout(() => poll(), 10000)
        } else {
          setStatus('failed')
          setLoading(false) // Stop loading on error
          setError('Unable to check generation status')
          toast.error('Unable to check generation status')
        }
      }
    }

    // Start polling
    setTimeout(() => poll(), 2000) // Initial delay of 2 seconds
  }

  useEffect(() => {
    if (!workflowDescription) {
      toast.error('No workflow description provided')
      router.push('/')
      return
    }

    // Only run once when component mounts
    if (!hasStartedRef.current) {
      generateAutomation()
    }
  }, [workflowDescription, router, generateAutomation])

  const copyToClipboard = async () => {
    if (!automation?.generated_json) return

    try {
      const jsonString = JSON.stringify(automation.generated_json, null, 2)
      await navigator.clipboard.writeText(jsonString)
      toast.success('JSON copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadJson = () => {
    if (!automation?.generated_json) return

    try {
      const jsonString = JSON.stringify(automation.generated_json, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `automation-${automation.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('JSON downloaded successfully!')
    } catch (error) {
      console.error('Failed to download:', error)
      toast.error('Failed to download JSON')
    }
  }

  const retryGeneration = () => {
    setError('')
    hasStartedRef.current = false // Reset the flag for retry
    generateAutomation()
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#000000]">Generate Automation</h1>
                <p className="text-[#6b7280]">Creating your workflow automation JSON</p>
              </div>
            </div>
            <Badge
              variant={
                status === 'completed'
                  ? 'default'
                  : status === 'failed'
                    ? 'destructive'
                    : 'secondary'
              }
              className={
                status === 'completed'
                  ? 'border-green-200 bg-green-100 text-green-800'
                  : status === 'failed'
                    ? 'border-red-200 bg-red-100 text-red-800'
                    : 'border-blue-200 bg-blue-100 text-blue-800'
              }
            >
              {status === 'generating' && <RefreshCw className="mr-2 h-3 w-3 animate-spin" />}
              {status === 'completed' && <CheckCircle className="mr-2 h-3 w-3" />}
              {status === 'failed' && <XCircle className="mr-2 h-3 w-3" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>

          {/* Input Summary */}
          <Card className="border-[#e5e7eb]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-[#32da94]" />
                <span>Workflow Description</span>
              </CardTitle>
              <CardDescription>
                The workflow description you provided for automation generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-[#f8f9fa] p-4">
                <p className="text-sm whitespace-pre-wrap text-[#000000]">{workflowDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Section */}
          {loading && (
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle>Generating Automation</CardTitle>
                <CardDescription>
                  AI is analyzing your workflow and creating the automation JSON...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="w-full" />
                <div className="flex items-center justify-center space-x-2 text-[#6b7280]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {progress < 30 && 'Initializing automation generation...'}
                    {progress >= 30 && progress < 60 && 'AI is processing your workflow...'}
                    {progress >= 60 && progress < 90 && 'Generating complex JSON structure...'}
                    {progress >= 90 && 'Finalizing automation...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Section */}
          {status === 'failed' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span>Generation Failed</span>
                </CardTitle>
                <CardDescription className="text-red-600">
                  There was an error generating your automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-red-100 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <Button
                  onClick={retryGeneration}
                  className="bg-[#32da94] text-white hover:bg-[#2bc780]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success Section */}
          {status === 'completed' && automation && (
            <>
              {/* Result Summary */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span>Automation Generated Successfully!</span>
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Your workflow automation JSON has been created and saved
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-green-700">
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(automation.created_at).toLocaleString()}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ID: {automation.id.slice(0, 8)}...
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJson}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* JSON Display */}
              <Card className="border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle>Generated Automation JSON</CardTitle>
                  <CardDescription>
                    The complete workflow automation configuration ready for use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto rounded-md bg-[#000000] p-4">
                    <pre className="font-mono text-sm whitespace-pre-wrap text-green-400">
                      {JSON.stringify(automation.generated_json, null, 2)}
                    </pre>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-[#6b7280]">
                      <span className="font-medium">Size:</span>{' '}
                      {JSON.stringify(automation.generated_json).length} characters
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={copyToClipboard}
                        className="border-[#e5e7eb]"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </Button>
                      <Button
                        onClick={downloadJson}
                        className="bg-[#32da94] text-white hover:bg-[#2bc780]"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GenerateAutomationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
          <div className="flex items-center space-x-2 text-[#6b7280]">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <GenerateAutomationContent />
    </Suspense>
  )
}
