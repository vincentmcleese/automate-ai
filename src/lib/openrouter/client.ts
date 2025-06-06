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

    // Trim any potential whitespace
    this.apiKey = this.apiKey.trim()

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
      console.log('Making OpenRouter API request:', {
        model: request.model,
        messagesCount: request.messages.length,
        maxTokens: request.max_tokens,
      })

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
      })

      console.log('OpenRouter API response status:', response.status)

      if (!response.ok) {
        let errorData: OpenRouterError
        try {
          errorData = await response.json()
          console.error('OpenRouter API error response:', errorData)
        } catch (parseError) {
          console.error('Failed to parse OpenRouter error response:', parseError)
          throw new Error(`OpenRouter API error: HTTP ${response.status} ${response.statusText}`)
        }
        throw new Error(`OpenRouter API error: ${errorData.error.message}`)
      }

      const data: OpenRouterChatResponse = await response.json()
      console.log('OpenRouter API success:', {
        choicesCount: data.choices?.length || 0,
        finishReason: data.choices?.[0]?.finish_reason,
      })
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
   * Generate content using a system prompt
   */
  async generateContent(
    systemPrompt: string,
    model: string = 'openai/gpt-4o-mini',
    options: Partial<OpenRouterChatRequest> = {}
  ): Promise<string> {
    const messages: OpenRouterChatMessage[] = [{ role: 'system', content: systemPrompt }]

    const request: OpenRouterChatRequest = {
      model,
      messages,
      max_tokens: 500,
      temperature: 0.8,
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
      console.log('Starting workflow validation with model:', model)

      const response = await this.completeWithSystem(systemPrompt, workflowDescription, model, {
        temperature: 0.2,
        max_tokens: 1500,
      })

      console.log('Raw AI response received:', {
        responseLength: response.length,
        firstChars: response.substring(0, 100),
        lastChars: response.length > 100 ? response.substring(response.length - 100) : 'N/A',
      })

      // Try to parse as JSON
      let parsedResponse
      try {
        parsedResponse = JSON.parse(response)
        console.log('Successfully parsed JSON response:', {
          hasIsValid: 'is_valid' in parsedResponse,
          hasConfidence: 'confidence' in parsedResponse,
          keys: Object.keys(parsedResponse),
        })
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError)
        console.error('Raw response that failed to parse:', response)

        // Try to extract JSON from the response if it's wrapped in text
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0])
            console.log('Successfully extracted and parsed JSON from response')
          } catch (extractError) {
            console.error('Failed to extract JSON from response:', extractError)
            throw new Error(
              `AI returned invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
            )
          }
        } else {
          // If no JSON found, return a fallback response
          console.warn('No JSON found in response, returning fallback validation result')
          return {
            is_valid: false,
            confidence: 0.1,
            triggers: [],
            processes: [],
            tools_needed: [],
            complexity: 'complex',
            estimated_time: 8,
            suggestions: [
              'The workflow description could not be processed. Please try rephrasing your description more clearly.',
            ],
          }
        }
      }

      // Validate the required fields exist
      const requiredFields = [
        'is_valid',
        'confidence',
        'triggers',
        'processes',
        'tools_needed',
        'complexity',
        'estimated_time',
        'suggestions',
      ]
      const missingFields = requiredFields.filter(field => !(field in parsedResponse))

      if (missingFields.length > 0) {
        console.warn('Response missing required fields:', missingFields)
        // Fill in missing fields with defaults
        const defaults = {
          is_valid: false,
          confidence: 0.1,
          triggers: [],
          processes: [],
          tools_needed: [],
          complexity: 'complex',
          estimated_time: 8,
          suggestions: [
            'The workflow validation returned incomplete information. Please try again.',
          ],
        }

        missingFields.forEach(field => {
          if (!(field in parsedResponse)) {
            parsedResponse[field] = defaults[field as keyof typeof defaults]
          }
        })
      }

      return parsedResponse
    } catch (error) {
      console.error('Error in validateWorkflow:', error)
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
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userInput = `Workflow: ${workflowDescription}\n\nValidation Results: ${JSON.stringify(validationResults, null, 2)}`

        // Use 200K tokens - handles complex workflows while staying efficient
        const maxTokens = 200000
        const response = await this.completeWithSystem(systemPrompt, userInput, model, {
          temperature: 0.1,
          max_tokens: maxTokens,
        })

        console.log(`Attempt ${attempt}: Response length ${response.length} characters`)

        // Try to extract JSON from potential markdown blocks
        let jsonString = response.trim()
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonString = jsonMatch[1].trim()
        }

        // Try to parse as JSON
        let parsedJson: any
        try {
          parsedJson = JSON.parse(jsonString)
        } catch (parseError) {
          console.warn(`Attempt ${attempt}: JSON parse failed:`, parseError)

          // If this looks like a truncated JSON, try to recover
          if (jsonString.includes('{') && !jsonString.endsWith('}')) {
            console.log(`Attempt ${attempt}: Detected truncated JSON, retrying...`)
            lastError = new Error(`Response appears truncated (attempt ${attempt}/${maxRetries})`)
            continue
          }

          // If it's not truncated, this is a parsing error
          throw new Error(
            `Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          )
        }

        // Validate that we got a reasonable JSON structure
        if (typeof parsedJson !== 'object' || parsedJson === null) {
          throw new Error('Response is not a valid JSON object')
        }

        console.log(`Attempt ${attempt}: Successfully generated and parsed JSON`)
        return parsedJson
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error)
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (attempt === maxRetries) {
          break
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    throw new Error(
      `Failed to generate workflow JSON after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    )
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
  if (!_openRouterClient) {
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

  async generateContent(
    systemPrompt: string,
    model: string = 'openai/gpt-4o-mini'
  ): Promise<string> {
    const client = getOpenRouterClient()
    return client.generateContent(systemPrompt, model)
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
