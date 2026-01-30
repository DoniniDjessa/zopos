-- Create zop-users table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create zop-users table
CREATE TABLE IF NOT EXISTS "zop-users" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_zop_users_updated_at
  BEFORE UPDATE ON "zop-users"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE "zop-users" ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON "zop-users"
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "zop-users"
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (needed for registration)
CREATE POLICY "Users can insert own profile"
  ON "zop-users"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_zop_users_email ON "zop-users"(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_zop_users_created_at ON "zop-users"(created_at DESC);

-- ============================================
-- Create zop-products table
-- ============================================

CREATE TABLE IF NOT EXISTS "zop-products" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  material TEXT,
  sustainability_rating TEXT,
  fit_type TEXT,
  comfort_score INTEGER CHECK (comfort_score >= 0 AND comfort_score <= 100),
  insulation_score INTEGER CHECK (insulation_score >= 0 AND insulation_score <= 100),
  flexibility_score INTEGER CHECK (flexibility_score >= 0 AND flexibility_score <= 100),
  sizeQuantities JSONB DEFAULT '{}'::jsonb, -- Customer app quantities: {"S": 10, "M": 5, "L": 3}
  in_stock BOOLEAN DEFAULT true,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb, -- Available sizes array
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES "zop-users"(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at on products
CREATE TRIGGER update_zop_products_updated_at
  BEFORE UPDATE ON "zop-products"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for products
ALTER TABLE "zop-products" ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products"
  ON "zop-products"
  FOR SELECT
  USING (is_active = true);

-- Only authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
  ON "zop-products"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own products
CREATE POLICY "Users can update own products"
  ON "zop-products"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
  ON "zop-products"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_zop_products_category ON "zop-products"(category);
CREATE INDEX IF NOT EXISTS idx_zop_products_active ON "zop-products"(is_active);
CREATE INDEX IF NOT EXISTS idx_zop_products_created_at ON "zop-products"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zop_products_price ON "zop-products"(price);
