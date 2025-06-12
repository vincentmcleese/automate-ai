import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60 // Revalidate every 60 seconds

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('automations')
    .select('user_id, user_name, user_avatar_url')
    .eq('status', 'completed')

  if (error) {
    console.error('Error fetching leaderboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ leaderboard: [] })
  }

  // Aggregate the data
  const userContributions = data.reduce(
    (acc, automation) => {
      if (!automation.user_id) return acc
      if (!acc[automation.user_id]) {
        acc[automation.user_id] = {
          user_id: automation.user_id,
          name: automation.user_name || 'Anonymous',
          avatar_url: automation.user_avatar_url,
          automations: 0,
        }
      }
      acc[automation.user_id].automations += 1
      return acc
    },
    {} as Record<
      string,
      {
        user_id: string
        name: string
        avatar_url: string | null
        automations: number
      }
    >
  )

  // Sort users by contribution count
  const sortedLeaderboard = Object.values(userContributions).sort(
    (a, b) => b.automations - a.automations
  )

  return NextResponse.json({ leaderboard: sortedLeaderboard })
}
