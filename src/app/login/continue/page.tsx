'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { toast } from 'sonner'
import { AnimatedLoading } from '@/components/generate/AnimatedLoading'

function LoginContinueContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingAutomationId = searchParams.get('pendingAutomationId')
  const [processing, setProcessing] = useState(false)

  const claimPendingAutomation = useCallback(
    async (pendingId: string) => {
      try {
        const response = await fetch('/api/automations/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingAutomationId: pendingId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to continue automation.')
        }

        toast.success('Welcome back! Your automation is being created.')
        router.push(`/automations/${data.automationId}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to continue automation.')
        router.push('/dashboard')
      }
    },
    [router]
  )

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && pendingAutomationId && !processing) {
      setProcessing(true)
      claimPendingAutomation(pendingAutomationId)
    }
  }, [user, loading, pendingAutomationId, processing, router, claimPendingAutomation])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <AnimatedLoading text="Signing you in..." />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AnimatedLoading text="Continuing your automation..." />
    </div>
  )
}

export default function LoginContinuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <AnimatedLoading text="Loading..." />
        </div>
      }
    >
      <LoginContinueContent />
    </Suspense>
  )
}
