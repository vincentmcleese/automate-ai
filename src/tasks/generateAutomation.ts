import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { getOpenRouterClient } from '@/lib/openrouter/client'
import { generateSlug } from '@/lib/utils/slugify'

type AutomationMetadata = {
  title: string
  description: string
  tags: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  estimated_time_hours: number
}

type TrainingData = {
  title: string
  content: string
}

type SystemPromptInfo = {
  content: string
  id: string
  version: number
  trainingData: TrainingData[]
  modelId: string | null
}

// Helper to fetch the active system prompt and its training data from the database
async function getSystemPrompt(
  supabase: SupabaseClient,
  promptName: string
): Promise<SystemPromptInfo> {
  const { data: prompt, error } = await supabase
    .from('system_prompts')
    .select(
      `
      id, 
      prompt_content, 
      version,
      model_id,
      system_prompt_training_data (
        title,
        content
      )
    `
    )
    .eq('name', promptName)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (error || !prompt) {
    throw new Error(`Could not find system prompt: ${promptName}. Error: ${error?.message}`)
  }
  return {
    content: prompt.prompt_content,
    id: prompt.id,
    version: prompt.version,
    trainingData: prompt.system_prompt_training_data as TrainingData[],
    modelId: prompt.model_id,
  }
}

// Generates metadata by calling the 'metadata_generation' prompt
async function generateMetadata(
  supabase: SupabaseClient,
  userInput: string,
  tools: string[],
  promptInfo: SystemPromptInfo
): Promise<AutomationMetadata> {
  const openRouterClient = getOpenRouterClient()

  // 1. System Prompt
  let prompt = `# System Prompt\n\n${promptInfo.content}`

  // 2. Training Data
  if (promptInfo.trainingData && promptInfo.trainingData.length > 0) {
    const trainingSection = promptInfo.trainingData
      .map(data => `## ${data.title}\n\n${data.content}`)
      .join('\n\n')
    prompt += `\n\n# Training Examples\n\n${trainingSection}`
  }

  // 3. User Input
  const inputData = `User Input: ${userInput}\nSelected Tools: ${tools.join(', ') || 'None'}`
  prompt += `\n\n# Input\n\n${inputData}`

  const model = promptInfo.modelId || 'mistralai/mistral-7b-instruct:free'
  return (await openRouterClient.generateJson(prompt, model, 4096)) as AutomationMetadata
}

