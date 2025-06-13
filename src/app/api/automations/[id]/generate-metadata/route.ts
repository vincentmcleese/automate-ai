import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInitialAutomation } from '@/tasks/generateAutomation'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: automationId } = await params
  const { userInput, selectedTools } = await request.json()

  try {
    const slug = await generateInitialAutomation(automationId, userInput, selectedTools)
    return NextResponse.json({ slug }, { status: 200 })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred during metadata generation.'

    await supabase
      .from('automations')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', automationId)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
