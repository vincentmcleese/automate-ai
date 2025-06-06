import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openRouterClient } from '@/lib/openrouter/client'

// POST /api/automations/[id]/generate-image - Generate image for automation
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('🎨 Image generation endpoint called')

  try {
    const supabase = await createClient()
    const { id } = await params

    console.log('📝 Fetching automation:', id)

    // Get the automation details
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single()

    if (automationError || !automation) {
      console.error('❌ Automation not found:', automationError)
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    console.log('✅ Automation found:', automation.title)

    // Get the image generation prompt
    console.log('🔍 Fetching image generation prompt...')

    // First, let's see all prompts for debugging
    const { data: allPrompts } = await supabase
      .from('system_prompts')
      .select('id, name, category, is_active')

    console.log('📋 All prompts in database:', allPrompts)
    console.log('🔍 Looking for category: "image_generation"')

    const { data: imagePrompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('category', 'image_generation')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('📝 Query result:', { imagePrompt: imagePrompt?.name || null, promptError })

    if (promptError || !imagePrompt) {
      console.error('❌ Image generation prompt not found:', promptError)
      return NextResponse.json({ error: 'Image generation prompt not available' }, { status: 500 })
    }

    console.log('✅ Found image generation prompt:', imagePrompt.name)

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

    console.log('🤖 Generating image prompt with OpenRouter...')

    // Add timeout for the OpenRouter call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OpenRouter request timeout')), 30000)
    )

    // Generate image prompt using OpenRouter with timeout
    const imagePromptText = (await Promise.race([
      openRouterClient.generateContent(
        processedPrompt,
        imagePrompt.model_id || 'openai/gpt-4o-mini'
      ),
      timeoutPromise,
    ])) as string

    console.log('✅ Image prompt generated:', imagePromptText.substring(0, 100) + '...')

    // Generate image using DALL-E directly through OpenAI (not OpenRouter)
    console.log('🎨 Generating image with DALL-E...')
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

    console.log('📊 DALL-E API response status:', imageResponse.status)

    if (!imageResponse.ok) {
      let errorMessage = `DALL-E API failed with status ${imageResponse.status}`
      try {
        const errorData = await imageResponse.json()
        console.error('❌ DALL-E API error (JSON):', errorData)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        // Response is not JSON, try to get text
        try {
          const errorText = await imageResponse.text()
          console.error('❌ DALL-E API error (text):', errorText)
          errorMessage = errorText || errorMessage
        } catch {
          console.error('❌ DALL-E API error: Could not parse response')
        }
      }
      return NextResponse.json(
        { error: 'Failed to generate image', details: errorMessage },
        { status: 500 }
      )
    }

    const imageData = await imageResponse.json()
    console.log('📷 DALL-E response structure:', Object.keys(imageData))

    const imageUrl = imageData.data?.[0]?.url

    if (!imageUrl) {
      console.error('❌ No image URL returned from DALL-E, response:', imageData)
      return NextResponse.json({ error: 'No image URL returned' }, { status: 500 })
    }

    console.log('✅ Image URL received:', imageUrl.substring(0, 100) + '...')

    console.log('📥 Downloading and storing image...')

    // Download the image and upload to Supabase Storage
    const imageBlob = await fetch(imageUrl).then(r => r.blob())
    const fileName = `automation-${automation.id}-${Date.now()}.png`

    // Upload to Supabase Storage
    console.log('📤 Uploading image to Supabase Storage...')
    const { error: uploadError } = await supabase.storage
      .from('automation-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to store image', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('automation-images')
      .getPublicUrl(fileName)

    const storedImageUrl = publicUrlData.publicUrl
    console.log('✅ Image stored at:', storedImageUrl)

    // Update automation with image URL
    const { data: updatedAutomation, error: updateError } = await supabase
      .from('automations')
      .update({ image_url: storedImageUrl })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating automation with image URL:', updateError)
      return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 })
    }

    console.log('🎉 Image generation completed successfully!')

    return NextResponse.json({
      success: true,
      image_url: storedImageUrl,
      automation: updatedAutomation,
    })
  } catch (error) {
    console.error('💥 Error in image generation:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
