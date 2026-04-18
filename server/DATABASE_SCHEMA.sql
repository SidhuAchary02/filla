-- Filla: Database Schema for User Profiles
-- Run this in Supabase SQL Editor

-- 1. Create user_profiles table
-- Linked to Supabase auth.users (user_id is the foreign key)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job Search
  job_search_timeline varchar(50), -- "ASAP", "within_3_months", "within_6_months", "passive"
  
  -- Location (jsonb)
  location jsonb DEFAULT 'null'::jsonb, -- {"country": "...", "state": "...", "city": "...", "pincode": "..."}
  
  -- Resume
  resume_url varchar(500),
  
  -- Personal Information
  first_name varchar(255),
  middle_name varchar(255),
  last_name varchar(255),
  preferred_name varchar(255),
  suffix_name varchar(50),
  phone varchar(20),
  phone_country_iso varchar(2),
  phone_country_code varchar(8),
  phone_number varchar(20),
  birthday date,
  address varchar(500),
  nationality varchar(255),
  preferred_location varchar(255),
  preferred_job_type varchar(50), -- "remote", "onsite", "hybrid"
  
  -- Experience Level
  experience_level varchar(50), -- "internship", "entry", "junior", "mid", "senior", "expert"
  
  -- Role Preference
  role varchar(255),
  
  -- Work Experience (array of objects)
  work_experience jsonb DEFAULT '[]'::jsonb, -- [{"title": "...", "company": "...", "location": "...", "start_date": "...", "end_date": "...", "is_current": false, "description": "..."}]
  
  -- Education (array of objects)
  education jsonb DEFAULT '[]'::jsonb, -- [{"school": "...", "degree": "...", "major": "...", "start_date": "...", "end_date": "..."}]
  
  -- Projects (array of objects)
  projects jsonb DEFAULT '[]'::jsonb, -- [{"name": "...", "role": "...", "description": "...", "link": "..."}]
  
  -- Social & Portfolio Links
  links jsonb DEFAULT 'null'::jsonb, -- {"linkedin": "...", "github": "...", "portfolio": "..."}
  
  -- Skills & Languages
  skills jsonb DEFAULT '[]'::jsonb, -- ["Python", "React", "FastAPI"]
  languages jsonb DEFAULT '[]'::jsonb, -- ["English", "Spanish"]
  
  -- Salary & Compensation
  current_ctc decimal(12, 2),
  min_salary decimal(12, 2),
  notice_period varchar(50),
  
  -- Employment Information
  ethnicity varchar(255),
  work_authorized_us varchar(50), -- "Yes", "No", "Prefer not to answer"
  work_authorized_canada varchar(50),
  work_authorized_uk varchar(50),
  sponsorship_required varchar(50), -- "Yes", "No", "Prefer not to answer"
  disability varchar(50), -- "Yes", "No", "Prefer not to answer"
  lgbtq varchar(50), -- "Yes", "No", "Prefer not to answer"
  gender varchar(50), -- "Male", "Female", "Non-binary", etc.
  veteran varchar(50), -- "Yes", "No", "Prefer not to answer"
  
  -- Normalized Profile (computed field for autofill)
  -- Stores calculated experience_years: { gen_ai, mlops, aws, backend, cicd, python, react, sql, devops }
  normalized_profile jsonb DEFAULT 'null'::jsonb,

  -- Metadata
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Migration for existing tables (important: runs when table already exists)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_search_timeline varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location jsonb DEFAULT 'null'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_url varchar(500);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS middle_name varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_name varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suffix_name varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_country_iso varchar(2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_country_code varchar(8);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_number varchar(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address varchar(500);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nationality varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_location varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_job_type varchar(50);
ALTER TABLE user_profiles DROP COLUMN IF EXISTS address_2;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS address_3;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_level varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work_experience jsonb DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS links jsonb DEFAULT 'null'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_ctc decimal(12, 2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notice_period varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS min_salary decimal(12, 2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ethnicity varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work_authorized_us varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work_authorized_canada varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work_authorized_uk varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sponsorship_required varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS disability varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lgbtq varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS veteran varchar(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS normalized_profile jsonb DEFAULT 'null'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow users to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON user_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can create their own profile'
  ) THEN
    CREATE POLICY "Users can create their own profile"
      ON user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON user_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 7. Languages lookup table for searchable select/create input
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  normalized varchar(255) NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_languages_normalized ON languages(normalized);
CREATE INDEX IF NOT EXISTS idx_languages_name ON languages(name);
