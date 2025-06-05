'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Eye, Zap, Upload } from 'lucide-react'
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
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleBulkUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const file of Array.from(files)) {
        try {
          // Check if file is JSON
          if (!file.name.toLowerCase().endsWith('.json')) {
            console.warn(`Skipping non-JSON file: ${file.name}`)
            errorCount++
            continue
          }

          // Read file content
          const content = await readFileAsText(file)

          // Validate JSON
          let formattedContent: string
          try {
            const parsed = JSON.parse(content)
            formattedContent = JSON.stringify(parsed, null, 2)
          } catch (jsonError) {
            console.error(`Invalid JSON in file ${file.name}:`, jsonError)
            errorCount++
            continue
          }

          // Extract title from filename (remove .json extension)
          const title = file.name.replace(/\.json$/i, '')

          // Add training data
          const response = await fetch(
            `/api/admin/system-prompts/${systemPrompt.id}/training-data`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title,
                content: formattedContent,
              }),
            }
          )

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to add training data')
          }

          successCount++
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          errorCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(
          `Successfully uploaded ${successCount} JSON file${successCount !== 1 ? 's' : ''}`
        )
        onTrainingDataChange()
      }

      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} file${errorCount !== 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error('Error during bulk upload:', error)
      toast.error('Failed to process files')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = e => reject(e.target?.error)
      reader.readAsText(file)
    })
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
      {/* Hidden file input for bulk upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

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

          <Button
            onClick={handleBulkUpload}
            disabled={uploading}
            variant="outline"
            className="border-[#e5e7eb]"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Bulk Upload JSONs'}
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
