-- Debug auth issue on specific device
-- Run this in Supabase SQL Editor to check the problematic user

-- 1. Check if user exists in auth.users
SELECT 
  id, 
  email, 
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'test@test.com';

-- 2. Check if profile exists in zop-users
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM "zop-users"
WHERE email = 'test@test.com';

-- 3. Check if there's an ID mismatch
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  zu.id as profile_id,
  zu.email as profile_email,
  zu.role
FROM auth.users au
LEFT JOIN "zop-users" zu ON au.id = zu.id
WHERE au.email = 'test@test.com';

-- 4. If profile missing, create it manually
-- INSERT INTO "zop-users" (id, email, first_name, last_name, role, created_at, updated_at)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'first_name', ''),
--   COALESCE(raw_user_meta_data->>'last_name', ''),
--   'user',
--   NOW(),
--   NOW()
-- FROM auth.users
-- WHERE email = 'test@test.com'
-- AND NOT EXISTS (
--   SELECT 1 FROM "zop-users" WHERE id = auth.users.id
-- );

-- 5. Verify RLS policies allow user to see their own profile
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'zop-users'
ORDER BY policyname;
