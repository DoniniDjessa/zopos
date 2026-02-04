"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

// Default sizes for products
const DEFAULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qtyUpdates, setQtyUpdates] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsTab, setDetailsTab] = useState<"product" | "sales">("product");
  const [productSales, setProductSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<
    "day" | "week" | "month" | "year" | "all"
  >("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmStyle?: "danger" | "warning" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

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
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le produit",
      message: "Êtes-vous sûr de vouloir supprimer ce produit ?",
      confirmStyle: "danger",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("zo-products")
            .delete()
            .eq("id", id);

          if (error) throw error;
          toast.success("Produit supprimé avec succès");
          fetchProducts();
        } catch (error) {
          console.error("Error deleting product:", error);
          toast.error("Erreur lors de la suppression du produit");
        }
      },
    });
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

  const openDetailsModal = async (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
    setDetailsTab("product");

    // Fetch sales for this product
    setLoadingSales(true);
    try {
      const { data, error } = await supabase
        .from("zopos_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Extract items for this product from all sales
      const productSalesItems: any[] = [];
      (data || []).forEach((sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach((item: any) => {
            if (item.product_id === product.id) {
              productSalesItems.push({
                ...item,
                created_at: sale.created_at,
                sale_id: sale.id,
                user_id: sale.user_id,
                price: item.unit_price,
                quantity: item.quantity,
                size: item.size,
              });
            }
          });
        }
      });

      setProductSales(productSalesItems);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setProductSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
    setProductSales([]);
    setDetailsTab("product");
  };

  const updateQuantity = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("zo-products")
        .update({ zopos_qty: qtyUpdates })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast.success("Quantités mises à jour avec succès");
      fetchProducts();
      closeQtyModal();
    } catch (error) {
      console.error("Error updating quantities:", error);
      toast.error("Erreur lors de la mise à jour des quantités");
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

  // Generate stock alerts for all products
  const generateStockAlerts = () => {
    const alerts: string[] = [];

    products.forEach((product) => {
      const productName = product.title || product.name;
      const stock = product.zopos_qty || {};
      const sizes = Object.keys(stock);

      if (sizes.length === 0) return;

      const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
      const zeroSizes = sizes.filter((size) => stock[size] === 0);
      const allSizesLow = sizes.every(
        (size) => stock[size] < 3 && stock[size] > 0,
      );

      // Rupture de stock (total = 0)
      if (totalStock === 0) {
        alerts.push(`🔴 ${productName} - Rupture de stock`);
      }
      // Low stock (all sizes under 3)
      else if (allSizesLow) {
        alerts.push(`🟡 ${productName} - Stock faible`);
      }
      // Specific size out of stock
      else if (zeroSizes.length > 0) {
        const sizeList = zeroSizes.join(", ");
        alerts.push(
          `🟠 ${productName} - Rupture taille${zeroSizes.length > 1 ? "s" : ""} ${sizeList}`,
        );
      }
    });

    return alerts;
  };

  const downloadBarcode = async (product: Product) => {
    // Dynamically import JsBarcode
    const JsBarcode = (await import("jsbarcode")).default;

    // Get all registered sizes, or use default sizes if none registered
    let allSizes = Object.keys(product.zopos_qty || {});

    if (allSizes.length === 0) {
      allSizes = DEFAULT_SIZES;
      toast.info(
        "Aucune taille enregistrée, utilisation des tailles par défaut",
      );
    }

    // Generate and download a barcode for each size
    allSizes.forEach((size, index) => {
      setTimeout(() => {
        const shortCode = generateShortCode(product.id, size);

        // Create a canvas to draw the barcode
        const canvas = document.createElement("canvas");

        try {
          // Generate proper Code128 barcode using JsBarcode
          JsBarcode(canvas, shortCode, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 20,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000",
          });

          // Get canvas context to add product info
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Extend canvas height for product name and size
            const originalHeight = canvas.height;
            canvas.height = originalHeight + 60;

            // Redraw barcode on extended canvas
            JsBarcode(canvas, shortCode, {
              format: "CODE128",
              width: 2,
              height: 100,
              displayValue: true,
              fontSize: 20,
              margin: 10,
              background: "#ffffff",
              lineColor: "#000000",
            });

            // Add product name below barcode
            ctx.fillStyle = "black";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(
              product.title || product.name || "Product",
              canvas.width / 2,
              originalHeight + 20,
            );

            // Add size prominently below product name
            ctx.font = "bold 18px sans-serif";
            ctx.fillText(
              `Taille: ${size}`,
              canvas.width / 2,
              originalHeight + 45,
            );
          }

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
        } catch (error) {
          console.error("Barcode generation error:", error);
          toast.error(`Erreur lors de la génération du code-barre`);
        }
      }, index * 100); // Stagger downloads by 100ms
    });

    toast.success(
      `Téléchargement de ${allSizes.length} code(s)-barres pour les tailles: ${allSizes.join(", ")}`,
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

  // Generate stock alerts based on current products
  const stockAlerts = generateStockAlerts();

  return (
    <AppLayout>
      <div className="p-8">
        {/* Stock Alerts Ticker */}
        {stockAlerts.length > 0 && (
          <div className="mb-6 overflow-hidden bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-4 border-red-500 rounded-none">
            <div className="py-3 px-4">
              <div className="relative overflow-hidden">
                <div className="animate-marquee whitespace-nowrap inline-block">
                  {stockAlerts.map((alert, index) => (
                    <span
                      key={index}
                      className="inline-block mx-8 text-sm font-medium text-gray-800"
                    >
                      {alert}
                    </span>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {stockAlerts.map((alert, index) => (
                    <span
                      key={`dup-${index}`}
                      className="inline-block mx-8 text-sm font-medium text-gray-800"
                    >
                      {alert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
              className="flex items-center gap-2 px-6 py-1.5 bg-[#3B82F6] text-white rounded-none 
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
        <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20 mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, catégorie ou code..."
              className="w-full px-4 py-1.5 pl-12 bg-white border border-gray-200 rounded-none 
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
          <div className="bg-white/70 backdrop-blur-md rounded-none shadow-xl p-12 border border-white/20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-none flex items-center justify-center mx-auto mb-4">
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
                className="px-6 py-1.5 bg-[#3B82F6] text-white rounded-none hover:bg-[#2563EB] 
                         transition-all duration-200 font-medium"
              >
                Effacer la recherche
              </button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-none shadow-xl p-12 border border-white/20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-[#3B82F6]/10 rounded-none flex items-center justify-center mx-auto mb-4">
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
                className="px-6 py-1.5 bg-[#3B82F6] text-white rounded-none hover:bg-[#2563EB] 
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
                className="bg-white/70 backdrop-blur-md rounded-none shadow-lg border border-white/20 
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
                    className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-none 
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
                      className={`px-3 py-1 rounded-none text-xs font-medium ${
                        product.is_active
                          ? "bg-green-500/90 text-white"
                          : "bg-gray-500/90 text-white"
                      }`}
                    >
                      {product.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  {/* Stock épuisé badge */}
                  {Object.values(product.zopos_qty || {}).reduce(
                    (a, b) => a + b,
                    0,
                  ) === 0 && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="block w-full px-3 py-1.5 bg-red-500/90 text-white rounded-none text-xs font-bold text-center">
                        Stock épuisé
                      </span>
                    </div>
                  )}
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
                                className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                                  qty === 0
                                    ? "bg-red-50 text-red-600"
                                    : "bg-[#F0F9FF] text-[#3B82F6]"
                                }`}
                              >
                                {size}:{qty}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-[#F0F9FF] text-[#3B82F6] rounded-none text-xs font-medium">
                      {product.category}
                    </span>
                    {product.sustainability_rating && (
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-none text-xs font-medium">
                        {product.sustainability_rating}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetailsModal(product)}
                      className="px-4 py-1 bg-purple-500 text-white rounded-none 
                               hover:bg-purple-600 transition-all duration-200 text-sm font-medium"
                      title="Voir les détails"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openQtyModal(product)}
                      className="px-4 py-1 bg-emerald-500 text-white rounded-none 
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/products/edit/${product.id}`)
                      }
                      className="px-4 py-1 bg-[#3B82F6] text-white rounded-none 
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
                      className="px-4 py-1 bg-red-500 text-white rounded-none 
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
          <div className="bg-white/95 backdrop-blur-md rounded-none shadow-2xl border border-white/20 max-w-md w-full">
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
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-none p-2.5 mb-3">
                <p className="text-xs text-blue-800">
                  💡 Modifiez rapidement les quantités pour chaque taille
                </p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.keys(qtyUpdates).length > 0 ? (
                  Object.entries(qtyUpdates).map(([size, qty]) => (
                    <div
                      key={size}
                      className="flex items-center gap-2 p-2 bg-[#F0F9FF] rounded-none"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-white rounded-none flex items-center justify-center">
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
                          className="w-full px-3 py-1.5 text-sm bg-white border border-[#3B82F6]/20 rounded-none 
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
                className="flex-1 px-4 py-1 text-sm bg-gray-200 text-[#0F172A] rounded-none 
                         hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={updateQuantity}
                className="flex-1 px-4 py-1 text-sm bg-[#3B82F6] text-white rounded-none 
                         hover:bg-[#2563EB] transition-all duration-200 font-medium shadow-lg shadow-[#3B82F6]/25"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
                  Détails du Produit
                </h3>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-gray-100 rounded-none transition-colors"
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

              {/* Tabs */}
              <div className="flex border-b mb-6">
                <button
                  onClick={() => setDetailsTab("product")}
                  className={`px-6 py-3 font-medium transition-colors ${
                    detailsTab === "product"
                      ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                      : "text-[#0F172A]/60 hover:text-[#0F172A]"
                  }`}
                >
                  Détails Produit
                </button>
                <button
                  onClick={() => setDetailsTab("sales")}
                  className={`px-6 py-3 font-medium transition-colors ${
                    detailsTab === "sales"
                      ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                      : "text-[#0F172A]/60 hover:text-[#0F172A]"
                  }`}
                >
                  Détails des Ventes
                </button>
              </div>

              {/* Tab Content */}
              {detailsTab === "product" && (
                <div>
                  {/* Product Details with Small Image */}
                  <div className="flex gap-4 mb-6">
                    {/* Small Image */}
                    {selectedProduct.image_url && (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.title || selectedProduct.name}
                        className="w-20 h-20 object-cover rounded-none flex-shrink-0"
                      />
                    )}

                    {/* Basic Info */}
                    <div className="flex-1">
                      <h4 className="font-serif text-xl font-bold text-[#0F172A] mb-2">
                        {selectedProduct.title || selectedProduct.name}
                      </h4>
                      <p className="text-2xl font-bold text-[#3B82F6] mb-2">
                        {formatPrice(selectedProduct.price)}
                      </p>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-[#F0F9FF] text-[#3B82F6] rounded-none text-xs font-medium">
                          {selectedProduct.category}
                        </span>
                        {selectedProduct.sustainability_rating && (
                          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-none text-xs font-medium">
                            {selectedProduct.sustainability_rating}
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-none text-xs font-medium ${
                            selectedProduct.in_stock
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {selectedProduct.in_stock ? "En stock" : "Rupture"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]/60 mb-1">
                        ID Produit
                      </p>
                      <p className="text-sm text-[#0F172A]">
                        {selectedProduct.id.substring(0, 8)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]/60 mb-1">
                        Date de création
                      </p>
                      <p className="text-sm text-[#0F172A]">
                        {new Date(
                          selectedProduct.created_at,
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-[#0F172A]/60 mb-1">
                        Description
                      </p>
                      <p className="text-sm text-[#0F172A]">
                        {selectedProduct.description || "Aucune description"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]/60 mb-1">
                        Matériau
                      </p>
                      <p className="text-sm text-[#0F172A]">
                        {selectedProduct.material || "Non spécifié"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]/60 mb-1">
                        Stock Total
                      </p>
                      <p className="text-sm text-[#0F172A] font-bold">
                        {Object.values(selectedProduct.zopos_qty || {}).reduce(
                          (a, b) => a + b,
                          0,
                        )}{" "}
                        unités
                      </p>
                    </div>
                  </div>

                  {/* Stock by Size */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-[#0F172A] mb-4">
                      Stock par Taille
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedProduct.zopos_qty || {}).map(
                        ([size, qty]) => (
                          <div
                            key={size}
                            className="bg-[#F0F9FF] px-2 py-0.5 rounded-none inline-flex items-center gap-1"
                            style={{ maxHeight: "15px" }}
                          >
                            <span className="text-[9px] text-[#0F172A]/60">
                              {size}:
                            </span>
                            <span className="text-[9px] font-bold text-[#3B82F6]">
                              {qty}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                    {(!selectedProduct.zopos_qty ||
                      Object.keys(selectedProduct.zopos_qty).length === 0) && (
                      <p className="text-center text-[#0F172A]/40 py-4">
                        Aucune taille en stock
                      </p>
                    )}
                  </div>

                  {/* Colors if available */}
                  {selectedProduct.colors &&
                    selectedProduct.colors.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <h4 className="font-semibold text-[#0F172A] mb-4">
                          Couleurs disponibles
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {selectedProduct.colors.map((color, index) => {
                            // Convert hex codes to color names if needed
                            const colorName = color.startsWith("#")
                              ? color.substring(1).toUpperCase()
                              : color;
                            return (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-[#0F172A] rounded-none text-xs"
                              >
                                {colorName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Sales Details Tab */}
              {detailsTab === "sales" && (
                <div>
                  {loadingSales ? (
                    <div className="text-center py-12">
                      <p className="text-[#0F172A]/60">Chargement...</p>
                    </div>
                  ) : (
                    <div>
                      {/* Period Filter */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                          Période
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: "day", label: "Aujourd'hui" },
                            { value: "week", label: "Cette semaine" },
                            { value: "month", label: "Ce mois" },
                            { value: "year", label: "Cette année" },
                            { value: "all", label: "Tout" },
                          ].map((period) => (
                            <button
                              key={period.value}
                              onClick={() =>
                                setSalesPeriod(period.value as any)
                              }
                              className={`px-4 py-1.5 rounded-none text-sm font-medium transition-colors ${
                                salesPeriod === period.value
                                  ? "bg-[#3B82F6] text-white"
                                  : "bg-gray-100 text-[#0F172A] hover:bg-gray-200"
                              }`}
                            >
                              {period.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(() => {
                        // Filter sales by period
                        const now = new Date();
                        const filteredSales = productSales.filter((sale) => {
                          const saleDate = new Date(sale.created_at);
                          switch (salesPeriod) {
                            case "day":
                              return (
                                saleDate.toDateString() === now.toDateString()
                              );
                            case "week":
                              const weekAgo = new Date(now);
                              weekAgo.setDate(now.getDate() - 7);
                              return saleDate >= weekAgo;
                            case "month":
                              return (
                                saleDate.getMonth() === now.getMonth() &&
                                saleDate.getFullYear() === now.getFullYear()
                              );
                            case "year":
                              return (
                                saleDate.getFullYear() === now.getFullYear()
                              );
                            case "all":
                            default:
                              return true;
                          }
                        });

                        const totalQuantity = filteredSales.reduce(
                          (sum, sale) => sum + (sale.quantity || 0),
                          0,
                        );
                        const totalRevenue = filteredSales.reduce(
                          (sum, sale) =>
                            sum + (sale.price || 0) * (sale.quantity || 0),
                          0,
                        );
                        const avgPrice =
                          filteredSales.length > 0
                            ? totalRevenue / totalQuantity
                            : 0;

                        // Find last sale
                        const lastSale =
                          filteredSales.length > 0
                            ? filteredSales.sort(
                                (a, b) =>
                                  new Date(b.created_at).getTime() -
                                  new Date(a.created_at).getTime(),
                              )[0]
                            : null;

                        // Best selling size
                        const sizeStats: Record<string, number> = {};
                        filteredSales.forEach((sale) => {
                          const size = sale.size || "N/A";
                          sizeStats[size] =
                            (sizeStats[size] || 0) + (sale.quantity || 0);
                        });
                        const bestSize = Object.entries(sizeStats).sort(
                          ([, a], [, b]) => b - a,
                        )[0];

                        return filteredSales.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-[#0F172A]/60">
                              Aucune vente pour cette période
                            </p>
                          </div>
                        ) : (
                          <div>
                            {/* Main Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-[#F0F9FF] p-4 rounded-none">
                                <p className="text-xs text-[#0F172A]/60 mb-1">
                                  Nbr de Ventes
                                </p>
                                <p className="text-2xl font-bold text-[#3B82F6]">
                                  {filteredSales.length}
                                </p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-none">
                                <p className="text-xs text-[#0F172A]/60 mb-1">
                                  Articles Vendus
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                  {totalQuantity}
                                </p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-none">
                                <p className="text-xs text-[#0F172A]/60 mb-1">
                                  Revenu Généré
                                </p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {formatPrice(totalRevenue)}
                                </p>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-none">
                                <p className="text-xs text-[#0F172A]/60 mb-1">
                                  Prix Moyen
                                </p>
                                <p className="text-2xl font-bold text-orange-600">
                                  {formatPrice(avgPrice)}
                                </p>
                              </div>
                            </div>

                            {/* Additional Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Last Sale */}
                              <div className="border rounded-none p-4">
                                <h5 className="text-sm font-semibold text-[#0F172A] mb-3">
                                  Dernière Vente
                                </h5>
                                {lastSale ? (
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-[#0F172A]/60">
                                        Date:
                                      </span>
                                      <span className="text-xs font-medium">
                                        {new Date(
                                          lastSale.created_at,
                                        ).toLocaleDateString("fr-FR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-[#0F172A]/60">
                                        Taille:
                                      </span>
                                      <span className="px-2 py-0.5 bg-[#F0F9FF] text-[#3B82F6] rounded-none text-xs">
                                        {lastSale.size || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-[#0F172A]/60">
                                        Quantité:
                                      </span>
                                      <span className="text-xs font-bold">
                                        {lastSale.quantity}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-[#0F172A]/60">
                                        Montant:
                                      </span>
                                      <span className="text-xs font-bold text-[#3B82F6]">
                                        {formatPrice(
                                          lastSale.price * lastSale.quantity,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#0F172A]/40">
                                    N/A
                                  </p>
                                )}
                              </div>

                              {/* Best Selling Size */}
                              <div className="border rounded-none p-4">
                                <h5 className="text-sm font-semibold text-[#0F172A] mb-3">
                                  Taille la Plus Vendue
                                </h5>
                                {bestSize ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="px-3 py-1 bg-[#F0F9FF] text-[#3B82F6] rounded-none text-lg font-bold">
                                        {bestSize[0]}
                                      </span>
                                      <span className="text-2xl font-bold text-[#3B82F6]">
                                        {bestSize[1]} unités
                                      </span>
                                    </div>
                                    <div className="mt-3">
                                      <p className="text-xs text-[#0F172A]/60 mb-2">
                                        Répartition par taille:
                                      </p>
                                      <div className="space-y-1">
                                        {Object.entries(sizeStats)
                                          .sort(([, a], [, b]) => b - a)
                                          .map(([size, qty]) => (
                                            <div
                                              key={size}
                                              className="flex justify-between items-center"
                                            >
                                              <span className="text-xs text-[#0F172A]/60">
                                                {size}:
                                              </span>
                                              <span className="text-xs font-medium">
                                                {qty} unités
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#0F172A]/40">
                                    N/A
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={closeDetailsModal}
                className="flex-1 px-4 py-1.5 bg-gray-200 text-[#0F172A] rounded-none 
                         hover:bg-gray-300 transition-colors font-medium"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  closeDetailsModal();
                  router.push(`/products/edit/${selectedProduct.id}`);
                }}
                className="flex-1 px-4 py-1.5 bg-[#3B82F6] text-white rounded-none 
                         hover:bg-[#2563EB] transition-colors font-medium"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmStyle={confirmDialog.confirmStyle}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </AppLayout>
  );
}
