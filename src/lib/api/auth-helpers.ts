import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/utils'
import type { User } from '@supabase/supabase-js'

/**
 * Standard API error response with consistent format
 */
export function createErrorResponse(message: string, status: number, details?: any) {
  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && details && { details }),
    },
    { status }
  )
}

/**
 * Standard API success response with consistent format
 */
export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json(
    {
      ...data,
      success: true,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Authentication result type
 */
export type AuthResult = { success: true; user: User } | { success: false; response: NextResponse }

/**
 * Validate user authentication
 */
export async function validateAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return {
        success: false,
        response: createErrorResponse('Authentication error', 401, error),
      }
    }

    if (!user) {
      return {
        success: false,
        response: createErrorResponse('Authentication required', 401),
      }
    }

    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      response: createErrorResponse(
        'Authentication validation failed',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
    }
  }
}

/**
 * Validate admin authorization
 */
export async function validateAdminAuth(): Promise<AuthResult> {
  const authResult = await validateAuth()

  if (!authResult.success) {
    return authResult
  }

  try {
    const isAdmin = await requireAdmin(authResult.user.id)

    if (!isAdmin) {
      return {
        success: false,
        response: createErrorResponse('Admin privileges required', 403),
      }
    }

    return { success: true, user: authResult.user }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403

    return {
      success: false,
      response: createErrorResponse(message, status),
    }
  }
}

/**
 * Middleware-style admin auth wrapper for API routes
 *
 * Usage:
 * export async function GET(request: NextRequest) {
 *   const authResult = await validateAdminAuth()
 *   if (!authResult.success) return authResult.response
 *
 *   const user = authResult.user
 *   // Your route logic here...
 * }
 */

/**
 * Higher-order function that wraps API route handlers with admin auth
 *
 * Usage:
 * export const GET = withAdminAuth(async (request: NextRequest, user: User) => {
 *   // Your route logic here with guaranteed admin user
 *   return NextResponse.json({ data: 'success' })
 * })
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await validateAdminAuth()

    if (!authResult.success) {
      return authResult.response
    }

    try {
      return await handler(request, authResult.user)
    } catch (error) {
      console.error('Admin route error:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  }
}

/**
 * Higher-order function that wraps API route handlers with basic auth
 */
export function withAuth(handler: (request: NextRequest, user: User) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await validateAuth()

    if (!authResult.success) {
      return authResult.response
    }

    try {
      return await handler(request, authResult.user)
    } catch (error) {
      console.error('Authenticated route error:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  }
}
