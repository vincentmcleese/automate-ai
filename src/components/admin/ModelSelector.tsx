'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Info, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { OpenRouterModel } from '@/types/admin'

interface ModelSelectorProps {
  value?: string
  onValueChange: (modelId: string | undefined) => void
  disabled?: boolean
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadModels = async (sync = false) => {
    try {
      if (sync) setSyncing(true)
      else setLoading(true)

      const response = await fetch(`/api/admin/models?active=true${sync ? '&sync=true' : ''}`)

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      const data = await response.json()
      setModels(data.models || [])

      if (sync) {
        toast.success('Models synced successfully')
      }
    } catch (error) {
      console.error('Error loading models:', error)
      toast.error('Failed to load models')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  const handleSync = () => {
    loadModels(true)
  }

  const selectedModel = models.find(model => model.id === value)

  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === null) return 'N/A'
    return `$${cost.toFixed(4)}`
  }

  // Handle value change with proper conversion
  const handleValueChange = (newValue: string) => {
    if (newValue === '__none__') {
      onValueChange(undefined)
    } else {
      onValueChange(newValue)
    }
  }

  // Convert undefined/null to special value for Select component
  const selectValue = value || '__none__'

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Model</Label>
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-[#6b7280]" />
          <span className="text-sm text-[#6b7280]">Loading models...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="model">Model</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={syncing || disabled}
          className="h-auto p-1 text-xs"
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Models'}
        </Button>
      </div>

      <Select value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className="border-[#e5e7eb]">
          <SelectValue placeholder="Select a model (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <div>
              <div className="font-medium">No Model Selected</div>
              <div className="text-sm text-[#6b7280]">Use system default</div>
            </div>
          </SelectItem>
          {models.map(model => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex w-full items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{model.name}</div>
                  <div className="max-w-[300px] truncate text-sm text-[#6b7280]">
                    {model.description || model.id}
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {model.context_length && (
                    <Badge variant="secondary" className="text-xs">
                      {model.context_length.toLocaleString()} ctx
                    </Badge>
                  )}
                  {(model.pricing_prompt || model.pricing_completion) && (
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="mr-1 h-3 w-3" />
                      {formatCost(model.pricing_prompt)}/{formatCost(model.pricing_completion)}
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedModel && (
        <div className="rounded-md bg-[#f8f9fa] p-3 text-sm">
          <div className="mb-2 flex items-center space-x-2">
            <Info className="h-4 w-4 text-[#6b7280]" />
            <span className="font-medium">Selected Model Details</span>
          </div>
          <div className="space-y-1 text-[#6b7280]">
            <div>
              <strong>ID:</strong> {selectedModel.id}
            </div>
            {selectedModel.context_length && (
              <div>
                <strong>Context Length:</strong> {selectedModel.context_length.toLocaleString()}{' '}
                tokens
              </div>
            )}
            {(selectedModel.pricing_prompt || selectedModel.pricing_completion) && (
              <div>
                <strong>Pricing:</strong> Prompt: {formatCost(selectedModel.pricing_prompt)}/1k,
                Completion: {formatCost(selectedModel.pricing_completion)}/1k
              </div>
            )}
            <div className="mt-2 flex items-center space-x-4">
              {selectedModel.supports_function_calling && (
                <Badge variant="secondary" className="text-xs">
                  Function Calling
                </Badge>
              )}
              {selectedModel.supports_streaming && (
                <Badge variant="secondary" className="text-xs">
                  Streaming
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-[#6b7280]">
        Choose which OpenRouter model to use for this prompt. Leave empty to use the system default.
      </p>
    </div>
  )
}
