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

// PATCH /api/admin/system-prompts/[id] - Update system prompt (with versioning)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if prompt exists and get current data
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
      }
      console.error('Error fetching system prompt:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch system prompt' }, { status: 500 })
    }

    // Build update data - only include provided fields
    const updateData: Partial<UpdateSystemPromptData> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.prompt_content !== undefined) {
      updateData.prompt_content = sanitizePromptContent(body.prompt_content)
    }
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.model_id !== undefined) updateData.model_id = body.model_id
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // If this is a significant update (content or name change), create a version backup
    const shouldCreateVersion = updateData.name || updateData.prompt_content || updateData.category

    if (shouldCreateVersion && existingPrompt.version) {
      // Create a version backup before updating
      await supabase.from('system_prompt_versions').insert({
        original_prompt_id: existingPrompt.id,
        version_number: existingPrompt.version,
        name: existingPrompt.name,
        description: existingPrompt.description,
        category: existingPrompt.category,
        prompt_content: existingPrompt.prompt_content,
        variables: existingPrompt.variables,
        is_active: existingPrompt.is_active,
        created_by: existingPrompt.created_by,
        original_created_at: existingPrompt.created_at,
        original_updated_at: existingPrompt.updated_at,
      })

      // Increment version number
      updateData.version = (existingPrompt.version || 1) + 1
    }

    // Validate the data if we're updating core fields
    if (updateData.name || updateData.prompt_content) {
      const validationErrors = validateSystemPromptData({
        name: updateData.name || existingPrompt.name,
        description: updateData.description || existingPrompt.description,
        category: updateData.category || existingPrompt.category,
        prompt_content: updateData.prompt_content || existingPrompt.prompt_content,
        variables: updateData.variables || existingPrompt.variables,
        is_active:
          updateData.is_active !== undefined ? updateData.is_active : existingPrompt.is_active,
      })

      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationErrors },
          { status: 400 }
        )
      }
    }

    // Check for duplicate names if name is being updated
    if (updateData.name && updateData.name !== existingPrompt.name) {
      const { data: duplicate } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', id)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'A system prompt with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update the prompt
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('system_prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating system prompt:', updateError)
      return NextResponse.json({ error: 'Failed to update system prompt' }, { status: 500 })
    }

    return NextResponse.json({
      prompt: updatedPrompt,
      version_created: shouldCreateVersion,
    })
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

    // Check if prompt exists
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('system_prompts')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'System prompt not found' }, { status: 404 })
      }
      console.error('Error fetching system prompt:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch system prompt' }, { status: 500 })
    }

    // Delete the prompt (this will also cascade delete versions if configured)
    const { error: deleteError } = await supabase.from('system_prompts').delete().eq('id', id)

    if (deleteError) {
      console.error('Error deleting system prompt:', deleteError)
      return NextResponse.json({ error: 'Failed to delete system prompt' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'System prompt deleted successfully',
      deleted_prompt: existingPrompt,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
