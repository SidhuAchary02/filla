-- Filla: Database Schema for User Profiles
-- Run this in Supabase SQL Editor

-- 1. Create user_profiles table
-- Linked to Supabase auth.users (user_id is the foreign key)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name varchar(255),
  phone varchar(20),
  
  -- Skills & Experience (flexible JSONB)
  skills jsonb DEFAULT '[]'::jsonb, -- ["Python", "React", "FastAPI"]
  experience jsonb DEFAULT '{}'::jsonb, -- {"Python": 3, "React": 2, "FastAPI": 1}
  
  -- Employment Info
  notice_period varchar(100), -- "immediate", "1 month", "2 months", etc.
  current_ctc decimal(12, 2), -- Current cost to company
  
  -- Metadata
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create indexes for faster queries
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed with example (optional - for testing)
-- INSERT INTO user_profiles (user_id, full_name, phone) 
-- VALUES ('user-uuid-here', 'John Doe', '+1234567890') 
-- RETURNING *;
