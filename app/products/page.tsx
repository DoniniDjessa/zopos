"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  material: string;
  sustainability_rating: string;
  zopos_qty: Record<string, number>; // OUR quantities: {"S": 10, "M": 5, "L": 3}
  sizeQuantities: Record<string, number>; // Other app's quantities (don't touch)
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qtyUpdates, setQtyUpdates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("zo-products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      const { error } = await supabase
        .from("zo-products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Erreur lors de la suppression du produit");
    }
  };

  const openQtyModal = (product: Product) => {
    setSelectedProduct(product);
    // Merge default sizes with existing zopos_qty
    const mergedSizes = {
      ...getDefaultSizeQuantities(),
      ...(product.zopos_qty || {}),
    };
    setQtyUpdates(mergedSizes);
    setShowQtyModal(true);
  };

  const closeQtyModal = () => {
    setShowQtyModal(false);
    setSelectedProduct(null);
    setQtyUpdates({});
  };

  const updateQuantity = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("zo-products")
        .update({ zopos_qty: qtyUpdates })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      fetchProducts();
      closeQtyModal();
    } catch (error) {
      console.error("Error updating quantities:", error);
      alert("Erreur lors de la mise à jour des quantités");
    }
  };

  const handleQtyChange = (size: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQtyUpdates((prev) => ({
      ...prev,
      [size]: numValue,
    }));
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
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0F172A]">
                Produits
              </h1>
              <p className="text-sm text-[#0F172A]/60">
                {products.length} produit{products.length !== 1 ? "s" : ""} •
                Stock Zo POS
              </p>
            </div>
            <button
              onClick={() => router.push("/products/add")}
              className="flex items-center gap-2 px-6 py-3 bg-[#3B82F6] text-white rounded-[24px] 
                       hover:bg-[#2563EB] transition-all duration-200 font-medium shadow-lg shadow-[#3B82F6]/25"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouveau Produit
            </button>
          </div>
        </div>

        {/* Main Content */}
        {products.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-xl p-12 border border-white/20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-[#3B82F6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-[#3B82F6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#0F172A] mb-2">
                Aucun produit
              </h2>
              <p className="text-[#0F172A]/60 mb-6">
                Commencez par ajouter votre premier produit à votre catalogue.
              </p>
              <button
                onClick={() => router.push("/products/add")}
                className="px-6 py-3 bg-[#3B82F6] text-white rounded-[24px] hover:bg-[#2563EB] 
                         transition-all duration-200 font-medium"
              >
                Ajouter un produit
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg border border-white/20 
                         overflow-hidden hover:shadow-xl transition-all duration-200"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gradient-to-br from-[#E0F2FE] to-[#F0F9FF] relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-16 h-16 text-[#3B82F6]/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? "bg-green-500/90 text-white"
                          : "bg-gray-500/90 text-white"
                      }`}
                    >
                      {product.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold text-[#0F172A] mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#0F172A]/60 mb-3 line-clamp-2">
                    {product.description || "Aucune description"}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-[#3B82F6]">
                      {product.price.toFixed(2)} €
                    </span>
                    <span className="text-sm text-[#0F172A]/40">•</span>
                    <span className="text-sm text-[#0F172A]/60">
                      Stock:{" "}
                      {Object.values(product.zopos_qty || {}).reduce(
                        (a, b) => a + b,
                        0,
                      )}
                    </span>
                  </div>

                  {/* Sizes and Stock Breakdown */}
                  {product.zopos_qty &&
                    Object.keys(product.zopos_qty).length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-[#0F172A]/50 mb-1">
                          Tailles (Stock Zo POS):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(product.zopos_qty).map(
                            ([size, qty]) => (
                              <span
                                key={size}
                                className="px-2 py-1 bg-[#F0F9FF] text-[#3B82F6] rounded-lg text-xs font-medium"
                              >
                                {size}: {qty}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-[#F0F9FF] text-[#3B82F6] rounded-full text-xs font-medium">
                      {product.category}
                    </span>
                    {product.sustainability_rating && (
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                        {product.sustainability_rating}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openQtyModal(product)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-[16px] 
                               hover:bg-emerald-600 transition-all duration-200 text-sm font-medium"
                      title="Mise à jour rapide des quantités"
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/products/edit/${product.id}`)
                      }
                      className="px-4 py-2 bg-[#3B82F6] text-white rounded-[16px] 
                               hover:bg-[#2563EB] transition-all duration-200 text-sm font-medium"
                      title="Modifier le produit"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-[16px] 
                               hover:bg-red-600 transition-all duration-200 text-sm font-medium"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Quantity Update Modal */}
      {showQtyModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-2xl border border-white/20 max-w-md w-full">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#0F172A]/10">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#0F172A]">
                  Mise à jour rapide
                </h3>
                <button
                  onClick={closeQtyModal}
                  className="text-[#0F172A]/40 hover:text-[#0F172A] transition-colors"
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
              <p className="text-xs text-[#0F172A]/60 mt-0.5">
                {selectedProduct.name}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-[12px] p-2.5 mb-3">
                <p className="text-xs text-blue-800">
                  💡 Modifiez rapidement les quantités pour chaque taille
                </p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.keys(qtyUpdates).length > 0 ? (
                  Object.entries(qtyUpdates).map(([size, qty]) => (
                    <div
                      key={size}
                      className="flex items-center gap-2 p-2 bg-[#F0F9FF] rounded-[12px]"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-white rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-[#3B82F6]">
                          {size}
                        </span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) =>
                            handleQtyChange(size, e.target.value)
                          }
                          min="0"
                          placeholder="Quantité"
                          className="w-full px-3 py-1.5 text-sm bg-white border border-[#3B82F6]/20 rounded-[10px] 
                                   focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#0F172A]/40">
                    <p>Aucune taille disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#0F172A]/10 flex gap-2">
              <button
                onClick={closeQtyModal}
                className="flex-1 px-4 py-2 text-sm bg-gray-200 text-[#0F172A] rounded-[12px] 
                         hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={updateQuantity}
                className="flex-1 px-4 py-2 text-sm bg-[#3B82F6] text-white rounded-[12px] 
                         hover:bg-[#2563EB] transition-all duration-200 font-medium shadow-lg shadow-[#3B82F6]/25"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
