-- Add Zo POS quantity field to existing zo-products table
-- This allows us to use the same products but with our own separate quantities

ALTER TABLE "zo-products"
ADD COLUMN IF NOT EXISTS zopos_qty JSONB DEFAULT '{}';

COMMENT ON COLUMN "zo-products".zopos_qty IS 'Zo POS app quantities by size: {"S": 10, "M": 5, "L": 3}';

-- Note: 
-- sizeQuantities = Other app's quantities (don't touch)
-- zopos_qty = Your app's quantities (manage this one)
