# Owner App - Product Integration Guide

## Overview

This guide explains how to load products from the main AtelierZo app into the owner app. The owner app will display products without quantity information, as it maintains its own separate inventory system.

---

## Where to Find the Products

### Database Location

**Table Name:** `zo-products`

**Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Click on **Table Editor** in the left sidebar
3. Select the **`zo-products`** table
4. You'll see all products with their details

**Direct Database Access:**

- Project URL: Your Supabase project URL
- Table: `zo-products`
- Schema: `public` (default)

### Programmatic Access

**Method 1: Using the provided function**

```typescript
import { getOwnerProducts } from "@/lib/supabase/owner-products";

const { data: products, error } = await getOwnerProducts();
// products = array of all products without customer quantities
```

**Method 2: Direct Supabase query**

```typescript
import { supabase } from "@/lib/supabase/client";

const { data, error } = await supabase
  .from("zo-products")
  .select(
    "id, title, description, price, old_price, image_url, colors, sizes, category",
  )
  .order("created_at", { ascending: false });
```

**Method 3: API Route** (if you implement it)

```typescript
// GET /api/owner/products
fetch("/api/owner/products")
  .then((res) => res.json())
  .then((data) => console.log(data.products));
```

---

## Key Concepts

### Separation of Concerns

- **Main App**: Customer-facing store with its own inventory (`sizeQuantities`)
- **Owner App**: Separate shop for owners with independent inventory (`adminQty`)
- **Shared Data**: Product details (title, description, price, images, etc.)

### Why Separate Quantities?

- Prevents confusion between customer inventory and owner inventory
- Allows owners to manage their own stock independently
- Avoids duplicate product creation in the owner app

---

## Database Schema

### Products Table: `zo-products`

```sql
-- Core product fields (shared between apps)
id              UUID PRIMARY KEY
title           TEXT NOT NULL
description     TEXT
price           DECIMAL
old_price       DECIMAL
image_url       TEXT
colors          JSONB (array of color strings)
sizes           JSONB (can be array or object)
category        TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP

-- Customer app quantity (ignore in owner app)
in_stock        BOOLEAN
sizeQuantities  JSONB (object: {"S": 10, "M": 5, ...})
```

**Important:** When fetching for the owner app, **do NOT select** `in_stock` or `sizeQuantities` fields. These are for the customer app only.

---

## Implementation Guide

### 1. Product Type for Owner App

Create a simplified product type without quantity fields:

```typescript
// types/owner-product.ts

export interface OwnerProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  colors?: string[];
  sizes?: string[]; // Just the available sizes, no quantities
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OwnerProductWithQty extends OwnerProduct {
  adminQty?: Record<string, number>; // Owner's own inventory
}
```

### 2. Supabase Client Setup

```typescript
// lib/supabase/client.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Fetch Products Without Quantities

```typescript
// lib/supabase/owner-products.ts

import { supabase } from "./client";
import { OwnerProduct } from "@/types/owner-product";

/**
 * Fetch all products for owner app (without customer quantities)
 *
 * This function connects to the same database as the main app
 * but only retrieves product details without inventory data
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
        created_at,
        updated_at
      `,
      )
      // Explicitly exclude sizeQuantities and in_stock
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching owner products:", error);
      return { data: null, error: error.message };
    }

    // Transform to owner product format
    const ownerProducts: OwnerProduct[] = (data || []).map((item: any) => {
      // Extract just the size names (no quantities)
      let sizes: string[] = [];

      if (item.sizes) {
        if (typeof item.sizes === "string") {
          try {
            const parsed = JSON.parse(item.sizes);
            if (typeof parsed === "object" && !Array.isArray(parsed)) {
              // It's an object with quantities - extract keys only
              sizes = Object.keys(parsed);
            } else if (Array.isArray(parsed)) {
              sizes = parsed;
            }
          } catch {
            sizes = [];
          }
        } else if (typeof item.sizes === "object") {
          if (Array.isArray(item.sizes)) {
            sizes = item.sizes;
          } else {
            // Extract keys from quantity object
            sizes = Object.keys(item.sizes);
          }
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
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });

    return { data: ownerProducts, error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching owner products:", error);
    return { data: null, error: error.message || "Unknown error" };
  }
}

/**
 * Get a single product by ID (for owner app)
 */
