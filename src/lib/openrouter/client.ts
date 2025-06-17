import { WorkflowValidationResult } from '@/types/admin'

// A more specific type for the Site object could be defined if needed.
interface Site {
  name: string
  url: string
  description?: string
  ogImage?: string
}

export const siteConfig: Site = {
  name: 'Launch GhostTeam',
  url: 'https://launch.ghostteam.ai',
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
    finish_reason?: string
  }>
}

interface ModelsResponse {
  data: OpenRouterModel[]
}

// Internal type for API response with truncation status
interface ApiResponse {
  content: string
  wasTruncated: boolean
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
  private async callApi(prompt: string, model: string, max_tokens?: number): Promise<ApiResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.referer,
          'X-Title': 'Launch GhostTeam',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: max_tokens || 8192, // Default to 8192 for better response completeness
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`)
      }

      const data: ChatCompletionResponse = await response.json()
      const choice = data.choices[0]
      const content = choice?.message?.content
      if (!content) {
        throw new Error('Received empty content from OpenRouter API.')
      }

      // Check if response was truncated due to token limit
      const wasTruncated = choice?.finish_reason === 'length'
      if (wasTruncated) {
        console.warn(
          `Response truncated due to token limit for model ${model}. Consider increasing max_tokens.`
        )
      }

      return { content, wasTruncated }
    } catch (error) {
      console.error(`Error calling OpenRouter with model ${model}:`, error)
      throw error // Re-throw after logging
    }
  }

  /**
   * A private, robust method to parse JSON from a raw string,
   * handling cases where the JSON is embedded in markdown.
   */
  private _safeParseJson<T>(rawContent: string): T {
    try {
      // Regex to find a JSON object within ```json ... ``` or ``` ... ```
      const jsonRegex = /```(json)?\s*([\s\S]*?)\s*```/
      const match = rawContent.match(jsonRegex)

      let jsonString = rawContent.trim()

      if (match && match[2]) {
        // If a markdown code block is found, use its content
        jsonString = match[2]
      } else {
        // Fallback for strings that might just be the JSON object itself
        const firstBrace = jsonString.indexOf('{')
        const lastBrace = jsonString.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1)
        }
      }

      // Remove trailing commas from objects and arrays
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1')

      // Sanitize concatenated strings within n8n-style expressions
      jsonString = jsonString.replace(/"\{\{([\s\S]+?)\}\}"\s*\+\s*"([^"]*)"/g, (match, p1, p2) => {
        const sanitizedExpression = `{{${p1}${p2}}}`
        return JSON.stringify(sanitizedExpression)
      })

      return JSON.parse(jsonString) as T
    } catch (error) {
      console.error('Failed to parse generated JSON. Raw content:', rawContent)
      if (error instanceof Error) {
        throw new Error(`The AI returned invalid JSON: ${error.message}`)
      }
      throw new Error('The AI returned an unrecoverable JSON format.')
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
    const response = await this.callApi(fullPrompt, model)
    return this._safeParseJson<WorkflowValidationResult>(response.content)
  }

  /**
   * Public method for any generation task that requires a text output from the AI.
   * This is now used for the final workflow "JSON" which is treated as a raw string.
   * Throws an error if the response was truncated due to token limits.
   */
  public async generateText(prompt: string, model: string, max_tokens?: number): Promise<string> {
    const response = await this.callApi(prompt, model, max_tokens)
    if (!response.content) {
      throw new Error('AI returned an empty response.')
    }
    if (response.wasTruncated) {
      throw new Error(
        'The AI response was truncated due to context window limits. The generated workflow may be incomplete. Please try with a shorter description or contact support.'
      )
    }
    return response.content
  }

  /**
   * Public method for generating structured metadata JSON.
   */
  public async generateJson(prompt: string, model: string, max_tokens?: number): Promise<unknown> {
    const response = await this.callApi(prompt, model, max_tokens)
    return this._safeParseJson<unknown>(response.content)
  }

  public async complete(
    prompt: string,
    model: string,
    options: { temperature?: number; max_tokens?: number } = {}
  ): Promise<string> {
    const { temperature = 0.7, max_tokens = 8192 } = options
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.referer,
          'X-Title': 'Launch GhostTeam',
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
      const choice = data.choices[0]
      const content = choice?.message?.content
      if (!content) {
        throw new Error('Received empty content from OpenRouter API.')
      }

      // Check if response was truncated due to token limit
      if (choice?.finish_reason === 'length') {
        console.warn(
          `Response truncated due to token limit for model ${model}. Consider increasing max_tokens.`
        )
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
    // Return raw text, not parsed JSON
    const textContent = await this.generateText(userInput, model)
    return textContent
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
      const response = await this.callApi(
        'Respond with just the word "OK" if you can see this message.',
        modelId
      )
      return response.content.toLowerCase().includes('ok')
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
