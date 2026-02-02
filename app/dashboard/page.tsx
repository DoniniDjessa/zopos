"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase/client";

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
  zopos_qty: Record<string, number>;
}

interface Sale {
  id: string;
  total_amount: number;
  items_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Stats
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from("zo-products")
        .select("id, zopos_qty");

      if (productsError) throw productsError;

      // Calculate product stats
      const productsData = products || [];
      setTotalProducts(productsData.length);

      let stockCount = 0;
      let lowStock = 0;

      productsData.forEach((product: Product) => {
        const quantities = Object.values(product.zopos_qty || {});
        const productStock = quantities.reduce((sum, qty) => sum + qty, 0);
        stockCount += productStock;

        // Low stock if total quantity is less than 5
        if (productStock > 0 && productStock < 5) {
          lowStock++;
        }
      });

      setTotalStock(stockCount);
      setLowStockItems(lowStock);

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from("zopos_sales")
        .select("*");

      if (salesError) throw salesError;

      const salesData = sales || [];
      setTotalSales(salesData.length);

      const revenue = salesData.reduce(
        (sum: number, sale: Sale) => sum + sale.total_amount,
        0,
      );
      setTotalRevenue(revenue);

      // Today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySalesData = salesData.filter((sale: Sale) => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= today;
      });

      setTodaySales(todaySalesData.length);
      const todayRev = todaySalesData.reduce(
        (sum: number, sale: Sale) => sum + sale.total_amount,
        0,
      );
      setTodayRevenue(todayRev);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* App Info Header */}
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-[24px] shadow-xl p-8 border border-white/20 mb-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/logo.png"
              alt="Zo POS"
              className="h-16 w-16 bg-white rounded-[16px] p-2"
            />
            <div>
              <h1 className="font-serif text-3xl font-bold">Zo POS</h1>
              <p className="text-white/80 text-sm">
                Système de Point de Vente - Les Ateliers ZO
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-4">
              <p className="text-white/70 text-xs mb-1">Version</p>
              <p className="font-semibold text-lg">1.0.0</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-4">
              <p className="text-white/70 text-xs mb-1">Type</p>
              <p className="font-semibold text-lg">Point de Vente</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-4">
              <p className="text-white/70 text-xs mb-1">Statut</p>
              <p className="font-semibold text-lg">✓ Actif</p>
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#0F172A] mb-4">
            Aujourd&apos;hui
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#0F172A]/60 mb-1">
                    Ventes du jour
                  </p>
                  <p className="font-serif text-3xl font-bold text-[#0F172A]">
                    {todaySales}
                  </p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-[16px]">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#0F172A]/60 mb-1">
                    Revenu du jour
                  </p>
                  <p className="font-serif text-3xl font-bold text-[#0F172A]">
                    {formatPrice(todayRevenue)}
                  </p>
                </div>
                <div className="p-4 bg-[#3B82F6]/10 rounded-[16px]">
                  <svg
                    className="w-8 h-8 text-[#3B82F6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#0F172A] mb-4">
            Vue d&apos;ensemble
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Products */}
            <Link href="/products">
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-[16px]">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                </div>
                <p className="text-sm text-[#0F172A]/60 mb-1">Total Produits</p>
                <p className="font-serif text-2xl font-bold text-[#0F172A]">
                  {totalProducts}
                </p>
              </div>
            </Link>

            {/* Total Stock */}
            <Link href="/products">
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-[16px]">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-[#0F172A]/60 mb-1">Stock Total</p>
                <p className="font-serif text-2xl font-bold text-[#0F172A]">
                  {totalStock}
                </p>
              </div>
            </Link>

            {/* Low Stock Items */}
            <Link href="/products">
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/10 rounded-[16px]">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-[#0F172A]/60 mb-1">Stock Faible</p>
                <p className="font-serif text-2xl font-bold text-[#0F172A]">
                  {lowStockItems}
                </p>
              </div>
            </Link>

            {/* Total Sales */}
            <Link href="/ventes">
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-[16px]">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-[#0F172A]/60 mb-1">Total Ventes</p>
                <p className="font-serif text-2xl font-bold text-[#0F172A]">
                  {totalSales}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/ventes">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[24px] p-8 text-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenu Total</h3>
                <svg
                  className="w-8 h-8 text-white/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="font-serif text-4xl font-bold">
                {formatPrice(totalRevenue)}
              </p>
              <p className="text-white/70 text-sm mt-2">
                {totalSales} transaction{totalSales !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>

          <Link href="/pos">
            <div className="bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-[24px] p-8 text-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Point de Vente</h3>
                <svg
                  className="w-8 h-8 text-white/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <p className="font-serif text-2xl font-bold mb-2">
                Nouvelle Vente
              </p>
              <p className="text-white/70 text-sm">
                Scanner un code-barre pour commencer
              </p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
