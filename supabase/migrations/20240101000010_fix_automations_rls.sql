-- Fix RLS policies for automations table after adding new fields

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view completed automations" ON automations;
DROP POLICY IF EXISTS "Users can create their own automations" ON automations;
DROP POLICY IF EXISTS "Users can update their own automations" ON automations;
DROP POLICY IF EXISTS "Users can delete their own automations" ON automations;

-- Create new RLS policies that work with the updated table structure

-- Public read access for completed automations
CREATE POLICY "Anyone can view completed automations" ON automations
    FOR SELECT USING (status = 'completed');

-- Authenticated users can create their own automations
CREATE POLICY "Users can create their own automations" ON automations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own automations
CREATE POLICY "Users can update their own automations" ON automations
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own automations
CREATE POLICY "Users can delete their own automations" ON automations
    FOR DELETE USING (auth.uid() = user_id);

-- Also allow users to view their own automations regardless of status
CREATE POLICY "Users can view their own automations" ON automations
    FOR SELECT USING (auth.uid() = user_id); 