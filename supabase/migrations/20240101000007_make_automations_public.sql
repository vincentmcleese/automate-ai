-- Add user display fields to automations table
ALTER TABLE automations ADD COLUMN user_name VARCHAR(255);
ALTER TABLE automations ADD COLUMN user_email VARCHAR(255);
ALTER TABLE automations ADD COLUMN user_avatar_url TEXT;

-- Create index for performance
CREATE INDEX idx_automations_user_name ON automations(user_name);

-- Drop the restrictive RLS policy
DROP POLICY "Users can view their own automations" ON automations;

-- Create public read policy for completed automations
CREATE POLICY "Anyone can view completed automations" ON automations
    FOR SELECT USING (status = 'completed');

-- Keep the other policies for authenticated users only
-- (Users can still only create/update/delete their own)

-- Add comments for new fields
COMMENT ON COLUMN automations.user_name IS 'Display name of the user who created this automation';
COMMENT ON COLUMN automations.user_email IS 'Email of the user who created this automation';
COMMENT ON COLUMN automations.user_avatar_url IS 'Avatar URL of the user who created this automation'; 