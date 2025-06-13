'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot, BrainCircuit, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { type Automation, type Tool } from '@/types/admin'

interface AutomationReportProps {
  automation: Automation & {
    tools: Tool[]
    system_prompts: {
      name: string
      prompt_content: string
      version: number
      system_prompt_training_data: { title: string; content: string }[]
    } | null
  }
}

function constructFullPrompt(automation: AutomationReportProps['automation']): string {
  if (!automation.system_prompts) return 'System prompt not found.'

  let fullPrompt = automation.system_prompts.prompt_content
  fullPrompt = fullPrompt.replace('{{user_input}}', automation.user_input)

  const toolNames = automation.tools?.map(t => t.name).join(', ') || 'None'
  fullPrompt = fullPrompt.replace('{{tools}}', toolNames)

  const trainingData = automation.system_prompts.system_prompt_training_data
  if (trainingData && trainingData.length > 0) {
    const trainingSection = trainingData
      .map(data => `## ${data.title}\n\n${data.content}`)
      .join('\n\n')
    fullPrompt += `\n\n${trainingSection}`
  }

  return fullPrompt
}

export function AutomationReport({ automation }: AutomationReportProps) {
  const fullPrompt = constructFullPrompt(automation)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <Button variant="ghost" asChild>
            <Link href={`/automations/${automation.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Automation
            </Link>
          </Button>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">Automation Report</h1>
            <p className="text-muted-foreground">
              {`A detailed look into the generation process for "${automation.title}"`}
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>User Input & Selections</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Original Prompt</h3>
                <p className="text-muted-foreground mt-2 rounded-md border bg-gray-50 p-4">
                  {automation.user_input}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Selected Tools</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {automation.tools.length > 0 ? (
                    automation.tools.map(tool => (
                      <Badge key={tool.id} variant="secondary">
                        {tool.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No specific tools were selected.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span>AI Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>System Prompt Used:</strong> {automation.system_prompts?.name || 'N/A'}
              </p>
              <p>
                <strong>Prompt Version:</strong> {automation.system_prompts?.version || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Full Prompt Sent to AI</span>
              </CardTitle>
              <CardDescription>
                This is the complete text, including training data, that was used to generate the
                workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => copyToClipboard(fullPrompt)}
                >
                  <span className="sr-only">Copy</span>
                  <BrainCircuit className="h-4 w-4" />
                </Button>
                <pre className="max-h-[600px] overflow-auto rounded-md bg-gray-900 p-4 font-mono text-sm text-green-400">
                  {fullPrompt}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