// Generates the workflow by calling the 'json_generation' prompt
async function generateWorkflow(
  supabase: SupabaseClient,
  userInput: string,
  tools: string[],
  promptInfo: SystemPromptInfo
): Promise<string> {
  const openRouterClient = getOpenRouterClient()

  // 1. System Prompt
  let finalPrompt = `# System Prompt\n\n${promptInfo.content}`

  // 2. Training Data
  if (promptInfo.trainingData && promptInfo.trainingData.length > 0) {
    const trainingSection = promptInfo.trainingData
      .map(data => `## ${data.title}\n\n${data.content}`)
      .join('\n\n')
    finalPrompt += `\n\n# Training Examples\n\n${trainingSection}`
  }

  // 3. User Input
  const inputData = `User Input: ${userInput}\nSelected Tools: ${tools.join(', ') || 'None'}`
  finalPrompt += `\n\n# Input\n\n${inputData}`

  const model = promptInfo.modelId || 'openai/gpt-4o-mini'
  const rawResponse = await openRouterClient.generateText(finalPrompt, model, 8192)

  // Clean the response by removing markdown code block wrapper
  let cleanedJson = rawResponse.trim()

  // Remove markdown code block wrapper if present
  if (cleanedJson.startsWith('```json')) {
    cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedJson.startsWith('```')) {
    cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  // Validate that it's proper JSON by parsing and re-stringifying
  try {
    const parsed = JSON.parse(cleanedJson)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    console.error('Failed to parse cleaned JSON:', error)
    console.error('Cleaned JSON content:', cleanedJson.substring(0, 500) + '...')
    // Return the cleaned content as-is if parsing fails
    return cleanedJson
  }
}

// Generates automation guide by calling the 'automation_guide' prompt
export async function generateAutomationGuide(
  supabase: SupabaseClient,
  automationJson: string,
  automationTitle: string,
  automationDescription: string,
  promptInfo: SystemPromptInfo
): Promise<string> {
  const openRouterClient = getOpenRouterClient()

  // 1. System Prompt
  let finalPrompt = `# System Prompt\n\n${promptInfo.content}`

  // 2. Training Data
  if (promptInfo.trainingData && promptInfo.trainingData.length > 0) {
    const trainingSection = promptInfo.trainingData
      .map(data => `## ${data.title}\n\n${data.content}`)
      .join('\n\n')
    finalPrompt += `\n\n# Training Examples\n\n${trainingSection}`
  }

  // 3. User Input (Automation Data)
  const inputData = `Automation Title: ${automationTitle}\n\nAutomation Description: ${automationDescription}\n\nAutomation JSON:\n\`\`\`json\n${automationJson}\n\`\`\``
  finalPrompt += `\n\n# Input\n\n${inputData}`

  const model = promptInfo.modelId || 'openai/gpt-4o'
  return openRouterClient.generateText(finalPrompt, model, 8192)
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

  // Generate slug from title
  const slug = generateSlug(title)

  const { error: updateError } = await supabase
    .from('automations')
    .update({
      title,
      description,
      slug,
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

    // Parse the JSON string to store as proper JSONB
    const jsonObject = JSON.parse(generated_json_string)

    const { error: updateError } = await supabase
      .from('automations')
      .update({
        generated_json: jsonObject,
        status: 'generating_guide',
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

    // Generate automation guide in the background
    generateAutomationGuideInBackground(automationId).catch(console.error)
  } catch (error) {
    console.error(`Error generating workflow for automation ${automationId}:`, error)
    await supabase
      .from('automations')
      .update({ status: 'failed', error_message: 'Workflow generation failed.' })
      .eq('id', automationId)
  }
}

/**
 * Generates the automation guide in the background after successful JSON generation.
 */
export async function generateAutomationGuideInBackground(automationId: string) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  try {
    console.log(`Starting guide generation for automation ${automationId}`)

    // Fetch the automation data (should be in generating_guide status)
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('title, description, generated_json')
      .eq('id', automationId)
      .eq('status', 'generating_guide')
      .single()

    if (fetchError || !automation) {
      console.error(`Failed to fetch automation ${automationId} for guide generation:`, fetchError)
      return
    }

    console.log(
      `Found automation: "${automation.title}" with JSON length: ${JSON.stringify(automation.generated_json).length}`
    )

    // Get the automation guide prompt using admin client
    console.log('Attempting to fetch automation guide prompt...')
    let guidePromptInfo
    try {
      guidePromptInfo = await getSystemPrompt(supabaseAdmin, 'automation_guide_generation')
      console.log('Successfully fetched automation guide prompt:', guidePromptInfo.id)
    } catch (promptError) {
      console.error('Failed to fetch automation guide prompt:', promptError)
      return
    }

    // Generate the automation guide
    console.log('Starting automation guide generation...')
    let automationGuide: string
    try {
      automationGuide = await generateAutomationGuide(
        supabase,
        JSON.stringify(automation.generated_json, null, 2), // Pretty-formatted JSON
        automation.title || 'Untitled Automation',
        automation.description || 'No description provided',
        guidePromptInfo
      )
      console.log('Automation guide generated successfully, length:', automationGuide.length)
    } catch (guideError) {
      console.error('Error generating automation guide:', guideError)
      // Continue execution - guide generation failure shouldn't break the process
      return
    }

    // Save the guide to the database
    const { error: updateError } = await supabase
      .from('automations')
      .update({
        automation_guide: automationGuide,
        status: 'completed',
      })
      .eq('id', automationId)

    if (updateError) {
      console.error(`Failed to save automation guide for ${automationId}:`, updateError)
      return
    }

    console.log(`Automation guide for ${automationId} generated successfully.`)
  } catch (error) {
    console.error(`Error generating automation guide for ${automationId}:`, error)
    // Note: We don't update the automation status to 'failed' for guide generation
    // since the main automation JSON generation was successful
  }
}
