import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RawAutomation } from '@/types/admin'

// GET /api/automations - Get all automations with user info and rank
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
    const searchQuery = searchParams.get('search')

    let automations
    let error
    let count = null
    let rankMap: Map<string, number> | null = null

    if (searchQuery) {
      // Use the new search function
      const { data: searchData, error: searchError } = await supabase.rpc('search_automations', {
        search_term: searchQuery,
        page_limit: limit,
        page_offset: offset,
      })
      automations = searchData
      error = searchError
      // Note: count is not easily available with RPC, may need a separate count function if needed
    } else {
      // Fetch ranks first for non-search scenario
      const { data: ranks, error: rankError } = await supabase.rpc('get_user_ranks')
      if (rankError) throw rankError
      rankMap = new Map(
        (ranks as { user_id: string; rank: number }[] | null)?.map(r => [r.user_id, r.rank])
      )

      // Original fetch logic
      const {
        data: fetchedAutomations,
        error: fetchError,
        count: fetchCount,
      } = await supabase
        .from('automations')
        .select(
          `
          id, title, description, user_input, status, created_at, updated_at,
          user_id, user_name, user_email, user_avatar_url, image_url, tags
          `,
          { count: 'exact' }
        )
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      automations = fetchedAutomations
      error = fetchError
      count = fetchCount
    }

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
      automations?.map((automation: RawAutomation) => ({
        id: automation.id,
        title: automation.title || 'Untitled Automation',
        description: automation.description || automation.user_input?.substring(0, 150) + '...',
        created_at: automation.created_at,
        updated_at: automation.updated_at,
        status: automation.status,
        image_url: automation.image_url,
        tags: automation.tags,
        user: {
          id: automation.user_id,
          email: automation.user_email,
          name: automation.user_name || 'Anonymous',
          avatar_url: automation.user_avatar_url,
          rank: automation.rank || rankMap?.get(automation.user_id) || null,
        },
      })) || []

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
