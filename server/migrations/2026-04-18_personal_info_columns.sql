-- Add new personal-info columns and remove old address_2/address_3 columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nationality varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_location varchar(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_job_type varchar(50);

ALTER TABLE user_profiles DROP COLUMN IF EXISTS address_2;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS address_3;
