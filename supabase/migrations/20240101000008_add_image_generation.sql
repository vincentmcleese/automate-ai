-- Add image_generation to the prompt_category enum
ALTER TYPE prompt_category ADD VALUE 'image_generation';

-- Add image_url column to automations table
ALTER TABLE automations ADD COLUMN image_url TEXT;

-- Create index for image_url lookups
CREATE INDEX idx_automations_image_url ON automations(image_url) WHERE image_url IS NOT NULL;

-- Add comment for new field
COMMENT ON COLUMN automations.image_url IS 'URL to the generated image for this automation';

-- Note: The image generation system prompt will be added in the next migration
-- after the enum value is committed. 