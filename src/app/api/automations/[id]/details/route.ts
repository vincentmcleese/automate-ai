import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SupabaseClient, User } from '@supabase/supabase-js'

export const revalidate = 60

async function getAutomationById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('automations')
    .select(
      `*, complexity, estimated_time_hours,
      automation_tools ( tools ( id, name, logo_url ) )`
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

async function getAutomationCreator(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (error) throw error
  return user
}

async function getCreatorRank(supabase: SupabaseClient, userId: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_user_rank', { p_user_id: userId })
  if (error) {
    console.error('Error fetching creator rank:', error.message)
    return null
  }
  return Array.isArray(data) && data.length > 0 ? data[0].rank : null
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  try {
    const automationData = await getAutomationById(supabase, id)
    if (!automationData) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const creator = await getAutomationCreator(supabaseAdmin, automationData.user_id)
    const rank = await getCreatorRank(supabase, automationData.user_id)

    const response = {
      ...automationData,
      tools: automationData.automation_tools.map((at: { tools: unknown }) => at.tools),
      user_name: creator?.user_metadata.full_name,
      user_avatar_url: creator?.user_metadata.avatar_url,
      creator_rank: rank,
    }
    delete (response as { automation_tools?: unknown }).automation_tools

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error(`Error fetching automation details for ${id}:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred.' },
      { status: 500 }
    )
  }
}
