'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Edit, Trash2, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { TrainingData } from '@/types/admin'
import { TrainingDataForm } from './TrainingDataForm'

interface TrainingDataListProps {
  systemPromptId: string
  trainingData: TrainingData[]
  onRefresh: () => void
}

export function TrainingDataList({
  systemPromptId,
  trainingData,
  onRefresh,
}: TrainingDataListProps) {
  const [editingDocument, setEditingDocument] = useState<TrainingData | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    documentId: string
    documentTitle: string
  }>({
    open: false,
    documentId: '',
    documentTitle: '',
  })

  const handleEdit = (document: TrainingData) => {
    setEditingDocument(document)
  }

  const handleCancelEdit = () => {
    setEditingDocument(null)
  }

  const handleUpdate = async (data: { title: string; content: string }) => {
    if (!editingDocument) return

    try {
      const response = await fetch(
        `/api/admin/system-prompts/${systemPromptId}/training-data/${editingDocument.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update training data')
      }

      toast.success('Training data updated successfully')
      setEditingDocument(null)
      onRefresh()
    } catch (error) {
      console.error('Error updating training data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update training data')
    }
  }

  const handleDeleteClick = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      open: true,
      documentId,
      documentTitle,
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `/api/admin/system-prompts/${systemPromptId}/training-data/${deleteDialog.documentId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete training data')
      }

      toast.success('Training data deleted successfully')
      onRefresh()
    } catch (error) {
      console.error('Error deleting training data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete training data')
    } finally {
      setDeleteDialog({ open: false, documentId: '', documentTitle: '' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTokenEstimate = (content: string) => {
    return Math.ceil(content.length / 4)
  }

  if (trainingData.length === 0) {
    return (
      <div className="py-8 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-[#6b7280]" />
        <p className="text-[#6b7280]">No training data documents found</p>
        <p className="text-sm text-[#6b7280]">Add your first document to enhance this prompt</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {trainingData.map(document => (
        <Card key={document.id} className="border-[#e5e7eb]">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{document.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-[#6b7280]">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(document.created_at)}</span>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    ~{getTokenEstimate(document.content)} tokens
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(document)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(document.id, document.title)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {editingDocument?.id === document.id ? (
            <CardContent>
              <TrainingDataForm
                systemPromptId={systemPromptId}
                trainingData={editingDocument}
                onSubmit={handleUpdate}
                onCancel={handleCancelEdit}
                isEditing
              />
            </CardContent>
          ) : (
            <CardContent className="pt-0">
              <div className="rounded-md bg-[#f8f9fa] p-3">
                <pre className="font-mono text-sm whitespace-pre-wrap text-[#000000]">
                  {document.content}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={open => {
          if (!open) {
            setDeleteDialog({ open: false, documentId: '', documentTitle: '' })
          }
        }}
        title="Delete Training Data"
        description={`Are you sure you want to delete the document "${deleteDialog.documentTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
