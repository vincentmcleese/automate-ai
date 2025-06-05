import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/utils'
import { UpdateTrainingDataData } from '@/types/admin'

// GET /api/admin/system-prompts/[id]/training-data/[trainingId] - Get specific training data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trainingId: string }> }
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

    const { id, trainingId } = await params

    const { data: trainingData, error } = await supabase
      .from('system_prompt_training_data')
      .select('*')
      .eq('id', trainingId)
      .eq('system_prompt_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Training data not found' }, { status: 404 })
      }
      console.error('Error fetching training data:', error)
      return NextResponse.json({ error: 'Failed to fetch training data' }, { status: 500 })
    }

    return NextResponse.json({ training_data: trainingData })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH /api/admin/system-prompts/[id]/training-data/[trainingId] - Update training data
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trainingId: string }> }
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

    const { id, trainingId } = await params
    const body = await request.json()

    const updateData: UpdateTrainingDataData = {}

    if (body.title !== undefined) {
      if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      updateData.title = body.title.trim()
    }

    if (body.content !== undefined) {
      if (!body.content || body.content.trim().length === 0) {
        return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 })
      }
      updateData.content = body.content.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the training data
    const { data: updatedTrainingData, error } = await supabase
      .from('system_prompt_training_data')
      .update(updateData)
      .eq('id', trainingId)
      .eq('system_prompt_id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Training data not found' }, { status: 404 })
      }
      console.error('Error updating training data:', error)
      return NextResponse.json({ error: 'Failed to update training data' }, { status: 500 })
    }

    return NextResponse.json({ training_data: updatedTrainingData })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/admin/system-prompts/[id]/training-data/[trainingId] - Delete training data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trainingId: string }> }
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

    const { id, trainingId } = await params

    // Check if training data exists before deleting
    const { data: existingData, error: fetchError } = await supabase
      .from('system_prompt_training_data')
      .select('id, title')
      .eq('id', trainingId)
      .eq('system_prompt_id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Training data not found' }, { status: 404 })
      }
      console.error('Error fetching training data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch training data' }, { status: 500 })
    }

    // Delete the training data
    const { error: deleteError } = await supabase
      .from('system_prompt_training_data')
      .delete()
      .eq('id', trainingId)
      .eq('system_prompt_id', id)

    if (deleteError) {
      console.error('Error deleting training data:', deleteError)
      return NextResponse.json({ error: 'Failed to delete training data' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Training data deleted successfully',
      deleted_data: existingData,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
