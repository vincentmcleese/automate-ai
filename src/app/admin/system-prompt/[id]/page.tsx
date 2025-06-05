'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, RefreshCw, History } from 'lucide-react'
import { toast } from 'sonner'
import { SystemPrompt, PromptCategory } from '@/types/admin'

interface SystemPromptEditPageProps {
  params: Promise<{ id: string }>
}

export default function SystemPromptEditPage({ params }: SystemPromptEditPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [promptId, setPromptId] = useState<string>('')
  const [originalPrompt, setOriginalPrompt] = useState<SystemPrompt | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as PromptCategory,
    prompt_content: '',
    variables: '{}',
    is_active: true,
  })

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        const resolvedParams = await params
        setPromptId(resolvedParams.id)

        const response = await fetch(`/api/admin/system-prompts/${resolvedParams.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('System prompt not found')
            router.push('/admin')
            return
          }
          throw new Error('Failed to load system prompt')
        }

        const data = await response.json()
        const prompt = data.prompt

        setOriginalPrompt(prompt)
        setFormData({
          name: prompt.name,
          description: prompt.description || '',
          category: prompt.category,
          prompt_content: prompt.prompt_content,
          variables: JSON.stringify(prompt.variables, null, 2),
          is_active: prompt.is_active,
        })
      } catch (error) {
        console.error('Error loading prompt:', error)
        toast.error('Failed to load system prompt')
        router.push('/admin')
      } finally {
        setLoading(false)
      }
    }

    loadPrompt()
  }, [params, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate variables JSON
      let parsedVariables
      try {
        parsedVariables = JSON.parse(formData.variables)
      } catch {
        toast.error('Invalid JSON in variables field')
        return
      }

      // Check if there are any changes
      const hasChanges =
        formData.name !== originalPrompt?.name ||
        formData.description !== (originalPrompt?.description || '') ||
        formData.category !== originalPrompt?.category ||
        formData.prompt_content !== originalPrompt?.prompt_content ||
        JSON.stringify(parsedVariables) !== JSON.stringify(originalPrompt?.variables) ||
        formData.is_active !== originalPrompt?.is_active

      if (!hasChanges) {
        toast.info('No changes detected')
        return
      }

      const response = await fetch(`/api/admin/system-prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          prompt_content: formData.prompt_content,
          variables: parsedVariables,
          is_active: formData.is_active,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update system prompt')
      }

      const result = await response.json()

      if (result.version_created) {
        toast.success(`System prompt updated successfully! New version: v${result.prompt.version}`)
      } else {
        toast.success('System prompt updated successfully!')
      }

      router.push('/admin')
    } catch (error) {
      console.error('Error saving prompt:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save system prompt')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryDescription = (category: PromptCategory) => {
    switch (category) {
      case 'validation':
        return 'Used for validating and analyzing workflow descriptions'
      case 'json_generation':
        return 'Used for generating structured JSON from validated workflows'
      case 'workflow_analysis':
        return 'Used for analyzing workflow complexity and requirements'
      case 'custom':
        return 'Custom prompt for specialized use cases'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-[#32da94]" />
            <span className="ml-3 text-[#6b7280]">Loading system prompt...</span>
          </div>
        </div>
      </div>
    )
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
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#000000]">Edit System Prompt</h1>
                <p className="text-[#6b7280]">
                  {originalPrompt && (
                    <>
                      Current version: <Badge variant="secondary">v{originalPrompt.version}</Badge>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-[#e5e7eb]">
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#32da94] text-white hover:bg-[#2bc780]"
              >
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Form */}
          <Card className="border-[#e5e7eb]">
            <CardHeader>
              <CardTitle>Prompt Details</CardTitle>
              <CardDescription>
                Edit the system prompt details. Significant changes will create a new version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Enter prompt name"
                  className="border-[#e5e7eb]"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder="Enter prompt description (optional)"
                  className="border-[#e5e7eb]"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: PromptCategory) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="border-[#e5e7eb]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="validation">
                      <div>
                        <div className="font-medium">Validation</div>
                        <div className="text-sm text-[#6b7280]">
                          {getCategoryDescription('validation')}
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="json_generation">
                      <div>
                        <div className="font-medium">JSON Generation</div>
                        <div className="text-sm text-[#6b7280]">
                          {getCategoryDescription('json_generation')}
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="workflow_analysis">
                      <div>
                        <div className="font-medium">Workflow Analysis</div>
                        <div className="text-sm text-[#6b7280]">
                          {getCategoryDescription('workflow_analysis')}
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div>
                        <div className="font-medium">Custom</div>
                        <div className="text-sm text-[#6b7280]">
                          {getCategoryDescription('custom')}
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt Content */}
              <div className="space-y-2">
                <Label htmlFor="prompt_content">Prompt Content</Label>
                <Textarea
                  id="prompt_content"
                  value={formData.prompt_content}
                  onChange={e => handleInputChange('prompt_content', e.target.value)}
                  placeholder="Enter the system prompt content..."
                  className="min-h-[200px] border-[#e5e7eb] font-mono text-sm"
                />
                <p className="text-xs text-[#6b7280]">
                  Use &#123;&#123;variable_name&#125;&#125; for template variables
                </p>
              </div>

              {/* Variables */}
              <div className="space-y-2">
                <Label htmlFor="variables">Variables (JSON)</Label>
                <Textarea
                  id="variables"
                  value={formData.variables}
                  onChange={e => handleInputChange('variables', e.target.value)}
                  placeholder='{"variable_name": "description"}'
                  className="min-h-[100px] border-[#e5e7eb] font-mono text-sm"
                />
                <p className="text-xs text-[#6b7280]">
                  Define template variables and their descriptions in JSON format
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked: boolean) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-[#6b7280]">
                  Only active prompts are available for use in workflows
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes Preview */}
          {originalPrompt && (
            <Card className="border-[#e5e7eb]">
              <CardHeader>
                <CardTitle>Change Summary</CardTitle>
                <CardDescription>
                  Review the changes that will be made to this prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.name !== originalPrompt.name && (
                    <div className="text-sm">
                      <span className="font-medium">Name:</span>{' '}
                      <span className="text-red-600 line-through">{originalPrompt.name}</span>{' '}
                      <span className="text-green-600">{formData.name}</span>
                    </div>
                  )}
                  {formData.description !== (originalPrompt.description || '') && (
                    <div className="text-sm">
                      <span className="font-medium">Description:</span>{' '}
                      <span className="text-red-600 line-through">
                        {originalPrompt.description || '(empty)'}
                      </span>{' '}
                      <span className="text-green-600">{formData.description || '(empty)'}</span>
                    </div>
                  )}
                  {formData.category !== originalPrompt.category && (
                    <div className="text-sm">
                      <span className="font-medium">Category:</span>{' '}
                      <span className="text-red-600 line-through">{originalPrompt.category}</span>{' '}
                      <span className="text-green-600">{formData.category}</span>
                    </div>
                  )}
                  {formData.is_active !== originalPrompt.is_active && (
                    <div className="text-sm">
                      <span className="font-medium">Status:</span>{' '}
                      <span className="text-red-600 line-through">
                        {originalPrompt.is_active ? 'Active' : 'Inactive'}
                      </span>{' '}
                      <span className="text-green-600">
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                  {formData.prompt_content !== originalPrompt.prompt_content && (
                    <div className="text-sm">
                      <span className="font-medium">Prompt Content:</span>{' '}
                      <span className="text-[#6b7280]">Modified</span>
                    </div>
                  )}
                  {JSON.stringify(JSON.parse(formData.variables)) !==
                    JSON.stringify(originalPrompt.variables) && (
                    <div className="text-sm">
                      <span className="font-medium">Variables:</span>{' '}
                      <span className="text-[#6b7280]">Modified</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
