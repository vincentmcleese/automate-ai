'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRight, Calendar, Plus, RefreshCw, User, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { AutomationOverview, AutomationsResponse } from '@/types/admin'

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<AutomationOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const checkAuthAndLoadAutomations = async () => {
    try {
      // Remove authentication requirement - make page public
      // const supabase = createClient()
      // const {
      //   data: { user },
      // } = await supabase.auth.getUser()

      // if (!user) {
      //   router.push('/login?redirect=/automations')
      //   return
      // }

      await loadAutomations()
    } catch (error) {
      console.error('Error loading automations:', error)
      // router.push('/login?redirect=/automations')
    }
  }

  useEffect(() => {
    checkAuthAndLoadAutomations()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAutomations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/automations?page=${page}&limit=12`)

      if (!response.ok) {
        // Remove 401 handling since API is now public
        // if (response.status === 401) {
        //   router.push('/login?redirect=/automations')
        //   return
        // }
        throw new Error('Failed to fetch automations')
      }

      const data: AutomationsResponse = await response.json()
      setAutomations(data.automations)
      setTotalPages(data.pagination.total_pages)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Error loading automations:', error)
      toast.error('Failed to load automations')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleCreateNew = () => {
    router.push('/')
  }

  const handleRefresh = () => {
    loadAutomations()
  }

  if (loading && automations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex items-center space-x-2 text-[#6b7280]">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading automations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#000000]">Community Automations</h1>
              <p className="mt-2 text-[#6b7280]">
                Discover and explore automations created by our community
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={handleCreateNew}
                className="flex items-center space-x-2 bg-[#32da94] text-white hover:bg-[#2bc780]"
              >
                <Plus className="h-4 w-4" />
                <span>Create New</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-[#e5e7eb]">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-[#32da94]" />
                  <div>
                    <p className="text-2xl font-bold text-[#000000]">{total}</p>
                    <p className="text-sm text-[#6b7280]">Total Automations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb]">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-[#32da94]" />
                  <div>
                    <p className="text-2xl font-bold text-[#000000]">
                      {new Set(automations.map(a => a.user.id)).size}
                    </p>
                    <p className="text-sm text-[#6b7280]">Active Creators</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb]">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-[#32da94]" />
                  <div>
                    <p className="text-2xl font-bold text-[#000000]">
                      {automations.length > 0 ? formatDate(automations[0].created_at) : '-'}
                    </p>
                    <p className="text-sm text-[#6b7280]">Latest Creation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automations Grid */}
          {automations.length === 0 ? (
            <Card className="border-[#e5e7eb]">
              <CardContent className="p-12 text-center">
                <Zap className="mx-auto mb-4 h-12 w-12 text-[#6b7280]" />
                <h3 className="mb-2 text-lg font-semibold text-[#000000]">No automations yet</h3>
                <p className="mb-6 text-[#6b7280]">
                  Be the first to create an automation and share it with the community!
                </p>
                <Button
                  onClick={handleCreateNew}
                  className="bg-[#32da94] text-white hover:bg-[#2bc780]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Automation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {automations.map(automation => (
                <Card
                  key={automation.id}
                  className="group cursor-pointer border-[#e5e7eb] transition-all duration-200 hover:shadow-lg"
                  onClick={() => router.push(`/generate-automation?id=${automation.id}`)}
                >
                  {/* Image Header */}
                  {automation.image_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={automation.image_url}
                        alt={automation.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        width={300}
                        height={200}
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 text-lg text-[#000000] transition-colors group-hover:text-[#32da94]">
                          {automation.title}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {automation.description}
                        </CardDescription>
                      </div>
                      <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0 text-[#6b7280] transition-colors group-hover:text-[#32da94]" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={automation.user.avatar_url}
                            alt={automation.user.name}
                          />
                          <AvatarFallback className="bg-[#32da94] text-xs text-white">
                            {getInitials(automation.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[#000000]">
                            {automation.user.name}
                          </p>
                          <p className="text-xs text-[#6b7280]">
                            {formatDate(automation.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="border-green-200 bg-green-100 text-green-800"
                      >
                        Completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="border-[#e5e7eb]"
              >
                Previous
              </Button>
              <span className="px-4 text-sm text-[#6b7280]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="border-[#e5e7eb]"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
