export type PromptCategory = 'validation' | 'json_generation' | 'workflow_analysis' | 'custom'

export interface SystemPrompt {
  id: string
  name: string
  description?: string
  category: PromptCategory
  prompt_content: string
  variables: Record<string, any>
  is_active: boolean
  version: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SystemPromptVersion {
  id: string
  original_prompt_id: string
  version_number: number
  name: string
  description?: string
  category: PromptCategory
  prompt_content: string
  variables: Record<string, unknown>
  is_active: boolean
  created_by?: string
  original_created_at: string
  original_updated_at: string
  archived_at: string
}

export interface OpenRouterModel {
  id: string // OpenRouter model ID (e.g., "openai/gpt-4o")
  name: string
  description?: string
  context_length?: number
  pricing_prompt?: number // Cost per 1k prompt tokens
  pricing_completion?: number // Cost per 1k completion tokens
  is_active: boolean
  supports_function_calling: boolean
  supports_streaming: boolean
  created_at: string
  updated_at: string
}

export interface AdminSetting {
  id: string
  key: string
  value: unknown
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateSystemPromptData {
  name: string
  description?: string
  category: PromptCategory
  prompt_content: string
  variables?: Record<string, unknown>
  is_active?: boolean
}

export interface UpdateSystemPromptData extends Partial<CreateSystemPromptData> {
  id: string
  version?: number
}

export interface CreateOpenRouterModelData {
  id: string
  name: string
  description?: string
  context_length?: number
  pricing_prompt?: number
  pricing_completion?: number
  is_active?: boolean
  supports_function_calling?: boolean
  supports_streaming?: boolean
}

export type UpdateOpenRouterModelData = Partial<CreateOpenRouterModelData> & {
  id: string
}

// OpenRouter API types
export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterChatRequest {
  model: string
  messages: OpenRouterChatMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stream?: boolean
}

export interface OpenRouterChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenRouterError {
  error: {
    message: string
    type: string
    code?: string
  }
}

// Workflow processing types
export interface WorkflowValidationResult {
  is_valid: boolean
  confidence: number
  triggers: string[]
  processes: string[]
  tools_needed: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  estimated_time: number
  suggestions: string[]
}

export interface WorkflowTrigger {
  type: string
  config: Record<string, unknown>
}

export interface WorkflowAction {
  type: string
  config: Record<string, unknown>
  conditions?: unknown[]
}

export interface WorkflowJSON {
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  variables: Record<string, unknown>
  error_handling: {
    retry_count: number
    fallback_action: string
  }
  metadata: {
    complexity: string
    estimated_runtime: string
    dependencies: string[]
  }
}

// Training data types
export interface TrainingData {
  id: string
  system_prompt_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface CreateTrainingDataData {
  title: string
  content: string
}

export interface UpdateTrainingDataData {
  title?: string
  content?: string
}

// Enhanced system prompt with training data info
export interface SystemPromptWithTrainingData extends SystemPrompt {
  training_data_count?: number
  estimated_tokens?: number
}
