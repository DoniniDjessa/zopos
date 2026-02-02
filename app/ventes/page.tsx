"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";

// Format price as 25k, 26.5k, etc.
const formatPrice = (price: number): string => {
  if (price >= 1000) {
    const kPrice = price / 1000;
    return kPrice % 1 === 0 ? `${kPrice}k` : `${kPrice.toFixed(1)}k`;
  }
  return price.toString();
};

interface SaleItem {
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  items_count: number;
  items: SaleItem[];
  created_at: string;
}

export default function VentesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Summary stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [averageTransaction, setAverageTransaction] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSales();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("zopos_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const salesData = data || [];
      setSales(salesData);

      // Calculate summary stats
      const revenue = salesData.reduce(
        (sum, sale) => sum + sale.total_amount,
        0,
      );
      const items = salesData.reduce((sum, sale) => sum + sale.items_count, 0);
      const avgTransaction =
        salesData.length > 0 ? revenue / salesData.length : 0;

      setTotalRevenue(revenue);
      setTotalTransactions(salesData.length);
      setTotalItems(items);
      setAverageTransaction(avgTransaction);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSale(null);
  };

  // Filter sales based on search and date range
  const filteredSales = sales.filter((sale) => {
    // Search filter (product name or code)
    const matchesSearch = searchQuery
      ? sale.items.some(
          (item) =>
            item.product_name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.product_id.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || sale.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Date range filter
    const saleDate = new Date(sale.created_at);
    const matchesStartDate = startDate ? saleDate >= new Date(startDate) : true;
    const matchesEndDate = endDate
      ? saleDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : true;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-[#0F172A]">
            Ventes
          </h1>
          <p className="text-[#0F172A]/60 mt-1">
            Historique des transactions POS
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-4 border border-white/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/60 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom de produit ou code..."
                  className="w-full px-4 py-2 pl-10 bg-white border border-gray-200 rounded-[12px] 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
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
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/60 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-[12px] 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-[#0F172A]/60 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-[12px] 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
              }}
              className="mt-3 text-xs text-[#3B82F6] hover:text-[#2563EB] font-medium"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-[12px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#3B82F6]"
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
              <div>
                <p className="text-xs text-[#0F172A]/60">Revenu Total</p>
                <p className="font-serif text-xl font-bold text-[#0F172A]">
                  {formatPrice(totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-[12px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
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
              <div>
                <p className="text-xs text-[#0F172A]/60">Transactions</p>
                <p className="font-serif text-xl font-bold text-[#0F172A]">
                  {totalTransactions}
                </p>
              </div>
            </div>
          </div>

          {/* Total Items Sold */}
          <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-[12px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
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
              <div>
                <p className="text-xs text-[#0F172A]/60">Articles Vendus</p>
                <p className="font-serif text-xl font-bold text-[#0F172A]">
                  {totalItems}
                </p>
              </div>
            </div>
          </div>

          {/* Average Transaction */}
          <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-[12px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#0F172A]/60">Panier Moyen</p>
                <p className="font-serif text-xl font-bold text-[#0F172A]">
                  {formatPrice(averageTransaction)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
          <h2 className="font-serif text-xl font-bold text-[#0F172A] mb-4">
            Historique des Ventes
          </h2>

          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-[#0F172A]/20"
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
              <p className="text-[#0F172A]/60">
                {searchQuery || startDate || endDate
                  ? "Aucune vente ne correspond à vos critères"
                  : "Aucune vente enregistrée"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => openDetailsModal(sale)}
                  className="flex items-center justify-between p-4 bg-[#F0F9FF] rounded-[16px] 
                           hover:bg-[#E0F2FE] transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-[#0F172A]">
                        Vente #{sale.id.substring(0, 8)}
                      </p>
                      <span className="text-xs text-[#0F172A]/60">
                        {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[#0F172A]/60">
                      {sale.items_count} article
                      {sale.items_count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl font-bold text-[#3B82F6]">
                      {formatPrice(sale.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
                  Détails de la Vente
                </h3>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-[#F0F9FF] rounded-[12px] transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-[#0F172A]"
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

              {/* Sale Info */}
              <div className="mb-6 p-4 bg-[#F0F9FF] rounded-[16px]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#0F172A]/60 mb-1">ID Vente</p>
                    <p className="font-medium text-[#0F172A]">
                      #{selectedSale.id.substring(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#0F172A]/60 mb-1">Date</p>
                    <p className="font-medium text-[#0F172A]">
                      {new Date(selectedSale.created_at).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h4 className="font-medium text-[#0F172A] mb-3">Articles</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#F0F9FF] rounded-[12px]"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[#0F172A]">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-[#0F172A]/60">
                          Taille: {item.size} • Qté: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#0F172A]">
                          {formatPrice(item.total_price)}
                        </p>
                        <p className="text-xs text-[#0F172A]/60">
                          {formatPrice(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-[#0F172A]/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-serif text-lg font-bold text-[#0F172A]">
                    Total
                  </span>
                  <span className="font-serif text-2xl font-bold text-[#3B82F6]">
                    {formatPrice(selectedSale.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
