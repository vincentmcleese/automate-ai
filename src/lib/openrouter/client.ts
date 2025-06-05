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
    console.log('OpenRouter client constructor - API key provided:', !!apiKey)
    console.log(
      'OpenRouter client constructor - Env API key exists:',
      !!process.env.NEXT_OPENROUTER_API_KEY
    )
    console.log('OpenRouter client constructor - Final API key exists:', !!this.apiKey)
    console.log(
      'OpenRouter client constructor - API key starts with:',
      this.apiKey?.substring(0, 10) + '...'
    )
    console.log('OpenRouter client constructor - API key length:', this.apiKey?.length)
    console.log(
      'OpenRouter client constructor - API key has whitespace:',
      /\s/.test(this.apiKey || '')
    )

    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required')
    }

    // Trim any potential whitespace
    this.apiKey = this.apiKey.trim()

    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://automate.ghostteam.ai',
      'X-Title': 'AutomateAI',
    }

    console.log(
      'OpenRouter client constructor - Authorization header set:',
      this.defaultHeaders.Authorization?.substring(0, 20) + '...'
    )
    console.log('OpenRouter client constructor - Trimmed API key length:', this.apiKey.length)
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async chatCompletion(request: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    try {
      console.log('Making OpenRouter API call...')
      console.log('Headers being sent:', {
        ...this.defaultHeaders,
        Authorization: this.defaultHeaders.Authorization?.substring(0, 20) + '...',
      })

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
      })

      console.log('OpenRouter API response status:', response.status)

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json()
        console.log('OpenRouter API error response:', errorData)
        throw new Error(`OpenRouter API error: ${errorData.error.message}`)
      }

      const data: OpenRouterChatResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error in chatCompletion:', error)
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

// Lazy initialization to avoid throwing errors at module load time
let _openRouterClient: OpenRouterClient | null = null

/**
 * Get or create the OpenRouter client instance
 */
export function getOpenRouterClient(): OpenRouterClient {
  console.log('getOpenRouterClient called - existing client:', !!_openRouterClient)
  if (!_openRouterClient) {
    console.log('Creating new OpenRouter client instance...')
    _openRouterClient = new OpenRouterClient()
  }
  return _openRouterClient
}

// Export the factory function as the default client
export const openRouterClient = {
  async validateWorkflow(
    workflowDescription: string,
    systemPrompt: string,
    model: string = 'openai/gpt-4o-mini'
  ): Promise<any> {
    const client = getOpenRouterClient()
    return client.validateWorkflow(workflowDescription, systemPrompt, model)
  },

  async generateWorkflowJSON(
    workflowDescription: string,
    validationResults: any,
    systemPrompt: string,
    model: string = 'openai/gpt-4o-mini'
  ): Promise<any> {
    const client = getOpenRouterClient()
    return client.generateWorkflowJSON(workflowDescription, validationResults, systemPrompt, model)
  },

  async getAvailableModels(): Promise<any[]> {
    const client = getOpenRouterClient()
    return client.getAvailableModels()
  },

  async testModel(modelId: string): Promise<boolean> {
    const client = getOpenRouterClient()
    return client.testModel(modelId)
  },

  async getCredits(): Promise<any> {
    const client = getOpenRouterClient()
    return client.getCredits()
  },
}
