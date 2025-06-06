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

    const body: GenerateAutomationRequest = await request.json()
    const { workflow_description } = body

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

    // Combine prompt with training data
    let fullPrompt = prompt.prompt_content
    if (prompt.system_prompt_training_data && prompt.system_prompt_training_data.length > 0) {
      const trainingContent = prompt.system_prompt_training_data
        .map((td: any) => `## ${td.title}\n\n${td.content}`)
        .join('\n\n')
      fullPrompt = `${prompt.prompt_content}\n\n${trainingContent}`
    }

    // Replace template variables in prompt
    const processedPrompt = fullPrompt.replace(
      /\{\{workflow_description\}\}/g,
      workflow_description
    )

    // Determine model to use
    const modelId = prompt.model_id || 'openai/gpt-4o-mini' // fallback to default

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

    try {
      // Generate JSON using OpenRouter
      console.log(`Starting JSON generation for user ${user.id} with model ${modelId}`)
      console.log(`Workflow description length: ${workflow_description.length} characters`)
      console.log(`Full prompt length: ${processedPrompt.length} characters`)

      const generatedContent = await openRouterClient.generateWorkflowJSON(
        workflow_description,
        {}, // No validation results needed for direct generation
        processedPrompt,
        modelId
      )

      console.log('JSON generation completed successfully')
      console.log('Generated JSON structure:', Object.keys(generatedContent))

      // The generateWorkflowJSON method already returns parsed JSON
      const generatedJson = generatedContent

      // Update automation with generated JSON
      const { data: updatedAutomation, error: updateError } = await supabase
        .from('automations')
        .update({
          generated_json: generatedJson,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', automation.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating automation:', updateError)
        return NextResponse.json({ error: 'Failed to save generated JSON' }, { status: 500 })
      }

      console.log('Automation updated successfully:', updatedAutomation.id)

      // Generate image for the automation asynchronously (don't wait for it)
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const host = request.headers.get('host') || 'localhost:3001'
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
      const imageGenUrl = `${baseUrl}/api/automations/${updatedAutomation.id}/generate-image`
      console.log('Triggering image generation at:', imageGenUrl)

      fetch(imageGenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            console.log(
              'Image generation triggered successfully for automation:',
              updatedAutomation.id
            )
          } else {
            console.error('Image generation request failed with status:', response.status)
          }
        })
        .catch(error => {
          console.error('Failed to generate automation image:', error)
          // Don't fail the main automation creation if image generation fails
        })

      return NextResponse.json({
        success: true,
        automation: updatedAutomation,
      })
    } catch (aiError) {
      console.error('Error generating automation:', aiError)

      // Update automation with failed status
      await supabase
        .from('automations')
        .update({
          status: 'failed',
          description: aiError instanceof Error ? aiError.message : 'Unknown error occurred',
          updated_at: new Date().toISOString(),
        })
        .eq('id', automation.id)

      return NextResponse.json(
        {
          error: 'Failed to generate automation',
          details: aiError instanceof Error ? aiError.message : 'Unknown error',
          automation_id: automation.id,
        },
        { status: 500 }
      )
    }
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
