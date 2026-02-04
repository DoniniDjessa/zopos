"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";

// Default sizes for products
const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const getDefaultSizeQuantities = (): Record<string, number> => {
  const defaults: Record<string, number> = {};
  DEFAULT_SIZES.forEach((size) => {
    defaults[size] = 0;
  });
  return defaults;
};

export default function AddProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingProducts, setExistingProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_active: true,
    material: "",
    sustainability_rating: "",
    fit_type: "",
    comfort_score: "",
    insulation_score: "",
    flexibility_score: "",
  });

  // Size quantities management - initialize with default sizes
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(
    getDefaultSizeQuantities(),
  );
  const [newSize, setNewSize] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchExistingProducts();
    }
  }, [user]);

  const fetchExistingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("zo-products")
        .select(
          "id, name, description, price, category, image_url, is_active, zopos_qty",
        )
        .order("name", { ascending: true });

      if (error) throw error;
      setExistingProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = existingProducts.find((p) => p.id === productId);
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price?.toString() || "",
        category: product.category || "",
        image_url: product.image_url || "",
        is_active: product.is_active ?? true,
        material: product.material || "",
        sustainability_rating: product.sustainability_rating || "",
        fit_type: product.fit_type || "",
        comfort_score: product.comfort_score?.toString() || "",
        insulation_score: product.insulation_score?.toString() || "",
        flexibility_score: product.flexibility_score?.toString() || "",
      });

      // Merge default sizes with any existing zopos_qty from the product
      const mergedSizes = {
        ...getDefaultSizeQuantities(),
        ...(product.zopos_qty || {}),
      };
      setSizeQuantities(mergedSizes);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const addSize = () => {
    if (newSize && newQuantity) {
      setSizeQuantities({
        ...sizeQuantities,
        [newSize]: parseInt(newQuantity),
      });
      setNewSize("");
      setNewQuantity("");
    }
  };

  const removeSize = (size: string) => {
    const updated = { ...sizeQuantities };
    delete updated[size];
    setSizeQuantities(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (selectedProductId) {
        // Update existing product with our zopos_qty only
        const { error: updateError } = await supabase
          .from("zo-products")
          .update({
            zopos_qty: sizeQuantities, // Only update our quantity field
          })
          .eq("id", selectedProductId);

        if (updateError) throw updateError;
      } else {
        // Create new product (only if creating products from your app)
        const { error: insertError } = await supabase
          .from("zo-products")
          .insert({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            material: formData.material || null,
            sustainability_rating: formData.sustainability_rating || null,
            fit_type: formData.fit_type || null,
            comfort_score: formData.comfort_score
              ? parseInt(formData.comfort_score)
              : null,
            insulation_score: formData.insulation_score
              ? parseInt(formData.insulation_score)
              : null,
            flexibility_score: formData.flexibility_score
              ? parseInt(formData.flexibility_score)
              : null,
            zopos_qty: sizeQuantities, // Our quantity field only
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            created_by: user?.id,
          });

        if (insertError) throw insertError;
      }

      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout du produit");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
          <p className="mt-4 text-[#0F172A]/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="text-[#3B82F6] hover:text-[#2563EB] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0F172A]">
                Nouveau Produit
              </h1>
              <p className="text-sm text-[#0F172A]/60">
                Ajouter un produit à votre catalogue
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-md rounded-none shadow-xl p-8 border border-white/20">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 rounded-none text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selector */}
            <div className="bg-blue-50/50 border border-blue-200/50 rounded-none p-4">
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Sélectionner un produit existant
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-4 py-1.5 bg-white border border-[#3B82F6]/20 rounded-none 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
              >
                <option value="">-- Sélectionner un produit --</option>
                {existingProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.price}€
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-800 mt-2">
                💡 Sélectionnez un produit du catalogue principal, puis ajoutez
                vos propres quantités Zo POS
              </p>
            </div>

            {/* Basic Information */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#0F172A] mb-4">
                Informations de base
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={!!selectedProductId}
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Ex: Chemise en lin premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                    placeholder="Décrivez votre produit..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Prix (€) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                               focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                      placeholder="99.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Catégorie *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                               focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                    >
                      <option value="">Sélectionner</option>
                      <option value="vêtements">Vêtements</option>
                      <option value="accessoires">Accessoires</option>
                      <option value="chaussures">Chaussures</option>
                      <option value="bijoux">Bijoux</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                    placeholder="https://exemple.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Sizes and Quantities */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#0F172A] mb-4">
                Tailles et Stock
              </h2>

              <div className="bg-blue-50/50 border border-blue-200/50 rounded-none p-4 mb-4">
                <p className="text-sm text-blue-800">
                  💡 Ajoutez les tailles disponibles et leur quantité en stock.
                  Ces quantités sont pour votre boutique (différentes de celles
                  du propriétaire).
                </p>
              </div>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Taille (ex: S, M, L)"
                  className="flex-1 px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                />
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="Quantité"
                  min="0"
                  className="w-32 px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="px-6 py-1.5 bg-[#3B82F6] text-white rounded-none hover:bg-[#2563EB] 
                           transition-all duration-200 font-medium"
                >
                  Ajouter
                </button>
              </div>

              {/* Size List */}
              {Object.keys(sizeQuantities).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#0F172A]">
                    Tailles ajoutées:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sizeQuantities).map(([size, qty]) => (
                      <div
                        key={size}
                        className="flex items-center justify-between p-3 bg-[#F0F9FF] rounded-none"
                      >
                        <span className="text-sm text-[#0F172A]">
                          <strong>{size}</strong>: {qty} unité
                          {qty !== 1 ? "s" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[#0F172A]/60">
                    Total en stock:{" "}
                    {Object.values(sizeQuantities).reduce((a, b) => a + b, 0)}{" "}
                    unités
                  </p>
                </div>
              )}
            </div>

            {/* Status */}
            {/* <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]"
                />
                <span className="text-sm font-medium text-[#0F172A]">
                  Produit actif (visible aux clients)
                </span>
              </label>
            </div> */}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-1.5 bg-[#3B82F6] text-white rounded-none hover:bg-[#2563EB] 
                         transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création..." : "Créer le produit"}
              </button>
              <Link
                href="/products"
                className="px-6 py-1.5 bg-gray-200 text-[#0F172A] rounded-none hover:bg-gray-300 
                         transition-all duration-200 font-medium text-center"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
