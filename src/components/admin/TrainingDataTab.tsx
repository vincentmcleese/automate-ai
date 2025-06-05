'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Eye, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { TrainingData, SystemPrompt } from '@/types/admin'
import { TrainingDataForm } from './TrainingDataForm'
import { TrainingDataList } from './TrainingDataList'
import { getPromptWithTrainingDataStats } from '@/lib/admin/utils'

interface TrainingDataTabProps {
  systemPrompt: SystemPrompt
  trainingData: TrainingData[]
  onTrainingDataChange: () => void
}

export function TrainingDataTab({
  systemPrompt,
  trainingData,
  onTrainingDataChange,
}: TrainingDataTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFullPrompt, setShowFullPrompt] = useState(false)

  const handleAddDocument = async (data: { title: string; content: string }) => {
    try {
      const response = await fetch(`/api/admin/system-prompts/${systemPrompt.id}/training-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add training data')
      }

      toast.success('Training data added successfully')
      setShowAddForm(false)
      onTrainingDataChange()
    } catch (error) {
      console.error('Error adding training data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add training data')
    }
  }

  const handleRefresh = useCallback(() => {
    onTrainingDataChange()
  }, [onTrainingDataChange])

  const stats = getPromptWithTrainingDataStats(
    systemPrompt.prompt_content,
    trainingData.map(td => ({ title: td.title, content: td.content }))
  )

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#e5e7eb]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-[#6b7280]" />
              <span>Training Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#000000]">{trainingData.length}</div>
            <p className="text-xs text-[#6b7280]">Documents added</p>
          </CardContent>
        </Card>

        <Card className="border-[#e5e7eb]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-[#6b7280]" />
              <span>Total Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#000000]">
              ~{stats.estimatedTokens.toLocaleString()}
            </div>
            <p className="text-xs text-[#6b7280]">Including training data</p>
          </CardContent>
        </Card>

        <Card className="border-[#e5e7eb]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-[#6b7280]" />
              <span>Characters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#000000]">
              {stats.characterCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#6b7280]">Total characters</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#32da94] text-white hover:bg-[#2bc780]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Training Data
          </Button>

          {trainingData.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              className="border-[#e5e7eb]"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showFullPrompt ? 'Hide Full Prompt' : 'View Full Prompt'}
            </Button>
          )}
        </div>

        {trainingData.length > 0 && (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {trainingData.length} document{trainingData.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Add Training Document</CardTitle>
            <CardDescription>
              Add a new training document to enhance this system prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrainingDataForm
              systemPromptId={systemPrompt.id}
              onSubmit={handleAddDocument}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Full Prompt Preview */}
      {showFullPrompt && trainingData.length > 0 && (
        <Card className="border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Complete System Prompt</CardTitle>
            <CardDescription>
              This is how the prompt will appear with all training data included
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-[#f8f9fa] p-4">
              <pre className="font-mono text-sm whitespace-pre-wrap text-[#000000]">
                {stats.combinedPrompt}
              </pre>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[#6b7280]">
              <span>{stats.characterCount.toLocaleString()} characters</span>
              <span>~{stats.estimatedTokens.toLocaleString()} tokens</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Data List */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#000000]">Training Documents</h3>
        <TrainingDataList
          systemPromptId={systemPrompt.id}
          trainingData={trainingData}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}
