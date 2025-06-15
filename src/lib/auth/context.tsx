'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthContextType, AuthUser } from '@/types/auth'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const initialLoadComplete = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser((session?.user as AuthUser) || null)
      setLoading(false)
      initialLoadComplete.current = true
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser((session?.user as AuthUser) || null)
      setLoading(false)

      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out!')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)

      // Preserve URL parameters (like pendingAutomationId) in OAuth flow
      const currentParams = new URLSearchParams(window.location.search)
      const callbackUrl = new URL('/auth/callback', window.location.origin)

      // Copy relevant parameters to callback URL
      const paramsToPreserve = ['pendingAutomationId', 'next']
      paramsToPreserve.forEach(param => {
        const value = currentParams.get(param)
        if (value) {
          callbackUrl.searchParams.set(param, value)
        }
      })

      // Debug logging for OAuth redirect URL
      logger.debug('OAuth redirect setup', {
        origin: window.location.origin,
        callbackUrl: callbackUrl.toString(),
        params: Object.fromEntries(currentParams),
      })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        logger.authError('Google sign in failed', error)
        toast.error('Failed to sign in with Google')
      }
    } catch (error) {
      logger.authError('Unexpected error during Google sign in', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        logger.authError('Sign out failed', error)
        toast.error('Failed to sign out')
      }
    } catch (error) {
      logger.authError('Unexpected error during sign out', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
