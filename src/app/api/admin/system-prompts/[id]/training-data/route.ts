import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/utils'
import { CreateTrainingDataData } from '@/types/admin'

// GET /api/admin/system-prompts/[id]/training-data - Get all training data for a prompt
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isAdmin = await requireAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { id } = await params

    // Verify the system prompt exists
    const { data: prompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('id', id)
      .single()

    if (promptError || !prompt) {
      return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
    }

    // Get training data ordered by creation date
    const { data: trainingData, error } = await supabase
      .from('system_prompt_training_data')
      .select('*')
      .eq('system_prompt_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching training data:', error)
      return NextResponse.json({ error: 'Failed to fetch training data' }, { status: 500 })
    }

    return NextResponse.json({ training_data: trainingData || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/admin/system-prompts/[id]/training-data - Create new training data
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isAdmin = await requireAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const trainingData: CreateTrainingDataData = {
      title: body.title,
      content: body.content,
    }

    // Basic validation
    if (!trainingData.title || trainingData.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!trainingData.content || trainingData.content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify the system prompt exists
    const { data: prompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('id', id)
      .single()

    if (promptError || !prompt) {
      return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
    }

    // Insert the new training data
    const { data: newTrainingData, error } = await supabase
      .from('system_prompt_training_data')
      .insert({
        system_prompt_id: id,
        title: trainingData.title.trim(),
        content: trainingData.content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating training data:', error)
      return NextResponse.json({ error: 'Failed to create training data' }, { status: 500 })
    }

    return NextResponse.json({ training_data: newTrainingData }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
