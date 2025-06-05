'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { TrainingData } from '@/types/admin'

interface TrainingDataFormProps {
  systemPromptId: string
  trainingData?: TrainingData
  onSubmit: (data: { title: string; content: string }) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export function TrainingDataForm({
  systemPromptId: _systemPromptId,
  trainingData,
  onSubmit,
  onCancel,
  isEditing = false,
}: TrainingDataFormProps) {
  const [formData, setFormData] = useState({
    title: trainingData?.title || '',
    content: trainingData?.content || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Content is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: formData.title.trim(),
        content: formData.content.trim(),
      })

      if (!isEditing) {
        // Reset form for new documents
        setFormData({ title: '', content: '' })
      }
    } catch (error) {
      console.error('Error submitting training data:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const estimatedTokens = Math.ceil((formData.title.length + formData.content.length) / 4)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter document title"
          className="border-[#e5e7eb]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Enter document content..."
          className="min-h-[200px] border-[#e5e7eb] font-mono text-sm"
          required
        />
        <div className="flex items-center justify-between text-xs text-[#6b7280]">
          <span>{formData.content.length} characters</span>
          <span>~{estimatedTokens} tokens</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
          className="bg-[#32da94] text-white hover:bg-[#2bc780]"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Document' : 'Add Document'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-[#e5e7eb]">
          Cancel
        </Button>
      </div>
    </form>
  )
}
