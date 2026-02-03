-- Add suspended column to zop-users table
-- Run this in your Supabase SQL Editor

ALTER TABLE "zop-users"
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN "zop-users".suspended IS 'Whether the user account is suspended (cannot login)';
