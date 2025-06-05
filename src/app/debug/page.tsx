'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface DebugResult {
  supabase: boolean
  systemPrompt: boolean
  openRouterKey: boolean
  openRouterTest: boolean
  testResult?: any
  error?: string
}

export default function DebugPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setError(null)
    setDebugResult(null)

    try {
      const response = await fetch('/api/workflow/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debug_mode: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDebugResult(data.debug || null)
        setError(data.debug?.error || 'Diagnostics failed')
      } else {
        setDebugResult(data.debug)
      }
    } catch (err) {
      console.error('Error running diagnostics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status === undefined) return <div className="h-4 w-4 rounded-full bg-gray-300" />
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#000000]">System Diagnostics</h1>
            <p className="mt-1 text-[#6b7280]">
              Test workflow validation system components to identify issues
            </p>
          </div>

          <Card className="border-[#e5e7eb]">
            <CardHeader>
              <CardTitle>Run Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="bg-[#32da94] text-white hover:bg-[#2bc780]"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  'Run System Diagnostics'
                )}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {debugResult && (
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle>Diagnostic Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Supabase Connection</span>
                    <StatusIcon status={debugResult.supabase} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">System Prompt Retrieval</span>
                    <StatusIcon status={debugResult.systemPrompt} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">OpenRouter API Key</span>
                    <StatusIcon status={debugResult.openRouterKey} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">OpenRouter Test Validation</span>
                    <StatusIcon status={debugResult.openRouterTest} />
                  </div>

                  {debugResult.testResult && (
                    <div className="mt-4 rounded-md bg-green-50 p-3">
                      <h4 className="font-medium text-green-800">Test Validation Result:</h4>
                      <pre className="mt-2 text-sm text-green-700">
                        {JSON.stringify(debugResult.testResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  {debugResult.error && (
                    <div className="mt-4 rounded-md bg-red-50 p-3">
                      <h4 className="font-medium text-red-800">Error Details:</h4>
                      <p className="mt-1 text-sm text-red-700">{debugResult.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#e5e7eb]">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-[#6b7280]">
                <p className="mb-2">This diagnostic tool tests the following components:</p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>
                    <strong>Supabase Connection:</strong> Verifies database connectivity
                  </li>
                  <li>
                    <strong>System Prompt Retrieval:</strong> Checks if workflow validation prompt
                    exists and is active
                  </li>
                  <li>
                    <strong>OpenRouter API Key:</strong> Validates API key configuration
                  </li>
                  <li>
                    <strong>OpenRouter Test Validation:</strong> Performs a test validation call
                  </li>
                </ol>
                <p className="mt-3">
                  Run this test on your production environment to identify which component is
                  failing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
