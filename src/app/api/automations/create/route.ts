import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateInitialAutomation } from '@/tasks/generateAutomation'

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
      // Capture user metadata at the time of creation
      user_email: user.email,
      user_name: user.user_metadata.full_name,
      user_avatar_url: user.user_metadata.avatar_url,
      // Title, description, etc., will be populated by the background task
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating automation record:', error)
    return NextResponse.json({ error: 'Failed to create automation.' }, { status: 500 })
  }

  try {
    // 2. Synchronously generate metadata and trigger background workflow generation.
    await generateInitialAutomation(newAutomation.id, userInput, selectedTools)

    // 3. Immediately return the new automation ID.
    return NextResponse.json({ automationId: newAutomation.id }, { status: 200 })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during generation.'
    console.error(`Error processing automation ${newAutomation.id}:`, error)

    // Update the automation to failed status
    await supabase
      .from('automations')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', newAutomation.id)

    // 4. If there's an error, return a 500 status with the error message.
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
