import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/automations - Get all automations with user info
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Remove authentication requirement - make it public
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()

    // if (!user) {
    //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Fetch automations with user information from the same table
    const {
      data: automations,
      error,
      count,
    } = await supabase
      .from('automations')
      .select(
        `
        id,
        title,
        description,
        user_input,
        status,
        created_at,
        updated_at,
        user_id,
        user_name,
        user_email,
        user_avatar_url,
        image_url
      `,
        { count: 'exact' }
      )
      .eq('status', 'completed') // Only show completed automations
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching automations:', error)
      return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 })
    }

    // Remove the admin user fetching code since we have user data in the table
    // // Fetch user data separately
    // const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
    //   perPage: 1000 // Should be enough for most cases
    // })

    // if (usersError) {
    //   console.error('Error fetching users:', usersError)
    //   return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    // }

    // // Create a map of user data for quick lookup
    // const userMap: Record<string, any> = {}
    // users.users.forEach(user => {
    //   userMap[user.id] = user
    // })

    // Format the response using data from the automations table
    const formattedAutomations =
      automations?.map(automation => {
        return {
          id: automation.id,
          title: automation.title || 'Untitled Automation',
          description: automation.description || automation.user_input?.substring(0, 150) + '...',
          created_at: automation.created_at,
          updated_at: automation.updated_at,
          status: automation.status,
          image_url: automation.image_url,
          user: {
            id: automation.user_id,
            email: automation.user_email,
            name: automation.user_name || automation.user_email?.split('@')[0] || 'Unknown User',
            avatar_url: automation.user_avatar_url,
          },
        }
      }) || []

    return NextResponse.json({
      automations: formattedAutomations,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in automations endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
