import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  requireAdmin,
  getAllUsersWithRoles,
  getUserStats,
  setUserAdminRole,
  removeUserAdminRole,
} from '@/lib/admin/utils'

// GET /api/admin/users - Get all users or user stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isAdmin = await requireAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = await getUserStats()
      return NextResponse.json({ stats })
    } else {
      const users = await getAllUsersWithRoles()
      return NextResponse.json({ users })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isAdmin = await requireAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Role must be "admin" or "user"' }, { status: 400 })
    }

    // Prevent removing admin role from self
    if (email === user.email && role === 'user') {
      return NextResponse.json(
        {
          error: 'Cannot remove admin role from yourself',
        },
        { status: 400 }
      )
    }

    let result
    if (role === 'admin') {
      result = await setUserAdminRole(email)
    } else {
      result = await removeUserAdminRole(email)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      message: `User role updated to ${role}`,
      email,
      role,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
