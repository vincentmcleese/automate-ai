-- Fix workflow validation access for debug endpoint
-- Allow public access to the workflow_validation prompt specifically

CREATE POLICY "Public can read workflow validation prompt" ON system_prompts
    FOR SELECT USING (name = 'workflow_validation' AND is_active = true); 