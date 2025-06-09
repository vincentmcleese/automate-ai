import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check for authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, category_id } = await request.json()

    if (!name || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name and category_id' },
        { status: 400 }
      )
    }

    // Check if the tool already exists in that category to prevent duplicates
    const { data: existingTool, error: existingError } = await supabase
      .from('tools')
      .select('id')
      .eq('name', name)
      .eq('category_id', category_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking for existing tool:', existingError)
      return NextResponse.json({ error: 'Database error while checking for tool' }, { status: 500 })
    }

    if (existingTool) {
      return NextResponse.json({ error: 'Tool already exists in this category' }, { status: 409 })
    }

    // Insert the new tool
    const { data: newTool, error: insertError } = await supabase
      .from('tools')
      .insert({
        name,
        category_id,
        is_active: true,
      })
      .select('id, name, logo_url')
      .single()

    if (insertError) {
      console.error('Error inserting new tool:', insertError)
      return NextResponse.json({ error: 'Failed to add new tool' }, { status: 500 })
    }

    return NextResponse.json(newTool, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in /api/tools/create:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
