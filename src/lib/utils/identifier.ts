/**
 * Utility functions for handling automation identifiers (UUIDs vs slugs)
 */

// UUID regex pattern (with or without hyphens)
const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i

/**
 * Determines if a string is a UUID
 */
export function isUUID(identifier: string): boolean {
  return UUID_REGEX.test(identifier)
}

/**
 * Determines if a string is likely a slug (not a UUID)
 */
export function isSlug(identifier: string): boolean {
  return !isUUID(identifier)
}

/**
 * Resolves an identifier to an automation ID
 * If it's already a UUID, returns it directly
 * If it's a slug, resolves it via the API
 */
export async function resolveAutomationId(identifier: string): Promise<string | null> {
  // If it's already a UUID, return it directly
  if (isUUID(identifier)) {
    return identifier
  }

  // Otherwise, it's a slug - resolve it via API
  try {
    const response = await fetch(`/api/automations/by-slug/${identifier}`)
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.automationId || null
  } catch (error) {
    console.error('Error resolving slug:', error)
    return null
  }
}
