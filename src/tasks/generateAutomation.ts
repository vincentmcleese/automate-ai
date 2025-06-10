import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { getOpenRouterClient } from '@/lib/openrouter/client'

type AutomationMetadata = {
  title: string
  description: string
  tags: string[]
}

type SystemPromptInfo = {
  content: string
  id: string
  version: number
}

// Helper to fetch the active system prompt from the database
async function getSystemPrompt(
  supabase: SupabaseClient,
  promptName: string
): Promise<SystemPromptInfo> {
  const { data: prompt, error } = await supabase
    .from('system_prompts')
    .select('id, prompt_content, version')
    .eq('name', promptName)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (error || !prompt) {
    throw new Error(`Could not find system prompt: ${promptName}`)
  }
  return { content: prompt.prompt_content, id: prompt.id, version: prompt.version }
}

// Generates metadata by calling the 'metadata_generation' prompt
async function generateMetadata(
  supabase: SupabaseClient,
  userInput: string,
  tools: string[],
  promptInfo: SystemPromptInfo
): Promise<AutomationMetadata> {
  const openRouterClient = getOpenRouterClient()
  const prompt = promptInfo.content
    .replace('{{user_input}}', userInput)
    .replace('{{tools}}', tools.join(', ') || 'None')

  return (await openRouterClient.generateJson(prompt)) as AutomationMetadata
}

// Generates the workflow by calling the 'json_generation' prompt
async function generateWorkflow(
  supabase: SupabaseClient,
  userInput: string,
  tools: string[],
  promptInfo: SystemPromptInfo
): Promise<object> {
  const openRouterClient = getOpenRouterClient()
  const prompt = promptInfo.content
    .replace('{{workflow_description}}', userInput)
    .replace('{{tools}}', tools.join(', ') || 'None')

  return (await openRouterClient.generateJson(prompt)) as object
}

type ToolIdRecord = {
  id: string
  name: string
}

// Helper to get tool UUIDs from their names
async function getToolIds(supabase: SupabaseClient, toolNames: string[]): Promise<ToolIdRecord[]> {
  if (toolNames.length === 0) return []
  const { data, error } = await supabase.from('tools').select('id, name').in('name', toolNames)

  if (error) {
    console.error('Error fetching tool IDs:', error)
    return []
  }
  return (data as ToolIdRecord[]) || []
}

export async function triggerAutomationGeneration(
  automationId: string,
  userInput: string,
  selectedTools: Record<number, string>
) {
  const supabase = await createClient()
  const uniqueToolNames = Array.from(new Set(Object.values(selectedTools)))

  try {
    // Fetch prompts first to get their IDs and versions
    const metadataPromptInfo = await getSystemPrompt(supabase, 'metadata_generation')
    const workflowPromptInfo = await getSystemPrompt(supabase, 'json_generation')

    // Run AI generation tasks in parallel
    const results = await Promise.allSettled([
      generateMetadata(supabase, userInput, uniqueToolNames, metadataPromptInfo),
      generateWorkflow(supabase, userInput, uniqueToolNames, workflowPromptInfo),
      getToolIds(supabase, uniqueToolNames),
    ])

    // All promises fulfilled
    const resultsData = results.map(r => (r.status === 'fulfilled' ? r.value : null))

    const [metadata, generated_json, toolRecords] = resultsData as [
      AutomationMetadata | null,
      object | null,
      ToolIdRecord[] | null,
    ]

    if (!metadata || !generated_json || !toolRecords) {
      const errorReasons = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason.message)
      throw new Error(`Generation failed. Reasons: ${errorReasons.join(', ')}`)
    }

    const { title, description, tags } = metadata
    // Update the automation with the generated data
    const { error: updateError } = await supabase
      .from('automations')
      .update({
        title,
        description,
        tags,
        generated_json: generated_json,
        status: 'completed',
        // Now including the prompt info
        prompt_id: workflowPromptInfo.id,
        prompt_version: workflowPromptInfo.version,
      })
      .eq('id', automationId)

    if (updateError) {
      throw new Error(`Failed to update automation record: ${updateError.message}`)
    }

    // Link the tools to the automation
    if (toolRecords && toolRecords.length > 0) {
      const toolLinks = toolRecords.map(tool => ({
        automation_id: automationId,
        tool_id: tool.id,
      }))
      const { error: toolLinkError } = await supabase.from('automation_tools').insert(toolLinks)
      if (toolLinkError) {
        // This is not a critical failure, so we'll just log it
        console.error('Failed to link tools to automation:', toolLinkError.message)
      }
    }

    console.log(`Automation ${automationId} completed successfully.`)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during generation.'
    console.error(`Error processing automation ${automationId}:`, error)
    // Update the automation to failed status
    await supabase
      .from('automations')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', automationId)
  }
}
