import { customAlphabet } from 'nanoid'

/**
 * Generates a URL-friendly slug from a title.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters,
 * and appends a short random string to ensure uniqueness.
 *
 * @param title The title to convert into a slug.
 * @returns A unique, URL-friendly slug.
 */
export function generateSlug(title: string): string {
  const nanoid = customAlphabet('1234567890abcdef', 6)

  const baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text

  return `${baseSlug}-${nanoid()}`
}
