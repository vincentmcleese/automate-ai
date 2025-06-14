import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createPendingAutomationSchema = z.object({
  userInput: z.string().min(10, 'User input is too short'),
  selectedTools: z.record(z.string()),
  validationResult: z.any(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const parseResult = createPendingAutomationSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { userInput, selectedTools, validationResult } = parseResult.data
    const { data, error } = await supabase
      .from('pending_automations')
      .insert({
        user_input: userInput,
        selected_tools: selectedTools,
        validation_result: validationResult,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating pending automation:', error)
      return NextResponse.json({ error: 'Failed to create pending automation.' }, { status: 500 })
    }

    return NextResponse.json({ pendingAutomationId: data.id })
  } catch (e) {
    console.error('Unexpected error in /api/automations/pending/create:', e)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
