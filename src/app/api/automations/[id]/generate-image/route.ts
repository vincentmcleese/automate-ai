import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getOpenRouterClient } from '@/lib/openrouter/client'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/auth-helpers'
import { validateRouteParams, automationParamsSchema } from '@/lib/api/validation'

// POST /api/automations/[id]/generate-image - Generate image for automation
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Authenticate user first
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return createErrorResponse('Authentication required', 401)
  }

  const { id } = await params

  // Validate automation ID
  const paramValidation = validateRouteParams({ id }, automationParamsSchema)
  if (!paramValidation.success) {
    return createErrorResponse('Invalid automation ID', 400)
  }

  try {
    const openRouterClient = getOpenRouterClient()

    // Get the automation details (with ownership check)
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this automation
      .single()

    if (automationError || !automation) {
      return createErrorResponse('Automation not found', 404)
    }

    // Get the image generation prompt
    const { data: imagePrompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('category', 'image_generation')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (promptError || !imagePrompt) {
      return createErrorResponse('Image generation prompt not available', 500)
    }

    // Extract workflow summary from generated JSON
    const workflowSummary =
      automation.generated_json?.description ||
      automation.description ||
      'Automated workflow with various steps and processes'

    // Process the prompt template
    const processedPrompt = imagePrompt.prompt_content
      .replace(/\{\{automation_title\}\}/g, automation.title || 'Automation Workflow')
      .replace(
        /\{\{automation_description\}\}/g,
        automation.description || automation.user_input.substring(0, 200)
      )
      .replace(/\{\{workflow_summary\}\}/g, workflowSummary)

    // Call OpenRouter to generate the image prompt
    const imagePromptText = await openRouterClient.complete(processedPrompt, 'openai/gpt-4o-mini', {
      temperature: 0.8,
      max_tokens: 300,
    })

    if (!imagePromptText) {
      return createErrorResponse('Failed to generate image prompt', 500)
    }

    // Generate image using DALL-E directly through OpenAI (not OpenRouter)
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePromptText,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      }),
    })

    if (!imageResponse.ok) {
      // Log detailed error for debugging but don't expose to client
      try {
        const errorData = await imageResponse.json()
        console.error('DALL-E API error:', {
          status: imageResponse.status,
          error: errorData,
        })
      } catch {
        console.error('DALL-E API error:', {
          status: imageResponse.status,
          text: await imageResponse.text().catch(() => 'Could not read response'),
        })
      }

      return createErrorResponse('Failed to generate image', 500)
    }

    const imageData = await imageResponse.json()
    const imageUrl = imageData.data?.[0]?.url

    if (!imageUrl) {
      console.error('No image URL returned from DALL-E')
      return createErrorResponse('No image URL returned', 500)
    }

    // Download the image and upload to Supabase Storage
    const imageBlob = await fetch(imageUrl).then(r => r.blob())
    const fileName = `automation-${automation.id}-${Date.now()}.png`

    // Create service role client for storage upload (bypasses RLS)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SERVICE_ROLE_SUPABASE_KEY!
    )

    // Upload to Supabase Storage using service role
    const { error: uploadError } = await serviceSupabase.storage
      .from('automation-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return createErrorResponse('Failed to store image', 500)
    }

    // Get the public URL using the service client
    const { data: publicUrlData } = serviceSupabase.storage
      .from('automation-images')
      .getPublicUrl(fileName)

    const storedImageUrl = publicUrlData.publicUrl

    // Update automation with image URL using regular client
    const { data: updatedAutomation, error: updateError } = await supabase
      .from('automations')
      .update({ image_url: storedImageUrl })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure ownership
      .select()
      .single()

    if (updateError) {
      console.error('Error updating automation with image URL:', updateError)
      return createErrorResponse('Failed to save image URL', 500)
    }

    return createSuccessResponse({
      image_url: storedImageUrl,
      automation: updatedAutomation,
    })
  } catch (error) {
    console.error('Error in image generation:', error)
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    )
  }
}
