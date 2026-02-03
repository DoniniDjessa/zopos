-- Fix RLS policies for zop-users table to allow admins to see all users
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies on zop-users table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'zop-users') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "zop-users"';
    END LOOP;
END $$;

-- Create a function to check if user is admin (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "zop-users"
    WHERE id = user_id
    AND role IN ('super_admin', 'admin')
  );
$$;

-- Enable RLS on the table (if not already enabled)
ALTER TABLE "zop-users" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own profile OR if they're an admin
CREATE POLICY "Users can view own profile or admins view all"
ON "zop-users"
FOR SELECT
USING (
  auth.uid() = id 
  OR is_admin_user(auth.uid())
);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "zop-users"
FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: Allow admins to update any user
CREATE POLICY "Admins can update users"
ON "zop-users"
FOR UPDATE
USING (is_admin_user(auth.uid()));

-- Policy 4: Allow admins to delete users (except super_admins)
CREATE POLICY "Admins can delete users"
ON "zop-users"
FOR DELETE
USING (
  is_admin_user(auth.uid())
  AND role != 'super_admin'
);

-- Policy 5: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users"
ON "zop-users"
FOR INSERT
WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'zop-users'
ORDER BY policyname;
