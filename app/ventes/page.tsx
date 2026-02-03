"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";

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
  user_id?: string;
  seller_name?: string;
  deleted?: boolean;
}

// Analytics Component
function SommaireAnalytics({ sales }: { sales: Sale[] }) {
  const [analyticsStartDate, setAnalyticsStartDate] = useState("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState("");
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("day");

  // Filter sales by analytics date range
  const filteredAnalyticsSales = sales.filter((sale) => {
    const saleDate = new Date(sale.created_at);
    const matchesStartDate = analyticsStartDate
      ? saleDate >= new Date(analyticsStartDate)
      : true;
    const matchesEndDate = analyticsEndDate
      ? saleDate <=
        new Date(new Date(analyticsEndDate).setHours(23, 59, 59, 999))
      : true;
    return matchesStartDate && matchesEndDate;
  });

  // Calculate most sold products
  const productSales = filteredAnalyticsSales.reduce(
    (acc, sale) => {
      sale.items.forEach((item) => {
        const key = `${item.product_name}-${item.size}`;
        if (!acc[key]) {
          acc[key] = {
            name: item.product_name,
            size: item.size,
            quantity: 0,
            revenue: 0,
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.total_price;
      });
      return acc;
    },
    {} as Record<
      string,
      { name: string; size: string; quantity: number; revenue: number }
    >,
  );

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate period performance
  const getPeriodKey = (date: Date) => {
    if (periodType === "day") {
      return date.toLocaleDateString("fr-FR");
    } else if (periodType === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `Semaine du ${weekStart.toLocaleDateString("fr-FR")}`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    }
  };

  const periodSales = filteredAnalyticsSales.reduce(
    (acc, sale) => {
      const key = getPeriodKey(new Date(sale.created_at));
      if (!acc[key]) {
        acc[key] = { revenue: 0, transactions: 0 };
      }
      acc[key].revenue += sale.total_amount;
      acc[key].transactions += 1;
      return acc;
    },
    {} as Record<string, { revenue: number; transactions: number }>,
  );

  const sortedPeriods = Object.entries(periodSales).sort(
    (a, b) => b[1].revenue - a[1].revenue,
  );

  const bestPeriods = sortedPeriods.slice(0, 5);
  const worstPeriods = sortedPeriods.slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Analytics Date Range Filter */}
      <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
        <h3 className="font-medium text-[#0F172A] mb-4">Période d'analyse</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#0F172A]/60 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={analyticsStartDate}
              onChange={(e) => setAnalyticsStartDate(e.target.value)}
              className="w-full px-4 py-1 bg-white border border-gray-200 rounded-none 
                       focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0F172A]/60 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={analyticsEndDate}
              onChange={(e) => setAnalyticsEndDate(e.target.value)}
              className="w-full px-4 py-1 bg-white border border-gray-200 rounded-none 
                       focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0F172A]/60 mb-2">
              Type de période
            </label>
            <select
              value={periodType}
              onChange={(e) =>
                setPeriodType(e.target.value as "day" | "week" | "month")
              }
              className="w-full px-4 py-1 bg-white border border-gray-200 rounded-none 
                       focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20">
        <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-4">
          Produits les Plus Vendus
        </h3>
        {topProducts.length === 0 ? (
          <p className="text-[#0F172A]/60 text-center py-8">
            Aucune donnée disponible pour cette période
          </p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-[#F0F9FF] rounded-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#3B82F6] text-white rounded-none flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A]">
                      {product.name} - {product.size}
                    </p>
                    <p className="text-xs text-[#0F172A]/60">
                      {product.quantity} unités vendues
                    </p>
                  </div>
                </div>
                <p className="font-serif text-lg font-bold text-[#3B82F6]">
                  {formatPrice(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Performing Periods */}
      <div className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20">
        <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-4">
          Meilleures Périodes
        </h3>
        {bestPeriods.length === 0 ? (
          <p className="text-[#0F172A]/60 text-center py-8">
            Aucune donnée disponible
          </p>
        ) : (
          <div className="space-y-3">
            {bestPeriods.map(([period, data], index) => (
              <div
                key={period}
                className="flex items-center justify-between p-4 bg-green-50 rounded-none"
              >
                <div>
                  <p className="font-medium text-[#0F172A]">{period}</p>
                  <p className="text-xs text-[#0F172A]/60">
                    {data.transactions} transaction
                    {data.transactions > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="font-serif text-lg font-bold text-green-600">
                  {formatPrice(data.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worst Performing Periods */}
      <div className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20">
        <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-4">
          Périodes à Améliorer
        </h3>
        {worstPeriods.length === 0 ? (
          <p className="text-[#0F172A]/60 text-center py-8">
            Aucune donnée disponible
          </p>
        ) : (
          <div className="space-y-3">
            {worstPeriods.map(([period, data], index) => (
              <div
                key={period}
                className="flex items-center justify-between p-4 bg-orange-50 rounded-none"
              >
                <div>
                  <p className="font-medium text-[#0F172A]">{period}</p>
                  <p className="text-xs text-[#0F172A]/60">
                    {data.transactions} transaction
                    {data.transactions > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="font-serif text-lg font-bold text-orange-600">
                  {formatPrice(data.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState("ventes"); // 'ventes' or 'sommaire'
  const [isAdmin, setIsAdmin] = useState(false);

  // Summary stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [averageTransaction, setAverageTransaction] = useState(0);
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
      fetchSales();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("zop-users")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = data?.role;
    setIsAdmin(userRole === "super_admin" || userRole === "admin");
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("zopos_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const salesData = data || [];

      // Fetch user names for each sale
      const salesWithUsers = await Promise.all(
        salesData.map(async (sale) => {
          if (sale.user_id) {
            const { data: userData } = await supabase
              .from("zop-users")
              .select("first_name, last_name")
              .eq("id", sale.user_id)
              .single();

            return {
              ...sale,
              seller_name: userData
                ? `${userData.first_name} ${userData.last_name}`
                : "Inconnu",
            };
          }
          return { ...sale, seller_name: "Inconnu" };
        }),
      );

      setSales(salesWithUsers);

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

  const softDeleteSale = async (saleId: string) => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent supprimer des ventes");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Masquer la vente",
      message:
        "Supprimer cette vente sans affecter les statistiques ?\nLa vente sera marquée comme supprimée mais restera dans les totaux.",
      confirmStyle: "warning",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("zopos_sales")
            .update({ deleted: true })
            .eq("id", saleId);

          if (error) throw error;

          toast.success("Vente masquée avec succès");
          fetchSales();
          closeDetailsModal();
        } catch (error) {
          console.error("Error soft deleting sale:", error);
          toast.error("Erreur lors de la suppression de la vente");
        }
      },
    });
  };

  const hardDeleteSale = async (sale: Sale) => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent supprimer des ventes");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Supprimer définitivement",
      message:
        "SUPPRIMER DÉFINITIVEMENT cette vente ?\nCette action:\n- Retirera la vente des statistiques\n- Restaurera les quantités en stock\n- NE PEUT PAS être annulée\n\nContinuer ?",
      confirmStyle: "danger",
      onConfirm: async () => {
        try {
          // Restore inventory for each item
          for (const item of sale.items) {
            // Fetch current product data
            const { data: product, error: fetchError } = await supabase
              .from("zo-products")
              .select("zopos_qty")
              .eq("id", item.product_id)
              .single();

            if (fetchError) {
              console.error("Error fetching product:", fetchError);
              continue;
            }

            // Add back the sold quantity
            const currentQty = product.zopos_qty[item.size] || 0;
            const restoredQty = currentQty + item.quantity;

            const updatedQty = {
              ...product.zopos_qty,
              [item.size]: restoredQty,
            };

            const { error: updateError } = await supabase
              .from("zo-products")
              .update({ zopos_qty: updatedQty })
              .eq("id", item.product_id);

            if (updateError) {
              console.error("Error restoring inventory:", updateError);
            }
          }

          // Delete the sale
          const { error } = await supabase
            .from("zopos_sales")
            .delete()
            .eq("id", sale.id);

          if (error) throw error;

          toast.success("Vente supprimée et stock restauré avec succès");
          fetchSales();
          closeDetailsModal();
        } catch (error) {
          console.error("Error hard deleting sale:", error);
          toast.error("Erreur lors de la suppression définitive de la vente");
        }
      },
    });
  };

  // Filter sales based on search and date range
  const filteredSales = sales.filter((sale) => {
    // Exclude soft-deleted sales
    if (sale.deleted) return false;

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
        {/* Header with Tabs */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-[#0F172A]">
            Ventes
          </h1>
          <p className="text-[#0F172A]/60 mt-1">
            Historique des transactions POS
          </p>

          {/* Tabs - Show Sommaire only for admins */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("ventes")}
              className={`px-4 py-1 rounded-none font-medium text-sm transition-colors ${
                activeTab === "ventes"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white/70 text-[#0F172A]/60 hover:bg-white"
              }`}
            >
              Histoire
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("sommaire")}
                className={`px-4 py-1 rounded-none font-medium text-sm transition-colors ${
                  activeTab === "sommaire"
                    ? "bg-[#3B82F6] text-white"
                    : "bg-white/70 text-[#0F172A]/60 hover:bg-white"
                }`}
              >
                Sommaire
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "ventes" ? (
          <>
            {/* Search and Filters */}
            <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20 mb-6">
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
                      className="w-full px-4 py-1 pl-10 bg-white border border-gray-200 rounded-none 
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
                    className="w-full px-4 py-1 bg-white border border-gray-200 rounded-none 
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
                    className="w-full px-4 py-1 bg-white border border-gray-200 rounded-none 
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
              <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-none flex items-center justify-center">
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
              <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-none flex items-center justify-center">
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
              <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-none flex items-center justify-center">
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
              <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-none flex items-center justify-center">
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
            <div className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20">
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          ID Vente
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Vendeur
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Produits
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Tailles
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Quantités
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-t hover:bg-[#F0F9FF]"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">
                            #{sale.id.substring(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#0F172A]/60">
                            {new Date(sale.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#0F172A]">
                            {sale.seller_name || "Inconnu"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {sale.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-[#0F172A]"
                                >
                                  {item.product_name}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {sale.items.map((item, idx) => (
                                <div key={idx}>
                                  <span className="px-2 py-0.5 bg-[#F0F9FF] text-[#3B82F6] rounded-none text-xs">
                                    {item.size}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {sale.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm font-medium text-[#0F172A]"
                                >
                                  x{item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-serif text-lg font-bold text-[#3B82F6]">
                              {formatPrice(sale.total_amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openDetailsModal(sale)}
                              className="px-3 py-1 bg-[#3B82F6] text-white rounded-none hover:bg-[#2563EB] transition-colors text-xs"
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Sommaire - Analytics Tab */
          <SommaireAnalytics sales={sales} />
        )}
      </div>

      {/* Sale Details Modal */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-none shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
                  Détails de la Vente
                </h3>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-[#F0F9FF] rounded-none transition-colors"
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
              <div className="mb-6 p-4 bg-[#F0F9FF] rounded-none">
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
                  <div>
                    <p className="text-xs text-[#0F172A]/60 mb-1">Vendeur</p>
                    <p className="font-medium text-[#0F172A]">
                      {selectedSale.seller_name || "Inconnu"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#0F172A]/60 mb-1">Articles</p>
                    <p className="font-medium text-[#0F172A]">
                      {selectedSale.items_count} article
                      {selectedSale.items_count > 1 ? "s" : ""}
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
                      className="flex items-center justify-between p-3 bg-[#F0F9FF] rounded-none"
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

              {/* Delete Buttons - Admin Only */}
              {isAdmin && (
                <div className="border-t border-[#0F172A]/10 mt-6 pt-4">
                  <p className="text-xs text-[#0F172A]/60 mb-3">
                    Actions administrateur
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => softDeleteSale(selectedSale.id)}
                      className="flex-1 px-4 py-1.5 bg-orange-500 text-white rounded-none 
                               hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      Masquer (garder stats)
                    </button>
                    <button
                      onClick={() => hardDeleteSale(selectedSale)}
                      className="flex-1 px-4 py-1.5 bg-red-500 text-white rounded-none 
                               hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              )}
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
