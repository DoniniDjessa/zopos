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
// Format price as 25k, 26.5k, etc.
const formatPrice = (price: number): string => {
  if (price >= 1000) {
    const kPrice = price / 1000;
    return kPrice % 1 === 0 ? `${kPrice}k` : `${kPrice.toFixed(1)}k`;
  }
  return price.toString();
};
interface Product {
  id: string;
  title?: string; // Database field
  name: string; // Display name (for compatibility)
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    searchQuery
      ? (product.title || product.name)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

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

  // Helper function to generate short code from productId + size
  const generateShortCode = (productId: string, size: string): string => {
    // Use a more robust hash by including size multiple times for better differentiation
    const combined = `${productId}:SIZE:${size}:${size.length}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Add size-specific offset to ensure different codes
    const sizeOffset = size
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    hash = hash + sizeOffset * 1000;
    return Math.abs(hash).toString().substring(0, 6).padStart(4, "0");
  };

  const downloadBarcode = (product: Product) => {
    // Get all sizes with quantity > 0
    const sizesWithQty = Object.entries(product.zopos_qty || {})
      .filter(([_, qty]) => qty > 0)
      .map(([size]) => size);

    if (sizesWithQty.length === 0) {
      alert("Aucune taille en stock pour générer des codes-barres");
      return;
    }

    // Generate and download a barcode for each size
    sizesWithQty.forEach((size, index) => {
      setTimeout(() => {
        const shortCode = generateShortCode(product.id, size);

        // Create a canvas to draw the barcode
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        canvas.width = 400;
        canvas.height = 180;

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate proper barcode pattern with many bars
        const startX = 10;
        const startY = 20;
        const barHeight = 100;

        // Create barcode pattern: use each digit to generate multiple bars
        const barPattern: number[] = [];

        // Start guard (narrow-wide-narrow)
        barPattern.push(2, 1, 2);

        // For each digit in the code, create a unique bar pattern
        for (let i = 0; i < shortCode.length; i++) {
          const digit = parseInt(shortCode[i]);
          // Create different patterns for each digit (0-9)
          // Each digit creates 7 bars with varying widths (1-3 units)
          const patterns = [
            [3, 2, 1, 1, 2, 1, 3], // 0
            [2, 2, 2, 1, 1, 2, 2], // 1
            [2, 1, 2, 2, 1, 2, 2], // 2
            [1, 4, 1, 1, 2, 1, 2], // 3
            [3, 1, 1, 2, 2, 1, 2], // 4
            [1, 3, 1, 2, 2, 1, 2], // 5
            [1, 1, 3, 2, 1, 2, 2], // 6
            [1, 2, 1, 1, 3, 2, 2], // 7
            [1, 1, 2, 3, 1, 2, 2], // 8
            [3, 1, 1, 1, 2, 2, 2], // 9
          ];
          barPattern.push(...patterns[digit]);
          // Add separator
          barPattern.push(1);
        }

        // End guard (narrow-wide-narrow)
        barPattern.push(2, 1, 2);

        // Calculate total width needed for barcode
        const totalBars = barPattern.reduce((sum, width) => sum + width, 0);
        const availableWidth = canvas.width - 2 * startX;
        const baseWidth = availableWidth / totalBars;

        // Draw the bars
        ctx.fillStyle = "black";
        let currentX = startX;

        barPattern.forEach((width, idx) => {
          // Alternate between black and white bars
          if (idx % 2 === 0) {
            ctx.fillRect(currentX, startY, width * baseWidth, barHeight);
          }
          currentX += width * baseWidth;
        });

        // Add short code text below barcode
        ctx.fillStyle = "black";
        ctx.font = "20px monospace";
        ctx.textAlign = "center";
        ctx.fillText(shortCode, canvas.width / 2, startY + barHeight + 25);

        // Add product name and size
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "black";
        ctx.fillText(
          `${product.title || product.name || "Product"} - Taille ${size}`,
          canvas.width / 2,
          startY + barHeight + 50,
        );

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const productName = (
            product.title ||
            product.name ||
            "product"
          ).replace(/\s+/g, "-");
          a.download = `barcode-${productName}-${size}-${shortCode}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }, index * 100); // Stagger downloads by 100ms
    });

    alert(
      `Téléchargement de ${sizesWithQty.length} code(s)-barres pour les tailles: ${sizesWithQty.join(", ")}`,
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Zo POS"
            className="h-16 w-16 mx-auto mb-4 animate-pulse"
          />
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
                {filteredProducts.length} produit
                {filteredProducts.length !== 1 ? "s" : ""} • Stock Zo POS
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

        {/* Search Filter */}
        <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-4 border border-white/20 mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, catégorie ou code..."
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-[16px] 
                       focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
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
            )}
          </div>
        </div>

        {/* Main Content */}
        {filteredProducts.length === 0 && searchQuery ? (
          <div className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-xl p-12 border border-white/20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#0F172A] mb-2">
                Aucun résultat
              </h2>
              <p className="text-[#0F172A]/60 mb-6">
                Aucun produit ne correspond à votre recherche &quot;
                {searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-3 bg-[#3B82F6] text-white rounded-[24px] hover:bg-[#2563EB] 
                         transition-all duration-200 font-medium"
              >
                Effacer la recherche
              </button>
            </div>
          </div>
        ) : products.length === 0 ? (
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
            {filteredProducts.map((product) => (
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
                      alt={product.title || product.name}
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

                  {/* Barcode Download Button */}
                  <button
                    onClick={() => downloadBarcode(product)}
                    className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-[12px] 
                             hover:bg-white transition-all duration-200 shadow-md"
                    title="Télécharger les codes-barres (par taille)"
                  >
                    <svg
                      className="w-4 h-4 text-[#0F172A]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </button>

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
                    {product.title || product.name}
                  </h3>
                  <p className="text-sm text-[#0F172A]/60 mb-3 line-clamp-2">
                    {product.description || "Aucune description"}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-[#3B82F6]">
                      {formatPrice(product.price)}
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
                        <p className="text-[10px] text-[#0F172A]/40 mb-0.5">
                          Tailles:
                        </p>
                        <div className="flex flex-wrap gap-0.5">
                          {Object.entries(product.zopos_qty).map(
                            ([size, qty]) => (
                              <span
                                key={size}
                                className="px-1 py-0.5 bg-[#F0F9FF] text-[#3B82F6] rounded text-[9px] font-medium"
                              >
                                {size}:{qty}
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
                        className="w-4 h-4"
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
                        className="w-4 h-4"
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
                        className="w-4 h-4"
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
                {selectedProduct.title || selectedProduct.name}
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
