import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openRouterClient } from '@/lib/openrouter/client'
import { GenerateAutomationRequest } from '@/types/admin'

// POST /api/automations/generate - Generate automation JSON
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { workflow_description }: GenerateAutomationRequest = await request.json()

    if (!workflow_description || workflow_description.trim().length === 0) {
      return NextResponse.json({ error: 'Workflow description is required' }, { status: 400 })
    }

    // Get the json_generation system prompt
    const { data: prompt, error: promptError } = await supabase
      .from('system_prompts')
      .select(
        `
        *,
        system_prompt_training_data(title, content)
      `
      )
      .eq('category', 'json_generation')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (promptError || !prompt) {
      console.error('Error fetching json_generation prompt:', promptError)
      return NextResponse.json({ error: 'JSON generation prompt not available' }, { status: 500 })
    }

    // Create initial automation record with "generating" status
    const { data: automation, error: createError } = await supabase
      .from('automations')
      .insert({
        user_id: user.id,
        prompt_id: prompt.id,
        prompt_version: prompt.version,
        user_input: workflow_description,
        generated_json: {},
        status: 'generating',
        title: `Automation ${new Date().toLocaleDateString()}`,
        user_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Unknown User',
        user_email: user.email,
        user_avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      })
      .select()
      .single()

    if (createError || !automation) {
      console.error('Error creating automation record:', createError)
      return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
    }

    // Return immediately with the automation record
    // Processing will continue in the background
    const response = NextResponse.json({
      success: true,
      automation: automation,
      message: 'Generation started. The automation will be processed in the background.',
    })

    // Start background processing (don't await this)
    processAutomationInBackground(
      automation.id,
      workflow_description,
      prompt.model_id || 'openai/gpt-4o-mini',
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
    ).catch(async (error: unknown) => {
      console.error('Background processing error:', error)
      // Update automation with failed status
      try {
        await supabase
          .from('automations')
          .update({
            status: 'failed',
            description: error instanceof Error ? error.message : 'Background processing failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', automation.id)
        console.log('Updated automation status to failed')
      } catch (updateError) {
        console.error('Failed to update automation status:', updateError)
      }
    })

    return response
  } catch (error) {
    console.error('Error in automation generation:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Background processing function
async function processAutomationInBackground(
  automationId: string,
  workflowDescription: string,
  modelId: string,
  baseUrl: string
) {
  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    console.error('Failed to create Supabase client for background processing:', error)
    return // Cannot proceed
  }

  try {
    console.log(`Starting background processing for automation ${automationId}`)

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timeout after 50 seconds')), 50000)
    )

    const { data: promptData, error: promptError } = await supabase
      .from('system_prompts')
      .select('prompt_content')
      .eq('name', 'json_generation')
      .single()

    if (promptError || !promptData) {
      throw new Error(`Failed to retrieve JSON generation prompt: ${promptError?.message}`)
    }

    const processedPrompt = promptData.prompt_content.replace(
      '{{workflow_description}}',
      workflowDescription
    )

    // Race the generation against a timeout
    const generatedContent = await Promise.race([
      openRouterClient.generateWorkflowJSON(
        workflowDescription,
        {
          is_valid: true,
          confidence: 1,
          estimated_time_hours: 0,
          complexity: 'simple',
          steps: [],
          suggestions: [],
        },
        processedPrompt,
        modelId
      ),
      timeoutPromise,
    ])

    await supabase
      .from('automations')
      .update({
        generated_json: generatedContent,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', automationId)

    console.log(`Successfully completed automation ${automationId}`)

    // Generate image for the automation asynchronously (don't wait for it)
    const imageGenUrl = `${baseUrl}/api/automations/${automationId}/generate-image`

    console.log('Triggering image generation at:', imageGenUrl)

    // No need to await, just fire and forget
    fetch(imageGenUrl, { method: 'POST' })
      .then(res => {
        if (res.ok) {
          console.log('Image generation triggered successfully for automation:', automationId)
        } else {
          res.json().then(err => {
            console.error(`Failed to trigger image generation for automation ${automationId}:`, err)
          })
        }
      })
      .catch(err => {
        console.error(
          `Error triggering image generation fetch for automation ${automationId}:`,
          err
        )
      })

    console.log(`Background processing completed successfully for automation ${automationId}`)
  } catch (error) {
    console.error(`Background processing failed for automation ${automationId}:`, error)
    if (supabase) {
      await supabase
        .from('automations')
        .update({
          status: 'failed',
          description: `Background processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        .eq('id', automationId)
    }
  }
}
