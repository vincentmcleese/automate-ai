import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openRouterClient } from '@/lib/openrouter/client'
import { WorkflowValidationResult } from '@/types/admin'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { workflow_description, debug_mode } = requestBody

    // Debug mode for testing system components
    if (debug_mode) {
      console.log('Debug mode enabled - testing system components')

      // Test Supabase connection
      let supabase
      try {
        supabase = await createClient()
        console.log('✓ Supabase client created successfully')
      } catch (error) {
        console.error('✗ Supabase client creation failed:', error)
        return NextResponse.json(
          {
            debug: {
              supabase: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          { status: 500 }
        )
      }

      // Test system prompt retrieval
      let validationPrompt
      try {
        const { data, error: promptError } = await supabase
          .from('system_prompts')
          .select('prompt_content, name')
          .eq('name', 'workflow_validation')
          .eq('is_active', true)
          .single()

        if (promptError) throw promptError
        validationPrompt = data
        console.log('✓ System prompt retrieved successfully')
      } catch (error) {
        console.error('✗ System prompt retrieval failed:', error)
        return NextResponse.json(
          {
            debug: {
              supabase: true,
              systemPrompt: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          { status: 500 }
        )
      }

      // Test OpenRouter API key
      if (!process.env.NEXT_OPENROUTER_API_KEY) {
        console.error('✗ OpenRouter API key not configured')
        return NextResponse.json(
          {
            debug: {
              supabase: true,
              systemPrompt: true,
              openRouterKey: false,
              error: 'API key not configured',
            },
          },
          { status: 500 }
        )
      }
      console.log('✓ OpenRouter API key is configured')

      // Test basic OpenRouter connectivity
      try {
        const testResult = await openRouterClient.validateWorkflow(
          'Test workflow: Send an email when a form is submitted',
          validationPrompt.prompt_content.replace(
            '{{workflow_description}}',
            'Test workflow: Send an email when a form is submitted'
          ),
          'openai/gpt-4o-mini'
        )
        console.log('✓ OpenRouter test validation successful')

        return NextResponse.json({
          debug: {
            supabase: true,
            systemPrompt: true,
            openRouterKey: true,
            openRouterTest: true,
            testResult: testResult,
          },
        })
      } catch (error) {
        console.error('✗ OpenRouter test validation failed:', error)
        return NextResponse.json(
          {
            debug: {
              supabase: true,
              systemPrompt: true,
              openRouterKey: true,
              openRouterTest: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          { status: 500 }
        )
      }
    }

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
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    // Get the workflow validation system prompt
    console.log('Fetching workflow validation system prompt...')
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

    console.log('Found validation prompt, preparing system prompt...')

    // Replace the template variable in the prompt
    const systemPrompt = validationPrompt.prompt_content.replace(
      /\{\{workflow_description\}\}/g,
      workflow_description
    )

    // Get the default model for processing
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

    console.log('OpenRouter API key is configured, calling validation...')

    // Call OpenRouter to validate the workflow
    let validationResult: WorkflowValidationResult

    try {
      console.log('Calling OpenRouter validateWorkflow with:', {
        workflowLength: workflow_description.length,
        systemPromptLength: systemPrompt.length,
        model: defaultModel,
      })

      validationResult = await openRouterClient.validateWorkflow(
        workflow_description,
        systemPrompt,
        defaultModel
      )

      console.log('OpenRouter validation successful:', {
        isValid: validationResult.is_valid,
        confidence: validationResult.confidence,
      })
    } catch (error) {
      console.error('OpenRouter validation failed with error:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      })

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          console.error('API key authentication issue detected')
          return NextResponse.json(
            { error: 'AI validation service authentication failed' },
            { status: 503 }
          )
        }
        if (error.message.includes('Failed to validate workflow')) {
          console.error('Workflow validation failed - likely JSON parsing or model response issue')
          return NextResponse.json(
            {
              error:
                'AI validation failed. Please try again or simplify your workflow description.',
            },
            { status: 500 }
          )
        }
        if (error.message.includes('fetch')) {
          console.error('Network/fetch error detected')
          return NextResponse.json(
            { error: 'Network error communicating with AI service' },
            { status: 503 }
          )
        }
      }

      return NextResponse.json(
        { error: 'AI validation service is temporarily unavailable' },
        { status: 503 }
      )
    }

    console.log('Validation complete, returning result')
    return NextResponse.json({
      validation: validationResult,
      model_used: defaultModel,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Unexpected error in workflow validation:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    })

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
