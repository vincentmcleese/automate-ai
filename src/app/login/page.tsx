'use client'

import { Suspense } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

function LoginContent() {
  const { signInWithGoogle, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom')
  const pendingAutomationId = searchParams.get('pendingAutomationId')
  const reason = searchParams.get('reason')

  useEffect(() => {
    if (user && !loading) {
      if (pendingAutomationId) {
        // Handle pending automation flow
        router.push(`/login/continue?pendingAutomationId=${pendingAutomationId}`)
      } else {
        router.push(redirectedFrom || '/dashboard')
      }
    }
  }, [user, loading, router, redirectedFrom, pendingAutomationId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {reason === 'create_automation' ? (
            <>
              <CardTitle className="text-2xl">One Last Step</CardTitle>
              <CardDescription>
                Sign up or log in to finish creating your automation.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={signInWithGoogle} disabled={loading} className="w-full" size="lg">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="text-muted-foreground text-sm hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
