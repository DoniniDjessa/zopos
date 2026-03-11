-- Migration: Add is_best_seller and is_current_offer boolean columns to zo-products
-- Run this once in your Supabase SQL Editor

ALTER TABLE "zo-products"
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;

ALTER TABLE "zo-products"
  ADD COLUMN IF NOT EXISTS is_current_offer BOOLEAN DEFAULT FALSE;

-- Optional: verify
-- SELECT id, title, is_best_seller, is_current_offer FROM "zo-products" LIMIT 10;
