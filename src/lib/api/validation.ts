import { z } from 'zod'

/**
 * Common validation schemas for API routes
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// Search params schema
export const searchParamsSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
  ...paginationSchema.shape,
})

// Automation creation schema
export const createAutomationSchema = z.object({
  userInput: z
    .string()
    .min(10, 'User input must be at least 10 characters')
    .max(5000, 'User input too long'),
  selectedTools: z.record(z.string()).optional().default({}),
  validationResult: z.any().optional(), // Can be strongly typed later
})

// Automation update schema
export const updateAutomationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
})

// Route parameter validation schemas
export const automationParamsSchema = z.object({
  id: uuidSchema,
})

// Tool selection schema
export const toolSelectionSchema = z.record(
  z.coerce.number().min(1), // step number
  z.string().min(1).max(100) // tool name
)

// System prompt schemas (for admin routes)
export const createSystemPromptSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'validation',
    'json_generation',
    'workflow_analysis',
    'image_generation',
    'custom',
  ]),
  prompt_content: z.string().min(1).max(50000),
  variables: z.record(z.string()).optional().default({}),
  model_id: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const updateSystemPromptSchema = createSystemPromptSchema.partial()

// Model schemas
export const createModelSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-_.]+$/i, 'Invalid model ID format'),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  context_length: z.number().min(1).max(2000000),
  pricing_prompt: z.number().min(0).optional(),
  pricing_completion: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
  supports_function_calling: z.boolean().default(false),
  supports_streaming: z.boolean().default(true),
})

// User role schema
export const updateUserRoleSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
})

// Workflow validation schema
export const workflowValidationSchema = z.object({
  workflow_description: z.string().min(10).max(5000),
})

/**
 * Validation helper functions
 */

export function validateRouteParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(params)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { success: false, error: 'Invalid parameters' }
  }
}

export function validateSearchParams(
  searchParams: URLSearchParams
): { success: true; data: z.infer<typeof searchParamsSchema> } | { success: false; error: string } {
  const params = {
    search: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sortBy') || 'created_at') as 'created_at' | 'updated_at' | 'title',
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    status: searchParams.get('status') as
      | 'pending'
      | 'generating'
      | 'completed'
      | 'failed'
      | undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  }

  try {
    const result = searchParamsSchema.parse(params)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      }
    }
    return { success: false, error: 'Invalid search parameters' }
  }
}

export function validateJsonBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const result = schema.parse(body)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.flatten(),
      }
    }
    return { success: false, error: 'Invalid request body' }
  }
}

/**
 * Sanitization helpers
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: URLs
    .trim()
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\w\s-]/g, '') // Only allow word characters, spaces, and hyphens
    .trim()
    .slice(0, 100) // Limit length
}

/**
 * Type guards
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && uuidSchema.safeParse(value).success
}

export function isValidStatus(
  value: unknown
): value is 'pending' | 'generating' | 'completed' | 'failed' {
  return (
    typeof value === 'string' && ['pending', 'generating', 'completed', 'failed'].includes(value)
  )
}
