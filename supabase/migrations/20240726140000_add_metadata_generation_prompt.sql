-- Add the system prompt for generating metadata
INSERT INTO public.system_prompts (
  name,
  prompt_content,
  version,
  description
) VALUES (
  'metadata_generation',
  'Based on the following workflow description and selected tools, please generate a short, descriptive title, a concise description suitable for UI and metadata, and a list of relevant tags for filtering and SEO.

Workflow Description:
"""
{{user_input}}
"""

Selected Tools: {{tools}}

Your response MUST be a valid JSON object with the following structure and nothing else:
{
  "title": "A short, descriptive title (max 70 characters)",
  "description": "A concise summary of the automation (max 160 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}',
  1,
  'This prompt is used to generate a title, description, and tags for a new automation based on user input.'
); 