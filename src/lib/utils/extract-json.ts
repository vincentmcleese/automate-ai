/**
 * Extracts a JSON object from a string.
 * Handles cases where the JSON is embedded in markdown-style code blocks.
 *
 * @param str The string to search for a JSON object.
 * @returns The parsed JSON object, or null if no valid JSON is found.
 */
export function extractJson(str: string): unknown | null {
  if (!str) {
    return null
  }

  // Regex to find a JSON object within ```json ... ``` or ``` ... ```
  const jsonRegex = /```(json)?\s*([\s\S]*?)\s*```/
  const match = str.match(jsonRegex)

  let jsonString = str.trim()

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

  try {
    return JSON.parse(jsonString)
  } catch {
    console.error('Failed to parse extracted JSON string:', jsonString)
    console.error('Original string was:', str)
    return null
  }
}
