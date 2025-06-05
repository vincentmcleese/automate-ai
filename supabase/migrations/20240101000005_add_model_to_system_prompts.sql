-- Add model configuration to system prompts
ALTER TABLE system_prompts 
ADD COLUMN model_id TEXT;

-- Add index for better performance when filtering by model
CREATE INDEX IF NOT EXISTS idx_system_prompts_model_id ON system_prompts(model_id);

-- Add a comment to document the field
COMMENT ON COLUMN system_prompts.model_id IS 'OpenRouter model ID to use for this prompt (e.g., "openai/gpt-4o")';

-- Update existing prompts to use a default model (optional - you can set this to a preferred default)
-- UPDATE system_prompts SET model_id = 'openai/gpt-4o-mini' WHERE model_id IS NULL; 