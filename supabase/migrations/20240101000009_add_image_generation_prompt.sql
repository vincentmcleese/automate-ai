-- Insert the image generation system prompt
-- This is in a separate migration because PostgreSQL requires enum values to be committed before use
INSERT INTO system_prompts (
    name, 
    description, 
    category, 
    prompt_content, 
    variables,
    model_id,
    is_active
) VALUES (
    'automation_image_generation',
    'Generates creative image prompts for automation workflow visualization',
    'image_generation',
    'Create a detailed, visually appealing image prompt for DALL-E or Midjourney based on this automation workflow:

Automation Title: {{automation_title}}
Automation Description: {{automation_description}}
Workflow Summary: {{workflow_summary}}

Generate a creative image prompt that:
1. Visually represents the automation concept
2. Uses modern, clean, tech-oriented aesthetics
3. Incorporates relevant icons, symbols, or metaphors
4. Suggests productivity, efficiency, and automation
5. Is suitable for a card/thumbnail format
6. Avoids text in the image

Style guidelines:
- Modern flat design or isometric style
- Professional color palette with blues, greens, and clean whites
- Digital/tech theme with subtle gradients
- Clear focal point and good composition
- Suitable for 512x512 or 1024x1024 resolution

Return only the image prompt, no additional text or explanation.',
    '{"automation_title": "The automation title", "automation_description": "Brief description of what the automation does", "workflow_summary": "Summary of the workflow steps and tools involved"}',
    'openai/gpt-4o-mini',
    true
);

-- Storage bucket setup instructions:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called "automation-images"
-- 3. Set it to public
-- 4. Add RLS policies if needed 