export async function getOwnerProductById(
  productId: string,
): Promise<{ data: OwnerProduct | null; error: string | null }> {
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
        created_at,
        updated_at
      `,
      )
      .eq("id", productId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Product not found" };
    }

    // Transform sizes
    let sizes: string[] = [];
    if (data.sizes) {
      if (typeof data.sizes === "object") {
        if (Array.isArray(data.sizes)) {
          sizes = data.sizes;
        } else {
          sizes = Object.keys(data.sizes);
        }
      }
    }

    const ownerProduct: OwnerProduct = {
      id: data.id,
      title: data.title,
      description: data.description,
      price: Number(data.price),
      oldPrice: data.old_price ? Number(data.old_price) : undefined,
      imageUrl: data.image_url,
      colors: data.colors || [],
      sizes: sizes,
      category: data.category || "bermuda",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: ownerProduct, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Unknown error" };
  }
}
```

### 4. Product List Component Example

```typescript
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
```

### 5. Managing Owner Inventory (adminQty)

For managing the owner's own inventory separately:

```typescript
// lib/supabase/owner-inventory.ts

import { supabase } from "./client";

export interface OwnerInventory {
  id: string;
  product_id: string; // References zo-products.id
  admin_qty: Record<string, number>; // e.g., {"S": 5, "M": 10, "L": 3}
  updated_at: string;
}

/**
 * Create a separate table for owner inventory
 * This keeps owner quantities completely separate from customer quantities
 */

/**
 * Get owner inventory for a specific product
 */
export async function getOwnerInventory(
  productId: string,
): Promise<{ data: Record<string, number> | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("owner-inventory")
      .select("admin_qty")
      .eq("product_id", productId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows
      return { data: null, error: error.message };
    }

    return { data: data?.admin_qty || {}, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Update owner inventory for a product
 */
export async function updateOwnerInventory(
  productId: string,
  adminQty: Record<string, number>,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from("owner-inventory").upsert({
      product_id: productId,
      admin_qty: adminQty,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
```

### 6. Database Table for Owner Inventory

```sql
-- Create owner inventory table (run this in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS "owner-inventory" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES "zo-products"(id) ON DELETE CASCADE,
  admin_qty JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(product_id)
);

-- Add index for faster lookups
CREATE INDEX idx_owner_inventory_product_id ON "owner-inventory"(product_id);

-- Enable Row Level Security
ALTER TABLE "owner-inventory" ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated owners can access their inventory
CREATE POLICY "Owners can manage their inventory"
ON "owner-inventory"
FOR ALL
USING (auth.role() = 'authenticated');
```

---

## Usage Examples

### Example 1: Simple Product List

```typescript
const { data: products, error } = await getOwnerProducts();
console.log("Products from main app:", products);
```

### Example 2: Product with Owner Inventory

```typescript
const productId = "xxx-xxx-xxx";
const { data: product } = await getOwnerProductById(productId);
const { data: adminQty } = await getOwnerInventory(productId);

console.log("Product:", product);
console.log("Owner Inventory:", adminQty);
// Owner Inventory: {"S": 5, "M": 10, "L": 3}
```

### Example 3: Update Owner Inventory

```typescript
const productId = "xxx-xxx-xxx";
const newQty = {
  S: 8,
  M: 15,
  L: 5,
  XL: 2,
};

await updateOwnerInventory(productId, newQty);
```

---

## Best Practices

1. **Never Mix Quantities**: Always use `adminQty` for owner inventory, never read or write to `sizeQuantities`
2. **Read-Only Product Details**: Owner app should only read product details from `zo-products`, not modify them
3. **Separate Tables**: Keep owner inventory in a separate table (`owner-inventory`)
4. **Check Product Existence**: Before setting `adminQty`, verify the product exists in the main app
5. **Clear Naming**: Use clear variable names like `adminQty` vs `sizeQuantities` to avoid confusion

---

## Environment Variables

Add these to your owner app's `.env.local`:

```bash
# Same Supabase project as main app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## API Route Example (Optional)

If you want to create an API endpoint:

```typescript
// app/api/owner/products/route.ts

import { NextResponse } from "next/server";
import { getOwnerProducts } from "@/lib/supabase/owner-products";

export async function GET() {
  const { data, error } = await getOwnerProducts();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}
```

---

## Quick Reference

### Where is the data?

- **Database**: Same Supabase project as main app
- **Table**: `zo-products`
- **Access**: Via Supabase Table Editor or programmatic queries

### What fields to fetch?

✅ **Include**: `id`, `title`, `description`, `price`, `old_price`, `image_url`, `colors`, `sizes`, `category`  
❌ **Exclude**: `sizeQuantities`, `in_stock` (these are for customer app only)

### How to manage inventory?

- **Customer app quantities**: Stored in `zo-products.sizeQuantities` (don't touch)
- **Owner app quantities**: Store in separate `owner-inventory.admin_qty` table

---

## Summary

- **Products**: Loaded from `zo-products` table (shared with main app)
- **Customer Qty**: `sizeQuantities` field (ignore in owner app)
- **Owner Qty**: `adminQty` in separate `owner-inventory` table
- **Purpose**: Avoid duplicate products while maintaining separate inventories

This architecture allows the owner app to:
✅ See all products from the main app  
✅ Avoid creating duplicate products  
✅ Maintain completely separate inventory  
✅ Prevent confusion between customer and owner stock  
✅ Use the same database with clear separation of concerns
