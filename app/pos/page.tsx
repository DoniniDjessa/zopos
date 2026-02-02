"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  title?: string;
  price: number;
  zopos_qty: Record<string, number>;
  image_url: string;
}

interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export default function POSPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Auto-focus on barcode input
    inputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      // Get all products and find by short code (productId + size)
      const { data: allProducts, error: fetchError } = await supabase
        .from("zo-products")
        .select("*");

      if (fetchError) throw fetchError;

      // Generate short code for each product size combination and find match
      let foundProduct = null;
      let foundSize = "";

      for (const p of allProducts || []) {
        const sizes = Object.keys(p.zopos_qty || {});
        for (const size of sizes) {
          // Use the same improved hash function as in products page
          const combined = `${p.id}:SIZE:${size}:${size.length}`;
          let hash = 0;
          for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          // Add size-specific offset to ensure different codes
          const sizeOffset = size
            .split("")
            .reduce((acc, c) => acc + c.charCodeAt(0), 0);
          hash = hash + sizeOffset * 1000;
          const shortCode = Math.abs(hash)
            .toString()
            .substring(0, 6)
            .padStart(4, "0");

          // Debug: log generated codes
          console.log(
            `Product: ${p.title || p.name} (${p.id}), Size: ${size}, Code: ${shortCode}`,
          );

          if (shortCode === barcodeInput.trim()) {
            foundProduct = p;
            foundSize = size;
            break;
          }
        }
        if (foundProduct) break;
      }

      if (!foundProduct || !foundSize) {
        console.log(`Barcode scanned: "${barcodeInput.trim()}" - NOT FOUND`);
        alert(`Produit non trouvé pour le code: ${barcodeInput.trim()}`);
        setBarcodeInput("");
        return;
      }

      // Check if size is in stock
      const qtyInStock = foundProduct.zopos_qty[foundSize] || 0;
      if (qtyInStock === 0) {
        alert(`Taille ${foundSize} épuisée`);
        setBarcodeInput("");
        return;
      }

      // Auto-add to cart with scanned size
      setSelectedProduct(foundProduct);
      setSelectedSize(foundSize);
      setQuantity(1);

      // Add directly to cart
      const existingItem = cart.find(
        (item) =>
          item.product.id === foundProduct.id && item.size === foundSize,
      );

      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.product.id === foundProduct.id && item.size === foundSize
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      } else {
        setCart([
          ...cart,
          {
            product: {
              ...foundProduct,
              name: foundProduct.title || foundProduct.name,
            },
            size: foundSize,
            quantity: 1,
          },
        ]);
      }

      setBarcodeInput("");
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Erreur lors de la recherche du produit");
      setBarcodeInput("");
    }
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) return;

    const existingItem = cart.find(
      (item) =>
        item.product.id === selectedProduct.id && item.size === selectedSize,
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === selectedProduct.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        { product: selectedProduct, size: selectedSize, quantity },
      ]);
    }

    setShowSizeModal(false);
    setSelectedProduct(null);
    inputRef.current?.focus();
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(
      cart.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      const kPrice = price / 1000;
      return kPrice % 1 === 0 ? `${kPrice}k` : `${kPrice.toFixed(1)}k`;
    }
    return price.toString();
  };

  const clearCart = () => {
    if (confirm("Vider le panier ?")) {
      setCart([]);
    }
  };

  const processPayment = async () => {
    if (cart.length === 0) return;

    if (confirm(`Confirmer la vente de ${formatPrice(getTotalPrice())} ?`)) {
      try {
        // Prepare sale data
        const saleData = {
          total_amount: getTotalPrice(),
          items_count: cart.reduce((sum, item) => sum + item.quantity, 0),
          items: cart.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.title || item.product.name,
            size: item.size,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: item.product.price * item.quantity,
          })),
          sale_date: new Date().toISOString(),
        };

        // Save sale to database
        const { data: saleRecord, error: saleError } = await supabase
          .from("zopos_sales")
          .insert([saleData])
          .select()
          .single();

        if (saleError) throw saleError;

        // Update inventory for each item
        for (const item of cart) {
          const currentQty = item.product.zopos_qty[item.size] || 0;
          const newQty = currentQty - item.quantity;

          const updatedQty = {
            ...item.product.zopos_qty,
            [item.size]: Math.max(0, newQty),
          };

          const { error: updateError } = await supabase
            .from("zo-products")
            .update({ zopos_qty: updatedQty })
            .eq("id", item.product.id);

          if (updateError) throw updateError;
        }

        // Show receipt
        setReceiptData({
          id: saleRecord.id,
          items: cart.map((item) => ({
            title: item.product.title || item.product.name,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
          total: getTotalPrice(),
          created_at: new Date().toISOString(),
        });
        setShowReceipt(true);
        setCart([]);
      } catch (error) {
        console.error("Error processing payment:", error);
        alert("Erreur lors de l'enregistrement de la vente");
      }
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
      <div className="min-h-screen p-3 md:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-3">
            <h1 className="font-serif text-xl font-bold text-[#0F172A]">
              Point de Vente (POS)
            </h1>
            <p className="text-xs text-[#0F172A]/60">
              Scannez les codes-barres pour ajouter des produits
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Barcode Scanner & Products */}
            <div className="space-y-4">
              {/* Barcode Input */}
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] shadow-xl p-4 border border-white/20">
                <h2 className="font-serif text-base font-semibold text-[#0F172A] mb-3">
                  Scanner
                </h2>
                <form onSubmit={handleBarcodeSubmit}>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Code..."
                      className="flex-1 px-3 py-2 text-sm bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[12px] 
                               focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs bg-[#3B82F6] text-white rounded-[12px] 
                               hover:bg-[#2563EB] transition-all duration-200 font-medium"
                    >
                      Scanner
                    </button>
                  </div>
                </form>
              </div>

              {/* Current Cart Items */}
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] shadow-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-base font-semibold text-[#0F172A]">
                    Articles ({cart.length})
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Vider
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-6 text-[#0F172A]/40">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 text-[#3B82F6]/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-xs">Panier vide</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-[#F0F9FF] rounded-[12px]"
                      >
                        {/* Product Image */}
                        {item.product.image_url && (
                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#0F172A] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-[#0F172A]/60">
                            {item.size}
                          </p>
                          <p className="text-xs font-bold text-[#3B82F6]">
                            {formatPrice(item.product.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(index, item.quantity - 1)
                            }
                            className="w-8 h-8 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(index, item.quantity + 1)
                            }
                            className="w-8 h-8 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="ml-2 text-red-500 hover:text-red-700 transition-colors"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary & Payment */}
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] shadow-xl p-4 border border-white/20 sticky top-20">
                <h2 className="font-serif text-base font-semibold text-[#0F172A] mb-3">
                  Résumé
                </h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-[#0F172A]/60">
                    <span>Articles</span>
                    <span>{cart.length}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#0F172A]/60">
                    <span>Quantité</span>
                    <span>
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="border-t border-[#0F172A]/10 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-lg font-bold text-[#0F172A]">
                        Total
                      </span>
                      <span className="font-serif text-2xl font-bold text-[#3B82F6]">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={processPayment}
                  disabled={cart.length === 0}
                  className="w-full px-4 py-3 text-sm bg-[#3B82F6] text-white rounded-[12px] 
                           hover:bg-[#2563EB] transition-all duration-200 font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Selection Modal */}
      {showSizeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-4">
              {/* Product Image and Name */}
              <div className="mb-4">
                {selectedProduct.image_url && (
                  <div className="relative w-full h-48 mb-3 rounded-[16px] overflow-hidden">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-1">
                  {selectedProduct.name}
                </h3>
                <p className="font-serif text-lg font-bold text-[#3B82F6]">
                  {formatPrice(selectedProduct.price)}
                </p>
              </div>

              <div className="mb-3">
                <p className="text-xs text-[#0F172A]/60 mb-2">Taille:</p>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(selectedProduct.zopos_qty || {}).map(
                    ([size, qty]) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={qty === 0}
                        className={`p-3 rounded-[12px] border-2 transition-all ${
                          selectedSize === size
                            ? "border-[#3B82F6] bg-[#F0F9FF]"
                            : qty > 0
                              ? "border-[#0F172A]/10 hover:border-[#3B82F6]/50"
                              : "border-[#0F172A]/10 opacity-30 cursor-not-allowed"
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-bold text-[#0F172A]">{size}</p>
                          <p className="text-xs text-[#0F172A]/60">{qty}</p>
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-[#0F172A]/60 mb-2">Quantité:</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 bg-[#F0F9FF] rounded-[12px] hover:bg-[#E0F2FE] transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="flex-1 px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[12px] 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-center text-[#0F172A]"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 bg-[#F0F9FF] rounded-[12px] hover:bg-[#E0F2FE] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSizeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-[#0F172A] rounded-[16px] 
                           hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={addToCart}
                  disabled={!selectedSize}
                  className="flex-1 px-6 py-3 bg-[#3B82F6] text-white rounded-[16px] 
                           hover:bg-[#2563EB] transition-all duration-200 font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Receipt Content */}
            <div ref={receiptRef} className="bg-white p-8 font-mono text-black">
              {/* Header */}
              <div className="text-center pb-4 mb-4 border-b-2 border-dashed border-gray-400">
                <h1 className="text-2xl font-bold mb-2">LES ATELIERS ZO</h1>
                <p className="text-xs text-gray-600">
                  +225 07 49 235 896 | +225 05 55 486 130
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  www.lesatelierszo.com
                </p>
              </div>

              {/* Order Info */}
              <div className="text-sm mb-4 pb-4 border-b border-dashed border-gray-300">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">N° Commande:</span>
                  <span>#{receiptData.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">Date:</span>
                  <span>
                    {new Date(receiptData.created_at).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Heure:</span>
                  <span>
                    {new Date(receiptData.created_at).toLocaleTimeString(
                      "fr-FR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4 pb-4 border-b border-dashed border-gray-300">
                <h2 className="font-bold text-sm mb-3">ARTICLES</h2>
                {receiptData.items.map((item: any, index: number) => (
                  <div key={index} className="mb-3 text-xs">
                    <div className="flex justify-between font-semibold mb-1">
                      <span>{item.title}</span>
                      <span>{item.price.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="ml-2 text-gray-600">
                      Taille: {item.size}
                    </div>
                    <div className="flex justify-between ml-2 text-gray-600">
                      <span>Qté: {item.quantity}</span>
                      <span className="font-semibold">
                        {(item.price * item.quantity).toLocaleString("fr-FR")}{" "}
                        FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mb-4 pb-4 border-b-2 border-solid border-gray-800">
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL</span>
                  <span>{receiptData.total.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 mt-4">
                <p className="mb-1">Merci pour votre achat !</p>
                <p>Transaction terminée avec succès.</p>
                <div className="border-t border-dashed border-gray-300 mt-3 pt-3">
                  <p className="leading-relaxed">
                    📍 Riviera CIAD après la Pharmacie des jardins d&apos;Eden,
                    immeuble de la Société générale, Cocody Rue F44
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-[#3B82F6] text-white rounded-[16px] 
                         hover:bg-[#2563EB] transition-all duration-200 font-medium"
              >
                Imprimer
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setReceiptData(null);
                  inputRef.current?.focus();
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-[#0F172A] rounded-[16px] 
                         hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
