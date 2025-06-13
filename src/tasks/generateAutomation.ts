import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { getOpenRouterClient } from '@/lib/openrouter/client'

type AutomationMetadata = {
  title: string
  description: string
  tags: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  estimated_time_hours: number
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
): Promise<string> {
  const openRouterClient = getOpenRouterClient()

  const finalPrompt = `${promptInfo.content}\n\nUser Input: ${userInput}\nSelected Tools: ${tools.join(', ') || 'None'}`

  return openRouterClient.generateText(finalPrompt, 'openai/gpt-4o-mini')
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

/**
 * Generates the initial metadata for an automation and saves it.
 * This part is synchronous.
 */
export async function generateInitialAutomation(
  automationId: string,
  userInput: string,
  selectedTools: Record<number, string>
) {
  const supabase = await createClient()
  const uniqueToolNames = Array.from(new Set(Object.values(selectedTools)))

  const metadataPromptInfo = await getSystemPrompt(supabase, 'metadata_generation')
  const metadata = await generateMetadata(supabase, userInput, uniqueToolNames, metadataPromptInfo)

  const { title, description, tags, complexity, estimated_time_hours } = metadata
  const { error: updateError } = await supabase
    .from('automations')
    .update({
      title,
      description,
      tags,
      complexity,
      estimated_time_hours,
      status: 'generating_workflow',
    })
    .eq('id', automationId)

  if (updateError) {
    throw new Error(`Failed to update automation with metadata: ${updateError.message}`)
  }

  // Fire-and-forget the workflow generation
  generateWorkflowInBackground(automationId, userInput, selectedTools).catch(console.error)
}

/**
 * Generates the workflow JSON in the background.
 */
export async function generateWorkflowInBackground(
  automationId: string,
  userInput: string,
  selectedTools: Record<number, string>
) {
  const supabase = await createClient()
  const uniqueToolNames = Array.from(new Set(Object.values(selectedTools)))

  try {
    const workflowPromptInfo = await getSystemPrompt(supabase, 'json_generation')
    const [generated_json_string, toolRecords] = await Promise.all([
      generateWorkflow(supabase, userInput, uniqueToolNames, workflowPromptInfo),
      getToolIds(supabase, uniqueToolNames),
    ])

    const { error: updateError } = await supabase
      .from('automations')
      .update({
        generated_json: generated_json_string,
        status: 'completed',
        prompt_id: workflowPromptInfo.id,
        prompt_version: workflowPromptInfo.version,
      })
      .eq('id', automationId)

    if (updateError) throw updateError

    if (toolRecords && toolRecords.length > 0) {
      const toolLinks = toolRecords.map(tool => ({
        automation_id: automationId,
        tool_id: tool.id,
      }))
      await supabase.from('automation_tools').insert(toolLinks)
    }

    console.log(`Workflow for automation ${automationId} completed successfully.`)
  } catch (error) {
    console.error(`Error generating workflow for automation ${automationId}:`, error)
    await supabase
      .from('automations')
      .update({ status: 'failed', error_message: 'Workflow generation failed.' })
      .eq('id', automationId)
  }
}
