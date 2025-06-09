'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, CheckCircle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Automation } from '@/types/admin'

interface AutomationJsonDisplayProps {
  automation: Automation
  showSuccessCard?: boolean
}

export function AutomationJsonDisplay({
  automation,
  showSuccessCard = true,
}: AutomationJsonDisplayProps) {
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

  return (
    <div className="space-y-6">
      {/* Success Summary Card */}
      {showSuccessCard && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>Automation Ready</span>
            </CardTitle>
            <CardDescription className="text-green-600">
              Your workflow automation JSON has been generated and is ready for use
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
                <Button
                  disabled
                  variant="outline"
                  size="sm"
                  className="cursor-not-allowed border-purple-300 bg-gradient-to-r from-purple-100 to-blue-100 font-semibold text-purple-700 opacity-80 hover:from-purple-100 hover:to-blue-100"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Guide (coming soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Button variant="outline" onClick={copyToClipboard} className="border-[#e5e7eb]">
                <Copy className="mr-2 h-4 w-4" />
                Copy JSON
              </Button>
              <Button onClick={downloadJson} className="bg-[#32da94] text-white hover:bg-[#2bc780]">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                disabled
                variant="outline"
                className="cursor-not-allowed border-purple-300 bg-gradient-to-r from-purple-100 to-blue-100 font-semibold text-purple-700 opacity-80 hover:from-purple-100 hover:to-blue-100"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Guide (coming soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
