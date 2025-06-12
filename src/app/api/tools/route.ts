import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // Revalidate once per hour

export async function GET() {
  const supabase = await createClient()

  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, logo_url')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }

  return NextResponse.json(tools)
}
