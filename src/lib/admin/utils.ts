import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'
import { CreateSystemPromptData } from '@/types/admin'

// Create admin client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_SERVICE_ROLE_SUPABASE_KEY

let adminSupabase: ReturnType<typeof createClient> | null = null

// Only create admin client if service key is available and we're in a server environment
if (typeof window === 'undefined' && supabaseServiceKey && supabaseUrl) {
  try {
    adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
  } catch (error) {
    console.warn('Failed to initialize admin Supabase client:', error)
  }
}

/**
 * Check if current user has admin role from JWT token
 */
export function isAdminFromJWT(user: User): boolean {
  try {
    const appMetadata = user.app_metadata || {}
    return appMetadata.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status from JWT:', error)
    return false
  }
}

/**
 * Check if a user has admin role using app_metadata (server-side)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!adminSupabase) {
    console.warn(
      'Admin Supabase client not available - service role key missing or not in server environment'
    )
    return false
  }

  try {
    const { data: user, error } = await adminSupabase.auth.admin.getUserById(userId)

    if (error || !user) {
      console.error('Error fetching user:', error)
      return false
    }

    const appMetadata = user.user.app_metadata || {}
    return appMetadata.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Set a user's role to admin (service role only)
 */
export async function setUserAdminRole(
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminSupabase) {
    return { success: false, error: 'Service role key not configured' }
  }

  try {
    // First find the user by email
    const { data: userList, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      return { success: false, error: listError.message }
    }

    const user = userList.users.find(u => u.email === userEmail)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Update user's app_metadata
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        role: 'admin',
      },
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error setting admin role:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Remove admin role from a user (service role only)
 */
export async function removeUserAdminRole(
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminSupabase) {
    return { success: false, error: 'Service role key not configured' }
  }

  try {
    const { data: userList, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      return { success: false, error: listError.message }
    }

    const user = userList.users.find(u => u.email === userEmail)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Remove admin role from app_metadata
    const updatedMetadata = { ...user.app_metadata }
    delete updatedMetadata.role

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      app_metadata: updatedMetadata,
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error removing admin role:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Get all users with their roles
 */
export async function getAllUsersWithRoles(): Promise<
  Array<{
    id: string
    email: string
    role: string
    created_at: string
    last_sign_in_at?: string
    email_confirmed_at?: string
  }>
> {
  if (!adminSupabase) {
    console.warn('Service role key not configured')
    return []
  }

  try {
    const { data: userList, error } = await adminSupabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return userList.users.map(user => ({
      id: user.id,
      email: user.email || '',
      role: user.app_metadata?.role || 'user',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || undefined,
      email_confirmed_at: user.email_confirmed_at || undefined,
    }))
  } catch (error) {
    console.error('Error fetching users with roles:', error)
    return []
  }
}

/**
 * Get user statistics for admin dashboard
 */
export async function getUserStats(): Promise<{
  total_users: number
  admin_users: number
  confirmed_users: number
  recent_signups: number
}> {
  if (!adminSupabase) {
    return { total_users: 0, admin_users: 0, confirmed_users: 0, recent_signups: 0 }
  }

  try {
    const { data: userList, error } = await adminSupabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching user stats:', error)
      return { total_users: 0, admin_users: 0, confirmed_users: 0, recent_signups: 0 }
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const stats = {
      total_users: userList.users.length,
      admin_users: userList.users.filter(user => user.app_metadata?.role === 'admin').length,
      confirmed_users: userList.users.filter(user => user.email_confirmed_at).length,
      recent_signups: userList.users.filter(user => new Date(user.created_at) > oneWeekAgo).length,
    }

    return stats
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return { total_users: 0, admin_users: 0, confirmed_users: 0, recent_signups: 0 }
  }
}

/**
 * Validate admin request (middleware helper)
 */
export async function requireAdmin(userId: string): Promise<boolean> {
  return await isUserAdmin(userId)
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<{
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in_at?: string
} | null> {
  if (!adminSupabase) {
    return null
  }

  try {
    const { data: user, error } = await adminSupabase.auth.admin.getUserById(userId)

    if (error || !user) {
      return null
    }

    return {
      id: user.user.id,
      email: user.user.email || '',
      role: user.user.app_metadata?.role || 'user',
      created_at: user.user.created_at,
      last_sign_in_at: user.user.last_sign_in_at || undefined,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Check if service role features are available
 */
export function isServiceRoleAvailable(): boolean {
  return adminSupabase !== null
}

/**
 * Estimate tokens in text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

/**
 * Calculate estimated cost for a request
 */
export function calculateEstimatedCost(
  promptTokens: number,
  completionTokens: number,
  pricingPrompt: number = 0.0015,
  pricingCompletion: number = 0.002
): number {
  const promptCost = (promptTokens / 1000) * pricingPrompt
  const completionCost = (completionTokens / 1000) * pricingCompletion
  return promptCost + completionCost
}

/**
 * Validate system prompt content
 */
export function validatePromptContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!content || content.trim().length === 0) {
    errors.push('Prompt content cannot be empty')
  }

  if (content.length > 50000) {
    errors.push('Prompt content is too long (max 50,000 characters)')
  }

  // Check for balanced template variables
  const variableMatches = content.match(/\{\{[^}]+\}\}/g) || []
  const variables = new Set<string>()

  for (const match of variableMatches) {
    const variable = match.slice(2, -2).trim()
    if (!variable) {
      errors.push('Empty template variable found')
      continue
    }
    variables.add(variable)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Extract variables from prompt content
 */
export function extractPromptVariables(content: string): string[] {
  const variableMatches = content.match(/\{\{([^}]+)\}\}/g) || []
  const variables = new Set<string>()

  for (const match of variableMatches) {
    const variable = match.slice(2, -2).trim()
    if (variable) {
      variables.add(variable)
    }
  }

  return Array.from(variables)
}

/**
 * Replace variables in prompt content
 */
export function replacePromptVariables(content: string, variables: Record<string, string>): string {
  let result = content

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    result = result.replaceAll(placeholder, value)
  }

  return result
}

/**
 * Sanitize user input for prompts
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .trim()
}

/**
 * Validate system prompt data for creation/update
 */
export function validateSystemPromptData(
  data:
    | CreateSystemPromptData
    | {
        name?: string
        prompt_content?: string
        category?: string
        [key: string]: unknown
      }
): string[] {
  const errors: string[] = []

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Prompt name is required')
    } else if (data.name.length > 100) {
      errors.push('Prompt name too long (max 100 characters)')
    }
  }

  if (data.prompt_content !== undefined) {
    const contentValidation = validatePromptContent(data.prompt_content)
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors)
    }
  }

  if (data.category !== undefined) {
    const validCategories = ['validation', 'json_generation', 'workflow_analysis', 'custom']
    if (!validCategories.includes(data.category)) {
      errors.push('Invalid category. Must be one of: ' + validCategories.join(', '))
    }
  }

  return errors
}

/**
 * Validate OpenRouter model ID format
 */
export function isValidModelId(modelId: string): boolean {
  const modelIdRegex = /^[a-z0-9-]+\/[a-z0-9-_.]+$/i
  return modelIdRegex.test(modelId)
}

/**
 * Sanitize prompt content for storage
 */
export function sanitizePromptContent(content: string): string {
  return content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
}
