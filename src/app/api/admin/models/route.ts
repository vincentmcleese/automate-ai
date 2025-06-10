import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, isValidModelId } from '@/lib/admin/utils'
import { CreateOpenRouterModelData } from '@/types/admin'
import { getOpenRouterClient } from '@/lib/openrouter/client'

// Define a more specific type for the OpenRouter model payload
type OpenRouterModelPayload = {
  id: string
  name: string
  description: string
  context_length: number
  pricing?: {
    prompt?: string
    completion?: string
  }
  top_provider?: {
    supports_function_calling?: boolean
    supports_streaming?: boolean
  }
}

// GET /api/admin/models - List all models
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
    const isActive = searchParams.get('active')
    const sync = searchParams.get('sync') === 'true'

    // If sync is requested, fetch latest models from OpenRouter
    if (sync) {
      try {
        const openRouterClient = getOpenRouterClient()
        const latestModels = await openRouterClient.getAvailableModels()

        // Update our database with latest model information
        for (const model of latestModels) {
          if (isValidModelId(model.id)) {
            const modelWithPricing = model as OpenRouterModelPayload
            await supabase.from('openrouter_models').upsert(
              {
                id: model.id,
                name: model.name,
                description: model.description,
                context_length: model.context_length,
                pricing_prompt: modelWithPricing.pricing?.prompt
                  ? parseFloat(modelWithPricing.pricing.prompt)
                  : null,
                pricing_completion: modelWithPricing.pricing?.completion
                  ? parseFloat(modelWithPricing.pricing.completion)
                  : null,
                supports_function_calling:
                  modelWithPricing.top_provider?.supports_function_calling || false,
                supports_streaming: modelWithPricing.top_provider?.supports_streaming !== false,
              },
              {
                onConflict: 'id',
                ignoreDuplicates: false,
              }
            )
          }
        }
      } catch (error) {
        console.error('Error syncing models from OpenRouter:', error)
        // Continue with existing data if sync fails
      }
    }

    let query = supabase.from('openrouter_models').select('*').order('name', { ascending: true })

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: models, error } = await query

    if (error) {
      console.error('Error fetching models:', error)
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
    }

    return NextResponse.json({ models })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/admin/models - Create/add new model
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
    const modelData: CreateOpenRouterModelData = {
      id: body.id,
      name: body.name,
      description: body.description,
      context_length: body.context_length,
      pricing_prompt: body.pricing_prompt,
      pricing_completion: body.pricing_completion,
      is_active: body.is_active !== false,
      supports_function_calling: body.supports_function_calling || false,
      supports_streaming: body.supports_streaming !== false,
    }

    // Validate model ID format
    if (!isValidModelId(modelData.id)) {
      return NextResponse.json(
        { error: 'Invalid model ID format. Expected format: provider/model-name' },
        { status: 400 }
      )
    }

    // Basic validation
    if (!modelData.name || modelData.name.trim().length === 0) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    }

    // Check if model already exists
    const { data: existing } = await supabase
      .from('openrouter_models')
      .select('id')
      .eq('id', modelData.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Model with this ID already exists' }, { status: 409 })
    }

    // Test the model if OpenRouter API key is available
    let isWorking = false
    try {
      isWorking = await getOpenRouterClient().testModel(modelData.id)
    } catch (error) {
      console.warn(`Could not test model ${modelData.id}:`, error)
    }

    // Insert the new model
    const { data: newModel, error } = await supabase
      .from('openrouter_models')
      .insert(modelData)
      .select()
      .single()

    if (error) {
      console.error('Error creating model:', error)
      return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
    }

    return NextResponse.json(
      {
        model: newModel,
        test_result: isWorking ? 'working' : 'unknown',
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied'
    const status = message.includes('required') ? 401 : 403
    return NextResponse.json({ error: message }, { status })
  }
}
