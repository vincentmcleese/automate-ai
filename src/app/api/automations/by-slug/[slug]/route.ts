import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createClient()

  try {
    // First, resolve slug to automation ID
    const { data: automation, error } = await supabase
      .from('automations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Return the automation ID for client-side use
    return NextResponse.json({
      automationId: automation.id,
      slug: slug,
    })
  } catch (error) {
    console.error('Error resolving slug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
