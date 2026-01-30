# Owner App - Product Integration Guide

## Overview

This guide explains how to use the **same products** from the main AtelierZo app in your owner app. Both apps share the same product database table (`zo-products`), but each app has its own separate quantity field.

## 🔑 Key Concept: Same Products, Different Quantities

- ✅ **Same Database Table**: Both apps use `zo-products`
- ✅ **Same Product Details**: title, description, price, images, colors, sizes (all shared)
- ✅ **Different Quantity Fields**:
  - Customer app uses: `sizeQuantities`
  - Owner app uses: `ownerQty` (or whatever name you choose)

**You do NOT need to create new products!** Just add your own quantity field to the existing table.

---

## Where to Find the Products

### Database Location

**Table Name:** `zo-products` (same table for both apps)

**Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Click on **Table Editor** in the left sidebar
3. Select the **`zo-products`** table
4. You'll see all products with their details

**Direct Database Access:**

- Project URL: Your Supabase project URL
- Table: `zo-products`
- Schema: `public` (default)

---

## Database Schema

### Current Products Table: `zo-products`

```sql
-- Shared product fields (used by BOTH apps)
id              UUID PRIMARY KEY
title           TEXT NOT NULL
description     TEXT
price           DECIMAL
old_price       DECIMAL
image_url       TEXT
colors          JSONB (array of color strings)
sizes           JSONB (can be array or object - just the size names)
category        TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP

-- Customer app quantity field (customer inventory)
sizeQuantities  JSONB (object: {"S": 10, "M": 5, "L": 8})
in_stock        BOOLEAN (calculated from sizeQuantities)
```

### Add Owner Quantity Field

You need to add a new column for your owner app quantities:

```sql
-- Run this in Supabase SQL Editor to add owner quantity field
ALTER TABLE "zo-products"
ADD COLUMN IF NOT EXISTS owner_qty JSONB DEFAULT '{}';

-- Alternative names you can use:
-- admin_qty, ownerqty, owner_inventory, shop_qty, etc.
```

**After adding this column, the table will have:**

```sql
-- Customer app uses this:
sizeQuantities  JSONB ({"S": 10, "M": 5})  -- Customer inventory

-- Owner app uses this:
owner_qty       JSONB ({"S": 3, "M": 7})   -- Owner inventory

-- Both are independent!
```

---

## How to Load Products in Owner App

### Step 1: Add Owner Quantity Column

First, add the owner quantity field to the existing table:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE "zo-products"
ADD COLUMN IF NOT EXISTS owner_qty JSONB DEFAULT '{}';

-- You can name it anything you want:
-- owner_qty, ownerqty, admin_qty, shop_qty, etc.
```

### Step 2: Fetch Products with Owner Quantities

Now you can load products including YOUR quantities (not customer quantities):

```typescript
// lib/supabase/owner-products.ts

import { supabase } from "./client";

export interface OwnerProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  colors?: string[];
  sizes?: string[];
  category?: string;
  ownerQty?: Record<string, number>; // YOUR quantities
  // Note: We don't include sizeQuantities (that's for customer app)
}

/**
 * Fetch all products with owner quantities
 * (excludes customer quantities - sizeQuantities)
 */
export async function getOwnerProducts(): Promise<{
  data: OwnerProduct[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("zo-products")
      .select(
        `
        id,
        title,
        description,
        price,
        old_price,
        image_url,
        colors,
        sizes,
        category,
        owner_qty,
        created_at,
        updated_at
      `,
      )
      // ⚠️ Notice: We SELECT owner_qty but NOT sizeQuantities
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return { data: null, error: error.message };
    }

    const products: OwnerProduct[] = (data || []).map((item: any) => {
      // Extract size names
      let sizes: string[] = [];
      if (item.sizes) {
        if (Array.isArray(item.sizes)) {
          sizes = item.sizes;
        } else if (typeof item.sizes === "object") {
          sizes = Object.keys(item.sizes);
        }
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: Number(item.price),
        oldPrice: item.old_price ? Number(item.old_price) : undefined,
        imageUrl: item.image_url,
        colors: item.colors || [],
        sizes: sizes,
        category: item.category || "bermuda",
        ownerQty: item.owner_qty || {}, // YOUR quantities
      };
    });

    return { data: products, error: null };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { data: null, error: error.message || "Unknown error" };
  }
}
```

### Step 3: Update Owner Quantities

To update YOUR quantities (not affecting customer quantities):

```typescript
/**
 * Update owner quantities for a product
 */
