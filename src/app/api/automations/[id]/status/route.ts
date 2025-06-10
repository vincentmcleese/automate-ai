import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/automations/[id]/status - Get automation status
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params // Await the promise to get the id

    const { data: automation, error } = await supabase
      .from('automations')
      .select('status, generated_json, error_message, updated_at, title, description')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
      }
      throw new Error(`Supabase error: ${error.message}`)
    }

    return NextResponse.json(automation)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    console.error('Error fetching automation status:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
