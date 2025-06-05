import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, validateSystemPromptData, sanitizePromptContent } from '@/lib/admin/utils'
import { CreateSystemPromptData } from '@/types/admin'

// GET /api/admin/system-prompts - List all system prompts
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('active')

    let query = supabase
      .from('system_prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: prompts, error } = await query

    if (error) {
      console.error('Error fetching system prompts:', error)
      return NextResponse.json({ error: 'Failed to fetch system prompts' }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/admin/system-prompts - Create new system prompt
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const promptData: CreateSystemPromptData = {
      name: body.name,
      description: body.description,
      category: body.category || 'custom',
      prompt_content: sanitizePromptContent(body.prompt_content),
      variables: body.variables || {},
      is_active: body.is_active !== false, // Default to true
    }

    // Validate the data
    const validationErrors = validateSystemPromptData(promptData)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // Check for duplicate names
    const { data: existing } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('name', promptData.name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A system prompt with this name already exists' },
        { status: 409 }
      )
    }

    // Insert the new prompt
    const { data: newPrompt, error } = await supabase
      .from('system_prompts')
      .insert({
        ...promptData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating system prompt:', error)
      return NextResponse.json({ error: 'Failed to create system prompt' }, { status: 500 })
    }

    return NextResponse.json({ prompt: newPrompt }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