export async function updateOwnerQty(
  productId: string,
  ownerQty: Record<string, number>,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from("zo-products")
      .update({
        owner_qty: ownerQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
```

### Step 4: Supabase Client Setup

```typescript
// lib/supabase/client.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Example: Product List Component

````typescript
// components/OwnerProductList.tsx

'use client';

import { useEffect, useState } from 'react';
import { getOwnerProducts } from '@/lib/supabase/owner-products';
import { OwnerProduct } from '@/types/owner-product';

export default function OwnerProductList() {
  const [products, setProducts] = useState<OwnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await getOwnerProducts();

    if (error) {
      setError(error);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">Loading products...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Products from Main App
      </h1>

      <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
        <p className="text-sm text-blue-800">
          💡 These products are from the customer app (table: <code>zo-products</code>).
          You can view details but quantities are managed separately in your owner inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 shadow hover:shadow-lg">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-48 object-cover rounded mb-3"
            />

            <h3 className="font-semibold text-lg">{product.title}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {product.description}
            </p>

            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold">${product.price}</span>
              {product.oldPrice && (
                <span className="text-gray-400 line-through">
                  ${product.oldPrice}
                </span>
              )}
            </div>

            {/* Available sizes (no quantities shown) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-2">
                <span className="text-sm font-medium">Available Sizes:</span>
                <div className="flex gap-1 mt-1">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-2">
                <span className="text-sm font-medium">Colors:</span>
                <div className="flex gap-1 mt-1">
                  {product.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t">
              <span className="text-xs text-gray-500">
                ID: {product.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No products found in the main app
        </div>
      )}
    </div>
  );
}
```typescript
// components/OwnerProductList.tsx

"use client";

import { useEffect, useState } from "react";
import { getOwnerProducts, updateOwnerQty } from "@/lib/supabase/owner-products";
import { OwnerProduct } from "@/lib/supabase/owner-products";

export default function OwnerProductList() {
  const [products, setProducts] = useState<OwnerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await getOwnerProducts();
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleUpdateQty = async (productId: string, size: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedOwnerQty = {
      ...product.ownerQty,
      [size]: newQty,
    };

    await updateOwnerQty(productId, updatedOwnerQty);
    loadProducts(); // Refresh
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Owner Shop Products</h1>

      <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Same products as customer app</strong> - but with YOUR own quantities (ownerQty).
          Customer quantities (sizeQuantities) are separate and not shown here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-48 object-cover rounded mb-3"
            />

            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
            <p className="text-xl font-bold">${product.price}</p>

            {/* Owner Quantities */}
            <div className="mt-3 border-t pt-3">
              <p className="text-sm font-medium mb-2">Your Inventory (ownerQty):</p>
              {product.sizes?.map((size) => (
                <div key={size} className="flex items-center gap-2 mb-1">
                  <span className="w-12 text-sm">{size}:</span>
                  <input
                    type="number"
                    min="0"
                    value={product.ownerQty?.[size] || 0}
                    onChange={(e) =>
                      handleUpdateQty(product.id, size, parseInt(e.target.value) || 0)
                    }
                    className="w-20 px-2 py-1 border rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
````

---

## Usage Examples

### Example 1: Load All Products with Owner Quantities

```typescript
const { data: products, error } = await getOwnerProducts();

// Each product has:
// - id, title, description, price, etc. (shared with customer app)
// - ownerQty: {"S": 5, "M": 10} (YOUR quantities)
// - Does NOT have sizeQuantities (customer quantities)
```

### Example 2: Update Owner Quantity

```typescript
const productId = "xxx-xxx-xxx";

// Set your owner quantities
await updateOwnerQty(productId, {
  S: 5,
  M: 10,
  L: 7,
  XL: 3,
});

// This updates ONLY owner_qty column
// Customer quantities (sizeQuantities) remain unchanged
```

### Example 3: Direct Query

```typescript
import { supabase } from "@/lib/supabase/client";

// Fetch with owner quantities
const { data } = await supabase
  .from("zo-products")
  .select("id, title, price, owner_qty") // Include owner_qty
  .eq("category", "bermuda");

// Access owner quantities
data?.forEach((product) => {
  console.log(product.title);
  console.log("Owner qty:", product.owner_qty); // {"S": 5, "M": 10}
});
```

---

## Visual Example: How Data is Stored

### Same Product, Different Quantities

```
Product ID: 123abc

┌─────────────────────────────────────────────────────────┐
│ zo-products table (SHARED)                              │
├─────────────────────────────────────────────────────────┤
│ id:           123abc                                    │
│ title:        "Summer Bermuda Shorts"                   │
│ price:        29.99                                     │
│ description:  "Comfortable cotton shorts..."            │
│ image_url:    "https://..."                             │
│ colors:       ["blue", "black", "white"]                │
│ sizes:        ["S", "M", "L", "XL"]                     │
│ category:     "bermuda"                                 │
│                                                         │
│ ─────────── QUANTITIES (SEPARATE) ───────────           │
│                                                         │
│ sizeQuantities: {"S": 10, "M": 15, "L": 8, "XL": 5}   │ ← Customer app
│ owner_qty:      {"S": 3,  "M": 7,  "L": 2,  "XL": 1}   │ ← Owner app (YOU)
└─────────────────────────────────────────────────────────┘
```

**Customer App reads**: `sizeQuantities`  
**Owner App reads**: `owner_qty`  
**Both apps share**: Everything else (title, price, images, etc.)

---

## Best Practices

1. ✅ **Same Table**: Use `zo-products` for both apps
2. ✅ **Add Column**: Add `owner_qty` column to existing table
3. ✅ **Don't Touch Customer Data**: Never read/write `sizeQuantities` in owner app
4. ✅ **Clear Naming**: Use distinct names (`ownerQty` vs `sizeQuantities`)
5. ✅ **No Duplication**: Don't create new product records - use existing ones

---

## What NOT to Do

❌ Don't create a separate products table for owner app  
❌ Don't modify `sizeQuantities` in owner app  
❌ Don't read `sizeQuantities` in owner app (causes confusion)  
❌ Don't duplicate product entries

---

## Summary

**Database Structure:**

- Table: `zo-products` (same for both apps)
- Customer qty: `sizeQuantities` column
- Owner qty: `owner_qty` column (you add this)

**What Each App Uses:**

| Field          | Customer App   | Owner App |
| -------------- | -------------- | --------- |
| id, title, etc | ✅             | ✅        |
| sizeQuantities | ✅ Uses        | ❌ Ignore |
| owner_qty      | ❌ Doesn't use | ✅ Uses   |

**Implementation Steps:**

1. Run SQL to add `owner_qty` column
2. Select `owner_qty` (not `sizeQuantities`) in queries
3. Update `owner_qty` for your inventory
4. Both apps share same products, different quantities!

---

## Environment Variables

```bash
# Same Supabase project as customer app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

That's it! You're using the same products with your own separate inventory. 🎉
✅ Prevent confusion between customer and owner stock  
✅ Use the same database with clear separation of concerns
