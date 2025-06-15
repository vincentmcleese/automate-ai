import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenRouterClient } from '@/lib/openrouter/client'
import { z } from 'zod'
import { WorkflowStep } from '@/types/admin'
import { createErrorResponse } from '@/lib/api/auth-helpers'

const requestBodySchema = z.object({
  workflow_description: z.string().min(1, 'Workflow description is required'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Optional authentication - allow both authenticated and unauthenticated users
    // but use authenticated client for database access to ensure RLS policies apply
    await supabase.auth.getUser()

    // Note: This endpoint allows unauthenticated access for workflow validation
    // but uses authenticated client to respect RLS policies on system_prompts and tools
    const openRouterClient = getOpenRouterClient()

    const body = await request.json()
    const validation = requestBodySchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse('Invalid request body', 400, validation.error.flatten())
    }

    const { workflow_description } = validation.data

    // 1. Get the validation system prompt from the database
    const { data: promptData, error: promptError } = await supabase
      .from('system_prompts')
      .select('prompt_content')
      .eq('name', 'workflow_validation')
      .eq('is_active', true)
      .single()

    if (promptError || !promptData) {
      console.error('Error fetching validation prompt:', promptError)
      return createErrorResponse(
        'Validation system prompt not found or is inactive.',
        503,
        promptError
      )
    }

    // 2. Call the OpenRouter client to validate the workflow
    const validationResult = await openRouterClient.validateWorkflow(
      workflow_description,
      promptData.prompt_content
    )

    // 3. Augment the result with available tools for each step that needs them
    const SELECTABLE_TOOL_CATEGORIES = [
      'Communication',
      'CRM',
      'Email',
      'File Storage',
      'Project Management',
    ]

    const stepsRequiringTools = (validationResult.steps as WorkflowStep[])?.filter(
      step => step.tool_category && SELECTABLE_TOOL_CATEGORIES.includes(step.tool_category)
    )

    if (stepsRequiringTools && stepsRequiringTools.length > 0) {
      const { data: allTools } = await supabase
        .from('tools')
        .select('name, logo_url, tool_categories(name)')
        .in(
          'category_id',
          (
            await supabase
              .from('tool_categories')
              .select('id')
              .in('name', SELECTABLE_TOOL_CATEGORIES)
          ).data?.map((c: { id: string }) => c.id) || []
        )
        .eq('is_active', true)

      if (allTools) {
        type Tool = {
          name: string
          logo_url: string | null
          tool_categories: { name: string }[] | null
        }

        const toolsByCategory = (allTools as Tool[]).reduce(
          (acc, tool) => {
            // Normalize tool_categories to always be an array
            const categories = Array.isArray(tool.tool_categories)
              ? tool.tool_categories
              : tool.tool_categories
                ? [tool.tool_categories]
                : []

            for (const category of categories) {
              const categoryName = category.name
              if (categoryName) {
                if (!acc[categoryName]) acc[categoryName] = []
                acc[categoryName].push({ name: tool.name, logo_url: tool.logo_url ?? undefined })
              }
            }
            return acc
          },
          {} as Record<string, { name: string; logo_url?: string }[]>
        )

        for (const step of validationResult.steps as WorkflowStep[]) {
          if (step.tool_category && toolsByCategory[step.tool_category]) {
            step.available_tools = toolsByCategory[step.tool_category]
          }
        }
      }
    }

    // 4. Return the final validation result
    return NextResponse.json({ validation: validationResult })
  } catch (error) {
    console.error('Unexpected error in workflow validation:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available',
    })
    return createErrorResponse(
      'An unexpected error occurred.',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    )
  }
}
