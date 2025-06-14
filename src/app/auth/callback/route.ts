import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const pendingAutomationId = searchParams.get('pendingAutomationId')
  const next = pendingAutomationId
    ? `/login/continue?pendingAutomationId=${pendingAutomationId}`
    : (searchParams.get('next') ?? '/dashboard')

  // Debug logging for production issues
  console.log('Auth callback - Environment:', process.env.NODE_ENV)
  console.log('Auth callback - Origin:', origin)
  console.log('Auth callback - PendingAutomationId:', pendingAutomationId)
  console.log('Auth callback - Next URL:', next)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      // Properly construct URL to preserve existing query parameters
      const redirectUrl = new URL(origin)
      const [pathname, queryString] = next.split('?')
      redirectUrl.pathname = pathname

      // Preserve existing query parameters
      if (queryString) {
        const existingParams = new URLSearchParams(queryString)
        existingParams.forEach((value, key) => {
          redirectUrl.searchParams.set(key, value)
        })
      }

      // Add signed_in parameter
      redirectUrl.searchParams.set('signed_in', 'true')

      // Debug logging for redirect URL
      console.log('Auth callback - Final redirect URL:', redirectUrl.toString())

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(redirectUrl)
      } else if (forwardedHost) {
        redirectUrl.host = forwardedHost
        return NextResponse.redirect(redirectUrl)
      } else {
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
