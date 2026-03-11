# Produits Enfants — Guide Front-End

> Ce document explique comment distinguer les **produits pour enfants** des **produits pour adultes** sur le site web en utilisant le champ `is_kids_product` de la base de données.

---

## Le champ disponible

La table `zo-products` dans Supabase expose désormais un booléen `is_kids_product`:

| Champ | Type | Description |
|-------|------|-------------|
| `is_kids_product` | `boolean` | `true` si c'est un produit pour enfants, `false` par défaut. |

### Comment les configurer côté admin

Sur la page **Nouveau Produit** de Zo POS (`/products/add`), vous avez maintenant une case à cocher **"Produit pour enfants"** dans la section "Options". Cela marquera le produit comme `is_kids_product = true`.

La liste des produits (`/products`) contient désormais des onglets : **Adultes** et **Enfants**. Les produits créés avec l'option enfants apparaîtront dans l'onglet Enfants.

---

## Requêtes Supabase

### Liste des Produits Adultes

```ts
const { data: adultProducts } = await supabase
  .from("zo-products")
  .select("*")
  .eq("is_active", true)
  .eq("is_kids_product", false) // Ou .is("is_kids_product", null) selon vos données historiques
  .order("created_at", { ascending: false });
```

### Liste des Produits Enfants

```ts
const { data: kidsProducts } = await supabase
  .from("zo-products")
  .select("*")
  .eq("is_active", true)
  .eq("is_kids_product", true)
  .order("created_at", { ascending: false });
```

---

## Migration base de données

> Si `is_kids_product` n'est pas encore présent sur votre table locale ou distante, executez cette requête SQL :

```sql
ALTER TABLE "zo-products" ADD COLUMN IF NOT EXISTS is_kids_product BOOLEAN DEFAULT FALSE;
```

---

_Dernière mise à jour : Mars 2026_
