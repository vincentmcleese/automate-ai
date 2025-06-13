import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/automations/[id]/status - Get automation status
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('automations')
    .select('status, generated_json')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: data.status,
    isComplete: data.status === 'completed' || data.status === 'failed',
    hasJson: !!data.generated_json,
  })
}
