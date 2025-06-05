import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, validateSystemPromptData, sanitizePromptContent } from '@/lib/admin/utils'
import { UpdateSystemPromptData } from '@/types/admin'

// GET /api/admin/system-prompts/[id] - Get specific system prompt
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

    const { data: prompt, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
      }
      console.error('Error fetching system prompt:', error)
      return NextResponse.json({ error: 'Failed to fetch system prompt' }, { status: 500 })
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/admin/system-prompts/[id] - Update system prompt
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const updateData: Partial<UpdateSystemPromptData> = {}

    // Only include fields that are provided
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.prompt_content !== undefined) {
      updateData.prompt_content = sanitizePromptContent(body.prompt_content)
    }
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Validate the data if any validation-required fields are being updated
    if (body.name || body.prompt_content || body.category) {
      const validationErrors = validateSystemPromptData({ ...body, id })
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationErrors },
          { status: 400 }
        )
      }
    }

    // Check for duplicate names (if name is being updated)
    if (body.name) {
      const { data: existing } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('name', body.name)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'A system prompt with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update the prompt
    const { data: updatedPrompt, error } = await supabase
      .from('system_prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
      }
      console.error('Error updating system prompt:', error)
      return NextResponse.json({ error: 'Failed to update system prompt' }, { status: 500 })
    }

    return NextResponse.json({ prompt: updatedPrompt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/admin/system-prompts/[id] - Delete system prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if the prompt exists
    const { data: existing, error: fetchError } = await supabase
      .from('system_prompts')
      .select('name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
      }
      console.error('Error checking system prompt:', fetchError)
      return NextResponse.json({ error: 'Failed to delete system prompt' }, { status: 500 })
    }

    // Delete the prompt
    const { error } = await supabase.from('system_prompts').delete().eq('id', id)

    if (error) {
      console.error('Error deleting system prompt:', error)
      return NextResponse.json({ error: 'Failed to delete system prompt' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'System prompt deleted successfully',
      deleted_prompt: existing.name,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
