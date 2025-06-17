-- Add automation guide field to automations table
ALTER TABLE automations 
ADD COLUMN automation_guide TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN automations.automation_guide IS 'AI-generated setup guide for implementing the automation workflow';

-- Add index for searching guides
CREATE INDEX idx_automations_has_guide ON automations(automation_guide) WHERE automation_guide IS NOT NULL;