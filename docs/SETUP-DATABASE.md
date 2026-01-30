# Database Setup Guide

## Step 1: Run the Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the migration SQL below:

```sql
-- Migration: Update zop-products to use sizeQuantities instead of stock_quantity

-- Add new columns
ALTER TABLE "zop-products"
ADD COLUMN IF NOT EXISTS sizeQuantities JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN "zop-products".sizeQuantities IS 'Customer app quantities by size: {"S": 10, "M": 5, "L": 3}';
COMMENT ON COLUMN "zop-products".sizes IS 'Available size names (array or object keys)';
COMMENT ON COLUMN "zop-products".colors IS 'Available color options';
COMMENT ON COLUMN "zop-products".in_stock IS 'Overall stock availability flag';
```

5. Click **Run** to execute the migration

## Step 2: Add Test Products (Optional)

If you want to add some test products directly in the database:

```sql
-- Insert test products with sizeQuantities

INSERT INTO "zop-products" (
  name,
  description,
  price,
  category,
  material,
  sustainability_rating,
  fit_type,
  comfort_score,
  insulation_score,
  flexibility_score,
  sizeQuantities,
  sizes,
  colors,
  in_stock,
  image_url,
  is_active,
  created_by
) VALUES
(
  'T-Shirt Premium',
  'T-shirt en coton biologique avec une coupe moderne',
  29.99,
  'vêtements',
  'Coton biologique',
  'A',
  'Regular',
  85,
  20,
  90,
  '{"S": 10, "M": 15, "L": 12, "XL": 8}'::jsonb,
  '["S", "M", "L", "XL"]'::jsonb,
  '["#FFFFFF", "#000000", "#3B82F6"]'::jsonb,
  true,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  true,
  (SELECT id FROM "zop-users" LIMIT 1)
),
(
  'Jeans Slim Fit',
  'Jeans slim fit durable et confortable',
  79.99,
  'vêtements',
  'Denim recyclé',
  'B',
  'Slim',
  75,
  30,
  70,
  '{"28": 5, "30": 8, "32": 12, "34": 10, "36": 6}'::jsonb,
  '["28", "30", "32", "34", "36"]'::jsonb,
  '["#1E3A8A", "#000000"]'::jsonb,
  true,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
  true,
  (SELECT id FROM "zop-users" LIMIT 1)
),
(
  'Veste en Lin',
  'Veste légère en lin pour l''été',
  99.99,
  'vêtements',
  'Lin naturel',
  'A',
  'Regular',
  90,
  10,
  95,
  '{"S": 3, "M": 5, "L": 4, "XL": 2}'::jsonb,
  '["S", "M", "L", "XL"]'::jsonb,
  '["#F0F9FF", "#FEF3C7"]'::jsonb,
  true,
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
  true,
  (SELECT id FROM "zop-users" LIMIT 1)
);
```

## Step 3: Verify in Supabase

1. Go to **Table Editor** in Supabase
2. Select **zop-products** table
3. You should see your products with the new columns

## Step 4: Add Products via UI

Alternatively, use your app's UI:

1. Navigate to `/products` in your app
2. Click **Nouveau Produit**
3. Fill in the form:
   - Name, description, price, category
   - Add sizes with quantities (e.g., S: 10, M: 15, L: 12)
   - Set material, sustainability rating
   - Add technical scores
4. Click **Créer le produit**

## Troubleshooting

### Empty Products Page

**Check 1: Are there products in the database?**

- Go to Supabase → Table Editor → zop-products
- If empty, add products using the SQL above or via the UI

**Check 2: Migration ran successfully?**

- In SQL Editor, run: `SELECT * FROM "zop-products" LIMIT 1;`
- Check if columns `sizeQuantities`, `sizes`, `colors`, `in_stock` exist

**Check 3: RLS Policies working?**

- Make sure you're logged in to the app
- Check browser console for errors (F12)

**Check 4: Environment variables set?**

- Verify `.env.local` has correct Supabase credentials:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  ```

### Browser Console Errors

Press F12 and check the Console tab for any error messages. Common issues:

- "Failed to fetch" → Check Supabase URL/keys
- "RLS policy" errors → Check you're authenticated
- "Column does not exist" → Run the migration

## Quick Test Query

Run this in Supabase SQL Editor to check your data:

```sql
-- Check products with sizes
SELECT
  name,
  price,
  sizeQuantities,
  sizes,
  in_stock,
  is_active
FROM "zop-products"
ORDER BY created_at DESC;
```
