-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE prompt_category AS ENUM ('validation', 'json_generation', 'workflow_analysis', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create system_prompts table
CREATE TABLE IF NOT EXISTS system_prompts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category prompt_category NOT NULL DEFAULT 'custom',
    prompt_content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create openrouter_models table
CREATE TABLE IF NOT EXISTS openrouter_models (
    id TEXT PRIMARY KEY, -- OpenRouter model ID (e.g., "openai/gpt-4o")
    name TEXT NOT NULL,
    description TEXT,
    context_length INTEGER,
    pricing_prompt DECIMAL(10, 8), -- Cost per 1k prompt tokens
    pricing_completion DECIMAL(10, 8), -- Cost per 1k completion tokens
    is_active BOOLEAN DEFAULT true,
    supports_function_calling BOOLEAN DEFAULT false,
    supports_streaming BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create admin_settings table for global configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default system prompts
INSERT INTO system_prompts (name, description, category, prompt_content, variables) VALUES
(
    'workflow_validation',
    'Validates and analyzes user workflow descriptions',
    'validation',
    'You are an expert workflow automation analyst. Analyze the following workflow description and validate if it can be automated:

Workflow Description: {{workflow_description}}

Please respond with a JSON object containing:
1. "is_valid": boolean indicating if the workflow can be automated
2. "confidence": number between 0-1 indicating confidence level
3. "triggers": array of identified trigger events
4. "processes": array of identified processes/actions
5. "tools_needed": array of tools/integrations required
6. "complexity": "simple", "moderate", or "complex"
7. "estimated_time": estimated setup time in hours
8. "suggestions": array of improvement suggestions

Ensure the response is valid JSON only.',
    '{"workflow_description": "The user workflow description to analyze"}'
),
(
    'json_generation',
    'Generates structured JSON from validated workflows',
    'json_generation',
    'Convert the following validated workflow into a structured automation JSON:

Workflow: {{workflow_description}}
Validation Results: {{validation_results}}

Generate a JSON object with this structure:
{
  "name": "workflow_name",
  "description": "brief_description",
  "triggers": [{"type": "trigger_type", "config": {}}],
  "actions": [{"type": "action_type", "config": {}, "conditions": []}],
  "variables": {},
  "error_handling": {"retry_count": 3, "fallback_action": ""},
  "metadata": {"complexity": "", "estimated_runtime": "", "dependencies": []}
}

Ensure all fields are properly populated based on the workflow analysis.',
    '{"workflow_description": "The workflow description", "validation_results": "Results from validation step"}'
),
(
    'model_selection',
    'Selects the best AI model for a given task',
    'workflow_analysis',
    'Based on the following task requirements, recommend the most suitable AI model:

Task Type: {{task_type}}
Complexity: {{complexity}}
Context Length Needed: {{context_length}}
Budget Constraints: {{budget_level}}

Available Models: {{available_models}}

Respond with JSON:
{
  "recommended_model": "model_id",
  "reasoning": "explanation for choice",
  "alternatives": ["model_id_1", "model_id_2"],
  "estimated_cost": "cost_estimate",
  "performance_trade_offs": "explanation"
}',
    '{"task_type": "Type of task", "complexity": "simple/moderate/complex", "context_length": "tokens needed", "budget_level": "low/medium/high", "available_models": "List of available models"}'
);

-- Insert default OpenRouter models
INSERT INTO openrouter_models (id, name, description, context_length, pricing_prompt, pricing_completion, supports_function_calling) VALUES
('openai/gpt-4o', 'GPT-4o', 'Most capable GPT-4 model with vision and function calling', 128000, 0.005, 0.015, true),
('openai/gpt-4o-mini', 'GPT-4o Mini', 'Smaller, faster, cheaper GPT-4 model', 128000, 0.00015, 0.0006, true),
('openai/gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Fast and cost-effective model for simple tasks', 16385, 0.0005, 0.0015, true),
('anthropic/claude-3-opus', 'Claude 3 Opus', 'Most powerful Claude model for complex reasoning', 200000, 0.015, 0.075, false),
('anthropic/claude-3-sonnet', 'Claude 3 Sonnet', 'Balanced Claude model for most tasks', 200000, 0.003, 0.015, false),
('anthropic/claude-3-haiku', 'Claude 3 Haiku', 'Fastest Claude model for simple tasks', 200000, 0.00025, 0.00125, false);

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
('default_model', '"openai/gpt-4o-mini"', 'Default AI model for workflow processing'),
('max_context_length', '16000', 'Maximum context length for prompts'),
('enable_function_calling', 'true', 'Enable function calling capabilities'),
('token_budget_per_request', '4000', 'Maximum tokens per API request'),
('retry_attempts', '3', 'Number of retry attempts for failed requests');

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE openrouter_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- System prompts policies - using app_metadata for admin check
CREATE POLICY "Authenticated users can read active prompts" ON system_prompts
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage all prompts" ON system_prompts
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- OpenRouter models policies - using app_metadata for admin check
CREATE POLICY "Authenticated users can read active models" ON openrouter_models
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage all models" ON openrouter_models
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Admin settings policies - using app_metadata for admin check
CREATE POLICY "Authenticated users can read settings" ON admin_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings" ON admin_settings
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_system_prompts_updated_at BEFORE UPDATE ON system_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_openrouter_models_updated_at BEFORE UPDATE ON openrouter_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to set user role (for admin use)
CREATE OR REPLACE FUNCTION set_user_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow service_role to call this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Only service role can set admin roles';
  END IF;

  -- Update app_metadata to set admin role
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                         jsonb_build_object('role', 'admin')
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

-- Comment with instructions for setting admin role
COMMENT ON FUNCTION set_user_admin_role(text) IS 
'Function to set admin role for a user. Usage: SELECT set_user_admin_role(''user@example.com'');'; 