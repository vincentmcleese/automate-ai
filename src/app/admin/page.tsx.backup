'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, MessageSquare, Cpu, Users, RefreshCw, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    loadStats()
  }, [loadStats])

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
                  <CardTitle>System Prompts</CardTitle>
                  <CardDescription>
                    Manage AI system prompts for workflow validation and JSON generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[#6b7280]">
                    System prompts management will be available here.
                  </p>
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
    </div>
  )
}
