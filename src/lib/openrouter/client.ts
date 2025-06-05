import {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterError,
  OpenRouterChatMessage,
} from '@/types/admin'

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private defaultHeaders: Record<string, string>

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_OPENROUTER_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required')
    }

    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://automate.ghostteam.ai',
      'X-Title': 'AutomateAI',
    }
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async chatCompletion(request: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json()
        throw new Error(`OpenRouter API error: ${errorData.error.message}`)
      }

      const data: OpenRouterChatResponse = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while calling OpenRouter API')
    }
  }

  /**
   * Simple text completion helper
   */
  async complete(
    prompt: string,
    model: string = 'openai/gpt-4o-mini',
    options: Partial<OpenRouterChatRequest> = {}
  ): Promise<string> {
    const messages: OpenRouterChatMessage[] = [{ role: 'user', content: prompt }]

    const request: OpenRouterChatRequest = {
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      ...options,
    }

    const response = await this.chatCompletion(request)
    return response.choices[0]?.message?.content || ''
  }

  /**
   * System prompt + user input completion
   */
  async completeWithSystem(
    systemPrompt: string,
    userInput: string,
    model: string = 'openai/gpt-4o-mini',
    options: Partial<OpenRouterChatRequest> = {}
  ): Promise<string> {
    const messages: OpenRouterChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ]

    const request: OpenRouterChatRequest = {
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.3,
      ...options,
    }

    const response = await this.chatCompletion(request)
    return response.choices[0]?.message?.content || ''
  }

  /**
   * Validate workflow description using AI
   */
  async validateWorkflow(
    workflowDescription: string,
    systemPrompt: string,
    model: string = 'openai/gpt-4o-mini'
  ): Promise<any> {
    try {
      const response = await this.completeWithSystem(systemPrompt, workflowDescription, model, {
        temperature: 0.2,
        max_tokens: 1500,
      })

      // Try to parse as JSON
      return JSON.parse(response)
    } catch (error) {
      throw new Error(
        `Failed to validate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate workflow JSON from validation results
   */
  async generateWorkflowJSON(
    workflowDescription: string,
    validationResults: any,
    systemPrompt: string,
    model: string = 'openai/gpt-4o-mini'
  ): Promise<any> {
    try {
      const userInput = `Workflow: ${workflowDescription}\n\nValidation Results: ${JSON.stringify(validationResults, null, 2)}`

      const response = await this.completeWithSystem(systemPrompt, userInput, model, {
        temperature: 0.1,
        max_tokens: 2000,
      })

      // Try to parse as JSON
      return JSON.parse(response)
    } catch (error) {
      throw new Error(
        `Failed to generate workflow JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Test model connectivity
   */
  async testModel(modelId: string): Promise<boolean> {
    try {
      const response = await this.complete(
        'Respond with just the word "OK" if you can see this message.',
        modelId,
        { max_tokens: 10, temperature: 0 }
      )

      return response.toLowerCase().includes('ok')
    } catch (error) {
      console.error(`Model test failed for ${modelId}:`, error)
      return false
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error)
      return []
    }
  }

  /**
   * Get account credits/usage information
   */
  async getCredits(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch credits: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching OpenRouter credits:', error)
      return null
    }
  }
}

// Export a default instance
export const openRouterClient = new OpenRouterClient()
