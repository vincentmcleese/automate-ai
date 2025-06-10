import { WorkflowValidationResult } from '@/types/admin'

// A more specific type for the Site object could be defined if needed.
interface Site {
  name: string
  url: string
  description?: string
  ogImage?: string
}

export const siteConfig: Site = {
  name: 'AutomateAI',
  url: 'https://www.automateai.dev',
}

export type OpenRouterModel = {
  id: string
  name: string
  description: string
  context_length: number
}

// Specific types for OpenRouter API responses
interface ChatCompletionResponse {
  choices: Array<{
    message?: {
      content: string | null
    }
  }>
}

interface ModelsResponse {
  data: OpenRouterModel[]
}

export class OpenRouterClient {
  private apiKey: string
  private referer: string

  constructor() {
    if (!process.env.NEXT_OPENROUTER_API_KEY) {
      throw new Error('NEXT_OPENROUTER_API_KEY is not set in environment variables.')
    }
    this.apiKey = process.env.NEXT_OPENROUTER_API_KEY
    this.referer = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  /**
   * A generic, private method to make a call to the OpenRouter chat completions API.
   * It enforces a JSON response format.
   */
  private async callApi(prompt: string, model: string): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.referer,
          'X-Title': 'AutomateAI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`)
      }

      const data: ChatCompletionResponse = await response.json()
      const content = data.choices[0]?.message?.content
      if (!content) {
        throw new Error('Received empty content from OpenRouter API.')
      }
      return content
    } catch (error) {
      console.error(`Error calling OpenRouter with model ${model}:`, error)
      throw error // Re-throw after logging
    }
  }

  /**
   * Public method for validating a workflow description.
   */
  public async validateWorkflow(
    workflowDescription: string,
    systemPrompt: string
  ): Promise<WorkflowValidationResult> {
    const model = 'anthropic/claude-3.5-sonnet'
    const fullPrompt = `${systemPrompt}\n\nWorkflow Description:\n"""${workflowDescription}"""`
    const jsonContent = await this.callApi(fullPrompt, model)

    try {
      const parsed: WorkflowValidationResult = JSON.parse(jsonContent)
      return parsed
    } catch {
      console.error('Failed to parse workflow validation JSON. Raw content:', jsonContent)
      throw new Error('The AI returned an invalid JSON format for workflow validation.')
    }
  }

  /**
   * Public method for any generation task that requires a JSON output.
   * This will be used for both metadata and the final workflow JSON.
   */
  public async generateJson(prompt: string): Promise<unknown> {
    // Using a smaller, faster model for generation tasks.
    const model = 'mistralai/mistral-7b-instruct:free'
    const rawContent = await this.callApi(prompt, model)
    try {
      // Find the first '{' and the last '}' to isolate the JSON object.
      // This is more robust against conversational text or variations in markdown fences.
      const jsonStart = rawContent.indexOf('{')
      const jsonEnd = rawContent.lastIndexOf('}')

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
        throw new Error('Could not find a valid JSON object in the AI response.')
      }

      let jsonString = rawContent.substring(jsonStart, jsonEnd + 1)

      // Clean common smart quotes
      jsonString = jsonString.replace(/”|“/g, '"')

      // Escape unescaped double quotes inside n8n expressions {{...}}
      jsonString = jsonString.replace(/\{\{([\s\S]+?)\}\}/g, (match, innerContent) => {
        const fixedInnerContent = innerContent.replace(/"/g, '\\"')
        return `{{${fixedInnerContent}}}`
      })

      const parsedJson = JSON.parse(jsonString)

      // Final, most important step: Remove the connections array.
      // n8n will recalculate them on import, which is more reliable
      // than trying to get the AI to generate them perfectly.
      if (typeof parsedJson === 'object' && parsedJson !== null && 'connections' in parsedJson) {
        delete (parsedJson as { connections: unknown }).connections
      }

      return parsedJson
    } catch (error) {
      console.error('Failed to parse generated JSON. Raw content:', rawContent)
      if (error instanceof SyntaxError) {
        throw new Error(`The AI returned invalid JSON: ${error.message}`)
      }
      throw new Error('The AI returned an invalid or unrecoverable JSON format during generation.')
    }
  }

  public async complete(
    prompt: string,
    model: string,
    options: { temperature?: number; max_tokens?: number } = {}
  ): Promise<string> {
    const { temperature = 0.7, max_tokens = 1000 } = options
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.referer,
          'X-Title': 'AutomateAI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`)
      }

      const data: ChatCompletionResponse = await response.json()
      const content = data.choices[0]?.message?.content
      if (!content) {
        throw new Error('Received empty content from OpenRouter API.')
      }
      return content
    } catch (error) {
      console.error(`Error calling OpenRouter with model ${model}:`, error)
      throw error
    }
  }

  public async generateWorkflowJSON(
    workflowDescription: string,
    validationResults: WorkflowValidationResult
  ): Promise<unknown> {
    const userInput = `Workflow: ${workflowDescription}\n\nValidation Results: ${JSON.stringify(
      validationResults,
      null,
      2
    )}`
    const model = 'openai/gpt-4o-mini'
    const jsonContent = await this.callApi(userInput, model)
    try {
      return JSON.parse(jsonContent)
    } catch (error) {
      console.error('Failed to parse generation JSON:', error)
      throw new Error('The AI returned an invalid JSON format for generation.')
    }
  }

  public async getAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      const data: ModelsResponse = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error)
      return []
    }
  }

  public async testModel(modelId: string): Promise<boolean> {
    try {
      const content = await this.callApi(
        'Respond with just the word "OK" if you can see this message.',
        modelId
      )
      return content.toLowerCase().includes('ok')
    } catch (error) {
      console.error(`Model test failed for ${modelId}:`, error)
      return false
    }
  }
}

// Singleton instance of the client
let clientInstance: OpenRouterClient | null = null
export function getOpenRouterClient(): OpenRouterClient {
  if (!clientInstance) {
    clientInstance = new OpenRouterClient()
  }
  return clientInstance
}
