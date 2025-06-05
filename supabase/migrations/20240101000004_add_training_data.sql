-- Add training data support for system prompts
CREATE TABLE IF NOT EXISTS system_prompt_training_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_prompt_id UUID NOT NULL REFERENCES system_prompts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_training_data_prompt_id ON system_prompt_training_data(system_prompt_id);
CREATE INDEX IF NOT EXISTS idx_training_data_created_at ON system_prompt_training_data(system_prompt_id, created_at);

-- Enable RLS
ALTER TABLE system_prompt_training_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only admins can manage training data
CREATE POLICY "Admins can manage training data" ON system_prompt_training_data
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Update trigger for updated_at
CREATE TRIGGER update_training_data_updated_at BEFORE UPDATE ON system_prompt_training_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 