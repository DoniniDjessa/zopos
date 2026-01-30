-- Migration: Update zop-products to use sizeQuantities instead of stock_quantity
-- This aligns with the owner app requirements for shared product data

-- Add new columns
ALTER TABLE "zop-products" 
ADD COLUMN IF NOT EXISTS sizeQuantities JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- Migrate existing stock_quantity to sizeQuantities (if you have data)
-- This assumes a default "One Size" approach for existing products
-- UPDATE "zop-products" 
-- SET sizeQuantities = jsonb_build_object('One Size', stock_quantity)
-- WHERE stock_quantity IS NOT NULL AND stock_quantity > 0;

-- Update in_stock based on whether there's any quantity
-- UPDATE "zop-products"
-- SET in_stock = (
--   CASE 
--     WHEN sizeQuantities::text = '{}'::text THEN false
--     ELSE true
--   END
-- );

-- Drop old column (ONLY after confirming data migration)
-- ALTER TABLE "zop-products" DROP COLUMN IF EXISTS stock_quantity;

-- Add comment for documentation
COMMENT ON COLUMN "zop-products".sizeQuantities IS 'Customer app quantities by size: {"S": 10, "M": 5, "L": 3}';
COMMENT ON COLUMN "zop-products".sizes IS 'Available size names (array or object keys)';
COMMENT ON COLUMN "zop-products".colors IS 'Available color options';
COMMENT ON COLUMN "zop-products".in_stock IS 'Overall stock availability flag';
