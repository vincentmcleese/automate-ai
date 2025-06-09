'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface AddToolModalProps {
  isOpen: boolean
  onClose: () => void
  onToolAdded: (newTool: { id: string; name: string; logo_url?: string }) => void
  categoryId: string
}

export function AddToolModal({ isOpen, onClose, onToolAdded, categoryId }: AddToolModalProps) {
  const [toolName, setToolName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddTool = async () => {
    if (!toolName.trim()) {
      toast.error('Tool name cannot be empty')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/tools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, category_id: categoryId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add tool')
      }

      toast.success(`Tool "${toolName}" added successfully!`)
      onToolAdded(result)
      setToolName('')
      onClose()
    } catch (error) {
      console.error('Error adding tool:', error)
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Tool</DialogTitle>
          <DialogDescription>
            Enter the name of the new tool you want to add to this category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="e.g., Google Sheets"
            value={toolName}
            onChange={e => setToolName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAddTool} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Tool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
