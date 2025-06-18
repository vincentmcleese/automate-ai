'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { AutomationOverview, AutomationsResponse } from '@/types/admin'
import { AutomationCard } from '@/components/automations/AutomationCard'

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<AutomationOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Load automations function
  const loadAutomations = useCallback(async () => {
    try {
      setLoading(true)
      const url = debouncedSearchQuery
        ? `/api/automations?search=${debouncedSearchQuery}&page=${page}&limit=12`
        : `/api/automations?page=${page}&limit=12`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch automations')
      }

      const data: AutomationsResponse = await response.json()

      // If it's page 1 or a new search, replace; otherwise append
      setAutomations(prev => (page === 1 ? data.automations : [...prev, ...data.automations]))
      setTotalPages(data.pagination.total_pages)
    } catch (error) {
      console.error('Error loading automations:', error)
      toast.error('Failed to load automations')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, page])

  // Load data when search query changes (reset to page 1)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery])

  // Load data when page changes
  useEffect(() => {
    loadAutomations()
  }, [loadAutomations])

  const handleCreateNew = () => {
    router.push('/generate-automation')
  }

  if (loading && automations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading automations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
              <p className="mt-1 text-gray-600">
                Browse and manage community-generated automations.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="text-text-secondary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search automations..."
                  className="pr-8 pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="text-text-secondary h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleCreateNew}
                className="flex items-center space-x-2 bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                <span>Create New</span>
              </Button>
            </div>
          </div>

          {/* Automations Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {automations.map(automation => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>

          {/* Pagination / Load More */}
          {page < totalPages && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
