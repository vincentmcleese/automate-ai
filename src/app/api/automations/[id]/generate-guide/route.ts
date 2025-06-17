import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateAutomationGuideInBackground } from '@/tasks/generateAutomation'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Verify user has access to this automation
    const { data: automation, error } = await supabase
      .from('automations')
      .select('id, status')
      .eq('id', id)
      .single()

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if (automation.status !== 'completed') {
      return NextResponse.json(
        { error: 'Automation must be completed before generating guide' },
        { status: 400 }
      )
    }

    // Test if prompt exists using admin client (bypasses RLS)
    try {
      const { data: promptTest, error: promptError } = await supabaseAdmin
        .from('system_prompts')
        .select('name, is_active, category')
        .eq('name', 'automation_guide_generation')
        .single()

      if (promptError || !promptTest) {
        return NextResponse.json(
          {
            error: 'automation_guide_generation prompt not found',
            prompt_error: promptError?.message,
            suggestion:
              'Please create the prompt in admin interface with exact name: automation_guide_generation',
          },
          { status: 404 }
        )
      }

      if (!promptTest.is_active) {
        return NextResponse.json(
          {
            error: 'automation_guide_generation prompt exists but is not active',
            prompt_status: promptTest,
            suggestion: 'Please activate the prompt in admin interface',
          },
          { status: 400 }
        )
      }

      // If we get here, prompt exists and is active
      console.log('Prompt verified:', promptTest)
    } catch (promptError) {
      return NextResponse.json(
        {
          error: 'Failed to check prompt existence',
          details: promptError,
        },
        { status: 500 }
      )
    }

    // Generate guide in background
    generateAutomationGuideInBackground(id).catch(console.error)

    return NextResponse.json({
      message: 'Automation guide generation started',
      automation_id: id,
      prompt_verified: true,
    })
  } catch (error) {
    console.error('Error starting automation guide generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
