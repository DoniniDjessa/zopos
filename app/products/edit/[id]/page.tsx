"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";

// Default sizes for products
const DEFAULT_SIZES = ["M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const getDefaultSizeQuantities = (): Record<string, number> => {
  const defaults: Record<string, number> = {};
  DEFAULT_SIZES.forEach((size) => {
    defaults[size] = 0;
  });
  return defaults;
};

export default function EditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_active: true,
  });

  // Size quantities management
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(
    {},
  );
  const [newSize, setNewSize] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && productId) {
      fetchProduct();
    }
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("zo-products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || data.name || "",
        description: data.description || "",
        price: data.price.toString(),
        category: data.category,
        image_url: data.image_url || "",
        is_active: data.is_active,
      });

      // Merge default sizes with existing zopos_qty
      const mergedSizes = {
        ...getDefaultSizeQuantities(),
        ...(data.zopos_qty || {}),
      };
      setSizeQuantities(mergedSizes);
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Produit non trouvé");
    } finally {
      setLoading(false);
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

  const updateSizeQty = (size: string, qty: number) => {
    setSizeQuantities({
      ...sizeQuantities,
      [size]: qty,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Only update our own zopos_qty field - don't touch sizes or sizeQuantities
      const { error: updateError } = await supabase
        .from("zo-products")
        .update({
          zopos_qty: sizeQuantities, // Our quantity field only - don't update shared fields
        })
        .eq("id", productId);

      if (updateError) throw updateError;

      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification du produit");
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
                Modifier le Produit
              </h1>
              <p className="text-sm text-[#0F172A]/60">
                Mettre à jour les informations du produit
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
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled
                    className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]
                             disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-[#0F172A]/50 mt-1">
                    Le nom du produit ne peut pas être modifié (produit partagé)
                  </p>
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
                    disabled
                    className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]
                             disabled:opacity-70 disabled:cursor-not-allowed"
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
                      disabled
                      className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                               focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]
                               disabled:opacity-70 disabled:cursor-not-allowed"
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
                      disabled
                      className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                               focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]
                               disabled:opacity-70 disabled:cursor-not-allowed"
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
                    disabled
                    className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]
                             disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="bg-amber-50/50 border border-amber-200/50 rounded-none p-4">
                  <p className="text-sm text-amber-800">
                    ℹ️ Les informations du produit (nom, description, prix,
                    catégorie, image) sont partagées avec l'app propriétaire et
                    ne peuvent pas être modifiées ici. Seules les quantités de
                    stock peuvent être gérées.
                  </p>
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
                  💡 Gérez les tailles et quantités pour votre boutique. Ces
                  quantités sont indépendantes de celles du propriétaire.
                </p>
              </div>

              {/* Existing Sizes */}
              {Object.keys(sizeQuantities).length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-[#0F172A] mb-2">
                    Tailles actuelles:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(sizeQuantities).map(([size, qty]) => (
                      <div
                        key={size}
                        className="flex items-center gap-2 p-3 bg-[#F0F9FF] rounded-none"
                      >
                        <span className="text-sm font-medium text-[#0F172A] flex-shrink-0">
                          {size}:
                        </span>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) =>
                            updateSizeQty(size, parseInt(e.target.value) || 0)
                          }
                          min="0"
                          className="flex-1 px-2 py-1 bg-white border border-[#3B82F6]/20 rounded-lg text-sm
                                   focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                        />
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
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

              {/* Add New Size */}
              <div>
                <p className="text-sm font-medium text-[#0F172A] mb-2">
                  Ajouter une taille:
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="Taille (ex: XL)"
                    className="flex-1 px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                  />
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    placeholder="Quantité"
                    min="0"
                    className="w-32 px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
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
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-[#3B82F6] text-white rounded-[16px] hover:bg-[#2563EB] 
                         transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
              <Link
                href="/products"
                className="px-6 py-3 bg-gray-200 text-[#0F172A] rounded-[16px] hover:bg-gray-300 
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
