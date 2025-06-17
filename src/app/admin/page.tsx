'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Settings,
  MessageSquare,
  Cpu,
  Users,
  RefreshCw,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { PromptCategory, SystemPromptWithTrainingData } from '@/types/admin'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [systemPromptsLoading, setSystemPromptsLoading] = useState(true)
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptWithTrainingData[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    promptId: string
    promptName: string
  }>({
    open: false,
    promptId: '',
    promptName: '',
  })
  const [stats, setStats] = useState({
    prompts: 0,
    models: 0,
    users: 0,
    credits: null as number | null,
  })

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)

      // Load counts and stats in parallel
      const [promptsRes, modelsRes, usersRes] = await Promise.allSettled([
        fetch('/api/admin/system-prompts'),
        fetch('/api/admin/models'),
        fetch('/api/admin/users?stats=true'),
      ])

      const newStats = {
        prompts: 0,
        models: 0,
        users: 0,
        credits: null as number | null,
      }

      if (promptsRes.status === 'fulfilled' && promptsRes.value.ok) {
        const data = await promptsRes.value.json()
        newStats.prompts = data.prompts?.length || 0
      }

      if (modelsRes.status === 'fulfilled' && modelsRes.value.ok) {
        const data = await modelsRes.value.json()
        newStats.models = data.models?.length || 0
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const data = await usersRes.value.json()
        newStats.users = data.stats?.total_users || 0
      }

      setStats(newStats)
    } catch (error) {
      console.error('Error loading admin stats:', error)
      toast.error('Failed to load admin statistics')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSystemPrompts = useCallback(async () => {
    try {
      setSystemPromptsLoading(true)
      const response = await fetch('/api/admin/system-prompts')

      if (!response.ok) {
        throw new Error('Failed to fetch system prompts')
      }

      const data = await response.json()
      setSystemPrompts(data.prompts || [])
    } catch (error) {
      console.error('Error loading system prompts:', error)
      toast.error('Failed to load system prompts')
    } finally {
      setSystemPromptsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadSystemPrompts()
  }, [loadStats, loadSystemPrompts])

  const syncModels = async () => {
    try {
      toast.loading('Syncing models from OpenRouter...')
      const response = await fetch('/api/admin/models?sync=true')

      if (!response.ok) {
        throw new Error('Failed to sync models')
      }

      toast.success('Models synced successfully')
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Error syncing models:', error)
      toast.error('Failed to sync models')
    }
  }

  const togglePromptStatus = async (promptId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/system-prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update prompt status')
      }

      toast.success(`Prompt ${!currentStatus ? 'activated' : 'deactivated'}`)
      loadSystemPrompts() // Refresh the list
    } catch (error) {
      console.error('Error toggling prompt status:', error)
      toast.error('Failed to update prompt status')
    }
  }

  const deletePrompt = async (promptId: string) => {
    try {
      const response = await fetch(`/api/admin/system-prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete prompt')
      }

      toast.success('System prompt deleted successfully')
      loadSystemPrompts() // Refresh the list
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Error deleting prompt:', error)
      toast.error('Failed to delete prompt')
    }
  }

  const handleDeleteClick = (promptId: string, promptName: string) => {
    setDeleteDialog({
      open: true,
      promptId,
      promptName,
    })
  }

  const handleDeleteConfirm = async () => {
    await deletePrompt(deleteDialog.promptId)
    setDeleteDialog({ open: false, promptId: '', promptName: '' })
  }

  const getCategoryBadgeColor = (category: PromptCategory) => {
    switch (category) {
      case 'validation':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'json_generation':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'workflow_analysis':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'image_generation':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'automation_guide':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'custom':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#000000]">Admin Dashboard</h1>
              <p className="mt-1 text-[#6b7280]">
                Manage system prompts, AI models, and application settings
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={syncModels} className="border-[#e5e7eb]">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Models
              </Button>
              <Badge variant="secondary" className="bg-[#32da94] text-white">
                Admin
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[#e5e7eb]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6b7280]">System Prompts</CardTitle>
                <MessageSquare className="h-4 w-4 text-[#32da94]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">
                  {loading ? '...' : stats.prompts}
                </div>
                <p className="text-xs text-[#6b7280]">Active prompt templates</p>
              </CardContent>
            </Card>

            <Card className="border-[#e5e7eb]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6b7280]">AI Models</CardTitle>
                <Cpu className="h-4 w-4 text-[#32da94]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">
                  {loading ? '...' : stats.models}
                </div>
                <p className="text-xs text-[#6b7280]">Available OpenRouter models</p>
              </CardContent>
            </Card>

            <Card className="border-[#e5e7eb]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6b7280]">Total Users</CardTitle>
                <Users className="h-4 w-4 text-[#32da94]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">
                  {loading ? '...' : stats.users}
                </div>
                <p className="text-xs text-[#6b7280]">Registered users</p>
              </CardContent>
            </Card>

            <Card className="border-[#e5e7eb]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6b7280]">API Credits</CardTitle>
                <DollarSign className="h-4 w-4 text-[#32da94]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">
                  {loading ? '...' : stats.credits ? `$${stats.credits}` : 'N/A'}
                </div>
                <p className="text-xs text-[#6b7280]">OpenRouter balance</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="prompts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 border border-[#e5e7eb] bg-white">
              <TabsTrigger
                value="prompts"
                className="data-[state=active]:bg-[#32da94] data-[state=active]:text-white"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                System Prompts
              </TabsTrigger>
              <TabsTrigger
                value="models"
                className="data-[state=active]:bg-[#32da94] data-[state=active]:text-white"
              >
                <Cpu className="mr-2 h-4 w-4" />
                AI Models
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-[#32da94] data-[state=active]:text-white"
              >
                <Users className="mr-2 h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#32da94] data-[state=active]:text-white"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompts" className="space-y-4">
              <Card className="border-[#e5e7eb]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>System Prompts</CardTitle>
                      <CardDescription>
                        Manage AI system prompts for workflow validation and JSON generation
                      </CardDescription>
                    </div>
                    <Button className="bg-[#32da94] text-white hover:bg-[#2bc780]">
                      <Plus className="mr-2 h-4 w-4" />
                      New Prompt
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {systemPromptsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-[#32da94]" />
                      <span className="ml-2 text-[#6b7280]">Loading system prompts...</span>
                    </div>
                  ) : systemPrompts.length === 0 ? (
                    <div className="py-8 text-center">
                      <MessageSquare className="mx-auto mb-4 h-12 w-12 text-[#6b7280]" />
                      <p className="text-[#6b7280]">No system prompts found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-[#e5e7eb]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {systemPrompts.map(prompt => (
                            <TableRow key={prompt.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-[#000000]">{prompt.name}</p>
                                  {prompt.description && (
                                    <p className="max-w-xs truncate text-sm text-[#6b7280]">
                                      {prompt.description}
                                    </p>
                                  )}
                                  {prompt.training_data_count && prompt.training_data_count > 0 && (
                                    <div className="mt-1 flex items-center space-x-1">
                                      <FileText className="h-3 w-3 text-[#6b7280]" />
                                      <span className="text-xs text-[#6b7280]">
                                        {prompt.training_data_count} training doc
                                        {prompt.training_data_count !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getCategoryBadgeColor(prompt.category)}
                                >
                                  {prompt.category.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {prompt.model_id ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 font-mono text-xs text-blue-800"
                                  >
                                    {prompt.model_id}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-[#6b7280]">System Default</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                  v{prompt.version}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={prompt.is_active ? 'default' : 'secondary'}
                                  className={
                                    prompt.is_active
                                      ? 'border-green-200 bg-green-100 text-green-800'
                                      : 'border-gray-200 bg-gray-100 text-gray-800'
                                  }
                                >
                                  {prompt.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-[#6b7280]">
                                {formatDate(prompt.created_at)}
                              </TableCell>
                              <TableCell className="text-sm text-[#6b7280]">
                                {formatDate(prompt.updated_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePromptStatus(prompt.id, prompt.is_active)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {prompt.is_active ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => router.push(`/admin/system-prompt/${prompt.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteClick(prompt.id, prompt.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <Card className="border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle>AI Models</CardTitle>
                  <CardDescription>Configure and manage OpenRouter AI models</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[#6b7280]">AI models management will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card className="border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[#6b7280]">User management will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure application settings and defaults</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[#6b7280]">System settings will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={open => {
          if (!open) {
            setDeleteDialog({ open: false, promptId: '', promptName: '' })
          }
        }}
        title="Confirm Deletion"
        description={`Are you sure you want to delete the system prompt "${deleteDialog.promptName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
