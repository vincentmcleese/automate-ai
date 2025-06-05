-- Add versioning to system prompts
ALTER TABLE system_prompts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create system_prompt_versions table for version history
CREATE TABLE IF NOT EXISTS system_prompt_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    original_prompt_id UUID NOT NULL REFERENCES system_prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category prompt_category NOT NULL,
    prompt_content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(original_prompt_id, version_number)
);

-- Update existing prompts to have version 1
UPDATE system_prompts SET version = 1 WHERE version IS NULL;

-- Make version column NOT NULL
ALTER TABLE system_prompts ALTER COLUMN version SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_system_prompt_versions_original_id ON system_prompt_versions(original_prompt_id);
CREATE INDEX IF NOT EXISTS idx_system_prompt_versions_version ON system_prompt_versions(original_prompt_id, version_number);

-- Row Level Security for versions table
ALTER TABLE system_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Versions policies - using app_metadata for admin check
CREATE POLICY "Authenticated users can read versions" ON system_prompt_versions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage versions" ON system_prompt_versions
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    ); 