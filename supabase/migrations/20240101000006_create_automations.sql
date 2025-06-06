-- Create automations table
CREATE TABLE automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES system_prompts(id) ON DELETE SET NULL,
    prompt_version INTEGER,
    user_input TEXT NOT NULL,
    generated_json JSONB NOT NULL,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_prompt_id ON automations(prompt_id);
CREATE INDEX idx_automations_created_at ON automations(created_at DESC);
CREATE INDEX idx_automations_status ON automations(status);

-- Enable RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own automations
CREATE POLICY "Users can view their own automations" ON automations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations" ON automations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations" ON automations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations" ON automations
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE automations IS 'Stores user-generated workflow automations created via AI';
COMMENT ON COLUMN automations.user_input IS 'Original workflow description provided by user';
COMMENT ON COLUMN automations.generated_json IS 'AI-generated JSON workflow configuration';
COMMENT ON COLUMN automations.prompt_id IS 'Reference to the system prompt used for generation';
COMMENT ON COLUMN automations.prompt_version IS 'Version of the prompt at time of generation';
COMMENT ON COLUMN automations.status IS 'Current status of the automation generation process'; 