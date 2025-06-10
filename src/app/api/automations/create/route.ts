import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
// We will create this task runner shortly
import { triggerAutomationGeneration } from '@/tasks/generateAutomation'

const createSchema = z.object({
  userInput: z.string().min(10, 'User input is too short'),
  selectedTools: z.record(z.string()), // e.g. { "1": "Gmail", "2": "Salesforce" }
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'You must be logged in to create an automation.' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const parseResult = createSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  const { userInput, selectedTools } = parseResult.data

  // 1. Create the initial automation record
  const { data: newAutomation, error } = await supabase
    .from('automations')
    .insert({
      user_id: user.id,
      user_input: userInput,
      status: 'generating', // Set status to 'generating' as per user feedback
      // Title, description, etc., will be populated by the background task
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating automation record:', error)
    return NextResponse.json({ error: 'Failed to create automation.' }, { status: 500 })
  }

  // 2. Trigger the background task.
  // We don't await this so the response is sent back to the client immediately.
  triggerAutomationGeneration(newAutomation.id, userInput, selectedTools)

  // 3. Immediately return the new automation ID to the client
  return NextResponse.json({ automationId: newAutomation.id }, { status: 202 })
}
