# Nos Meilleurs Produits & Nos Offres du Moment — Guide Front-End

> Ce document explique comment intégrer les sections **"Nos Meilleurs Produits"** et **"Nos Offres du Moment"** sur le site web en utilisant les champs booléens de la base de données.

---

## Les champs disponibles

La table `zo-products` dans Supabase expose deux booléens de mise en avant :

| Champ | Section sur le site | Icône admin |
|-------|---------------------|-------------|
| `is_best_seller` | **Nos Meilleurs Produits** | ⭐ Étoile |
| `is_current_offer` | **Nos Offres du Moment** | 🏷️ Tag |

### Comment les activer côté admin

Sur la page **Produits** de Zo POS, chaque carte affiche une **colonne de 3 boutons en haut à gauche** de l'image :

1. **📊** — Télécharger les codes-barres
2. **⭐** — Activer / désactiver `is_best_seller`
3. **🏷️** — Activer / désactiver `is_current_offer`

> **🔵 Bleu = activé** | **Blanc = désactivé**

Un seul clic suffit. La mise à jour est instantanée dans Supabase (optimistic update + toast de confirmation).

---

## Installation du client Supabase

```bash
npm install @supabase/supabase-js
```

### Initialisation

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

---

## Requêtes Supabase

### Meilleurs Produits (`is_best_seller = true`)

```ts
const { data: bestSellers } = await supabase
  .from("zo-products")
  .select("id, title, description, price, image_url, category")
  .eq("is_best_seller", true)
  .eq("is_active", true)
  .order("created_at", { ascending: false });
```

### Offres du Moment (`is_current_offer = true`)

```ts
const { data: currentOffers } = await supabase
  .from("zo-products")
  .select("id, title, description, price, image_url, category")
  .eq("is_current_offer", true)
  .eq("is_active", true)
  .order("created_at", { ascending: false });
```

> **Note :** Filtrez toujours sur `is_active = true` pour exclure les produits désactivés.

---

## Exemple de composant React / Next.js

```tsx
// components/FeaturedSections.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
};

function useProducts(flag: "is_best_seller" | "is_current_offer") {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("zo-products")
      .select("id, title, description, price, image_url, category")
      .eq(flag, true)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts(data || []));
  }, [flag]);

  return products;
}

export function BestSellers() {
  const products = useProducts("is_best_seller");
  return (
    <section>
      <h2>Nos Meilleurs Produits</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p.id}>
            <img src={p.image_url} alt={p.title} />
            <h3>{p.title}</h3>
            <p>{p.price.toLocaleString()} FCFA</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CurrentOffers() {
  const products = useProducts("is_current_offer");
  return (
    <section>
      <h2>Nos Offres du Moment</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p.id}>
            <img src={p.image_url} alt={p.title} />
            <h3>{p.title}</h3>
            <p>{p.price.toLocaleString()} FCFA</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## Champs disponibles sur chaque produit

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `title` | `string` | Nom du produit |
| `description` | `string` | Description courte |
| `price` | `number` | Prix en FCFA |
| `image_url` | `string` | URL de l'image |
| `category` | `string` | Catégorie |
| `is_best_seller` | `boolean` | Mis en avant → Nos Meilleurs Produits |
| `is_current_offer` | `boolean` | Mis en avant → Nos Offres du Moment |
| `is_active` | `boolean` | `true` = produit disponible |

---

## Migration base de données

> Voir [`add-is-best-seller.sql`](./add-is-best-seller.sql). À exécuter une seule fois dans Supabase SQL Editor.

```sql
ALTER TABLE "zo-products" ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE "zo-products" ADD COLUMN IF NOT EXISTS is_current_offer BOOLEAN DEFAULT FALSE;
```

---

## Permissions Supabase (RLS)

La table `zo-products` doit être accessible en lecture publique (clé `anon`) :

```sql
CREATE POLICY "Public read access"
  ON "zo-products"
  FOR SELECT
  USING (true);
```

---

_Dernière mise à jour : Mars 2026_
