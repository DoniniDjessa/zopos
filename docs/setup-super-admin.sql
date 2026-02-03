-- Setup Super Admin and User Roles
-- Run this SQL in your Supabase SQL Editor

-- 1. Add role column to zop-users table if it doesn't exist
ALTER TABLE "zop-users" 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Create an index on the role column for faster queries
CREATE INDEX IF NOT EXISTS idx_zop_users_role ON "zop-users"(role);

-- 3. Set the first created user as super_admin
UPDATE "zop-users" 
SET role = 'super_admin' 
WHERE id = (
  SELECT id FROM "zop-users" ORDER BY created_at ASC LIMIT 1
);

-- 4. View all users and their roles to verify
SELECT id, email, first_name, last_name, role, created_at 
FROM "zop-users" 
ORDER BY created_at ASC;

-- Available roles:
-- 'super_admin' - Full access, can create/manage users
-- 'admin' - Can manage products, sales, and view analytics
-- 'accueil' - Reception/customer service role
-- 'vendeur' - Sales person role
-- 'comptable' - Accountant role
