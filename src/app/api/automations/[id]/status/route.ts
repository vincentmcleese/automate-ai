import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/automations/[id]/status - Get automation status
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get the automation details
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, status, generated_json, created_at, updated_at, image_url, description')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own automations
      .single()

    if (automationError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Check if the automation has any actual content in generated_json
    const hasGeneratedContent =
      automation.generated_json && Object.keys(automation.generated_json).length > 0

    return NextResponse.json({
      id: automation.id,
      status: automation.status,
      has_content: hasGeneratedContent,
      created_at: automation.created_at,
      updated_at: automation.updated_at,
      image_url: automation.image_url,
      description: automation.description,
    })
  } catch (error) {
    console.error('Error in automation status endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
