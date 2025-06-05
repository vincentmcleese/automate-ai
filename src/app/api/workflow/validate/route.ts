import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openRouterClient } from '@/lib/openrouter/client'
import { WorkflowValidationResult } from '@/types/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('Workflow validation request received')

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { workflow_description } = requestBody
    console.log('Workflow description length:', workflow_description?.length || 0)

    if (!workflow_description || workflow_description.trim().length === 0) {
      return NextResponse.json({ error: 'Workflow description is required' }, { status: 400 })
    }

    if (workflow_description.length > 10000) {
      return NextResponse.json(
        { error: 'Workflow description is too long (max 10,000 characters)' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    let supabase
    try {
      supabase = await createClient()
      console.log('Supabase client created successfully')
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    // Get the workflow validation system prompt
    console.log('Fetching system prompt...')
    const { data: validationPrompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('prompt_content')
      .eq('name', 'workflow_validation')
      .eq('is_active', true)
      .single()

    if (promptError) {
      console.error('Error fetching validation prompt:', promptError)
      return NextResponse.json(
        { error: 'Validation system prompt not found. Please contact an administrator.' },
        { status: 503 }
      )
    }

    if (!validationPrompt) {
      console.error('No active validation prompt found')
      return NextResponse.json(
        { error: 'Validation system is currently unavailable' },
        { status: 503 }
      )
    }

    console.log('System prompt found, length:', validationPrompt.prompt_content.length)

    // Replace the template variable in the prompt
    const systemPrompt = validationPrompt.prompt_content.replace(
      /\{\{workflow_description\}\}/g,
      workflow_description
    )

    // Get the default model for processing
    console.log('Fetching default model setting...')
    const { data: defaultModelSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'default_model')
      .single()

    let defaultModel = 'openai/gpt-4o-mini' // fallback default

    if (defaultModelSetting?.value) {
      try {
        // Try to parse as JSON first (in case it's stored as JSON string)
        defaultModel = JSON.parse(defaultModelSetting.value)
      } catch {
        // If parsing fails, assume it's already a plain string
        defaultModel = defaultModelSetting.value
      }
    }

    console.log('Using model:', defaultModel)

    // Check if OpenRouter client is available
    if (!process.env.NEXT_OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not configured')
      return NextResponse.json(
        { error: 'AI validation service is not configured. Please contact an administrator.' },
        { status: 503 }
      )
    }

    console.log('OpenRouter API key is configured:', !!process.env.NEXT_OPENROUTER_API_KEY)
    console.log(
      'API key starts with:',
      process.env.NEXT_OPENROUTER_API_KEY?.substring(0, 10) + '...'
    )

    // Call OpenRouter to validate the workflow
    console.log('Calling OpenRouter for validation...')
    let validationResult: WorkflowValidationResult

    try {
      validationResult = await openRouterClient.validateWorkflow(
        workflow_description,
        systemPrompt,
        defaultModel
      )
      console.log('OpenRouter validation completed successfully')
    } catch (error) {
      console.error('OpenRouter validation failed:', error)

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return NextResponse.json(
            { error: 'AI validation service authentication failed' },
            { status: 503 }
          )
        }
        if (error.message.includes('Failed to validate workflow')) {
          return NextResponse.json(
            {
              error:
                'AI validation failed. Please try again or simplify your workflow description.',
            },
            { status: 500 }
          )
        }
      }

      return NextResponse.json(
        { error: 'AI validation service is temporarily unavailable' },
        { status: 503 }
      )
    }

    console.log('Returning validation result')
    return NextResponse.json({
      validation: validationResult,
      model_used: defaultModel,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Unexpected error in workflow validation:', error)

    // Ensure we always return a JSON response
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during validation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
