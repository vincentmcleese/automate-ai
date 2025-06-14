import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateInitialAutomation } from '@/tasks/generateAutomation'

const claimAutomationSchema = z.object({
  pendingAutomationId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }

    const body = await request.json()
    const parseResult = claimAutomationSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { pendingAutomationId } = parseResult.data
    const { data: pending, error: pendingError } = await supabase
      .from('pending_automations')
      .select('*')
      .eq('id', pendingAutomationId)
      .single()

    if (pendingError || !pending) {
      return NextResponse.json({ error: 'Pending automation not found' }, { status: 404 })
    }

    const { data: newAutomation, error: createError } = await supabase
      .from('automations')
      .insert({
        user_id: user.id,
        user_input: pending.user_input,
        status: 'generating',
        user_email: user.email,
      })
      .select('id')
      .single()

    if (createError) {
      throw createError
    }

    // 3. Delete the pending automation
    const { error: deleteError } = await supabase
      .from('pending_automations')
      .delete()
      .eq('id', pendingAutomationId)

    let warning
    if (deleteError) {
      // Log the error but don't fail the request, as the main automation has been created
      console.error(
        `Critical but non-blocking error: Failed to delete pending automation record ${pendingAutomationId}.`,
        deleteError
      )
      warning =
        'Your automation was created successfully, but a temporary record could not be deleted. Please contact support if you experience any issues.'
    }

    // 4. Asynchronously generate the automation details
    await generateInitialAutomation(newAutomation.id, pending.user_input, pending.selected_tools)

    // 5. Return the new automation ID
    return NextResponse.json({ automationId: newAutomation.id, warning })
  } catch (error) {
    console.error('Unexpected error in /api/automations/claim:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
