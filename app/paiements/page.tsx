"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

type PaymentStatus = 'pending' | 'validated' | 'cancelled';
type PaymentMethod = 'wave' | 'orange' | 'mtn' | 'moov';

interface PaymentItem {
  product_id: string;
  title: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface Payment {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  payment_phone: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  items: PaymentItem[];
  shipping_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  validated: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  cancelled: 'Annulé',
};

const METHOD_LABELS: Record<string, string> = {
  wave: 'Wave',
  orange: 'Orange Money',
  mtn: 'MTN Money',
  moov: 'Moov Money',
};

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    const k = price / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return price.toString();
};

export default function PaiementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('zo-payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement des paiements');
    } else {
      setPayments((data || []) as Payment[]);
    }
    setLoading(false);
  };

  const createOrderFromPayment = async (payment: Payment) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('zo-orders')
        .insert({
          user_id: payment.user_id,
          total_amount: payment.amount,
          status: 'confirmed',
          shipping_address: payment.shipping_address,
          shipping_phone: payment.customer_phone,
          pickup_number: '',
          customer_name: payment.customer_name,
          customer_phone: payment.customer_phone,
          notes: payment.notes
            ? `[Paiement ${payment.payment_method}] ${payment.notes}`
            : `[Paiement ${payment.payment_method}]`,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Failed to create order from payment:', orderError);
        return;
      }

      const orderItems = payment.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        image_url: item.image_url || '',
        size: item.size,
        color: item.color || null,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase.from('zo-order-items').insert(orderItems);
      if (itemsError) {
        console.error('Failed to create order items:', itemsError);
        await supabase.from('zo-orders').delete().eq('id', order.id);
      }
    } catch (err) {
      console.error('Error creating order from payment:', err);
    }
  };

  const restoreStock = async (items: PaymentItem[]) => {
    for (const item of items) {
      if (!item.product_id) continue;
      try {
        const { data: product } = await supabase
          .from('zo-products')
          .select('sizes')
          .eq('id', item.product_id)
          .single();

        if (!product?.sizes) continue;

        const sizes = product.sizes as Record<string, number>;
        const updatedSizes = { ...sizes, [item.size]: (sizes[item.size] || 0) + item.quantity };
        const totalQty = Object.values(updatedSizes).reduce((s: number, q: unknown) => s + (q as number), 0);

        await supabase
          .from('zo-products')
          .update({ sizes: updatedSizes, in_stock: totalQty > 0, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      } catch (err) {
        console.error(`Failed to restore stock for ${item.product_id}:`, err);
      }
    }
  };

  const handleUpdateStatus = async (paymentId: string, status: PaymentStatus) => {
    const current = payments.find((p) => p.id === paymentId);
    if (!current) return;

    // Restore stock when cancelling a non-cancelled payment
    if (status === 'cancelled' && current.status !== 'cancelled') {
      await restoreStock(current.items);
    }

    // Create order in zo-orders only when first validated
    if (status === 'validated' && current.status !== 'validated') {
      await createOrderFromPayment(current);
    }

    const { error } = await supabase
      .from('zo-payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    if (error) {
      toast.error(`Erreur: ${error.message}`);
    } else {
      toast.success(`Paiement ${STATUS_LABELS[status].toLowerCase()}`);
      setPayments((prev) => prev.map((p) => p.id === paymentId ? { ...p, status } : p));
      if (selectedPayment?.id === paymentId) {
        setSelectedPayment((prev) => prev ? { ...prev, status } : null);
      }
    }
  };

  // Stats
  const totalPending = payments.filter((p) => p.status === 'pending').length;
  const totalValidated = payments.filter((p) => p.status === 'validated').length;
  const totalCancelled = payments.filter((p) => p.status === 'cancelled').length;
  const validatedAmount = payments.filter((p) => p.status === 'validated').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  // Filtered list
  const filtered = payments.filter((p) => {
    const matchSearch = !searchQuery ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer_phone?.includes(searchQuery) ||
      p.payment_phone?.includes(searchQuery) ||
      p.items.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter;

    const pDate = new Date(p.created_at);
    const matchFrom = !dateFrom || pDate >= new Date(dateFrom);
    const matchTo = !dateTo || pDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999));

    return matchSearch && matchStatus && matchMethod && matchFrom && matchTo;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="Zo POS" className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto" />
          <p className="mt-4 text-[#0F172A]/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#0F172A]">Paiements</h1>
            <p className="text-[#0F172A]/60 mt-1">Paiements mobiles en ligne</p>
          </div>
          <button
            onClick={fetchPayments}
            className="px-4 py-1.5 bg-[#3B82F6] text-white rounded-none hover:bg-[#2563EB] transition-colors text-sm font-medium"
          >
            Actualiser
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
            <p className="text-xs text-[#0F172A]/60 mb-1">Total</p>
            <p className="font-serif text-xl font-bold text-[#0F172A]">{payments.length}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
            <p className="text-xs text-yellow-600 mb-1">En attente</p>
            <p className="font-serif text-xl font-bold text-[#0F172A]">{totalPending}</p>
            <p className="text-xs text-[#0F172A]/40 mt-1">{formatPrice(pendingAmount)}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
            <p className="text-xs text-green-600 mb-1">Validés</p>
            <p className="font-serif text-xl font-bold text-[#0F172A]">{totalValidated}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20">
            <p className="text-xs text-red-500 mb-1">Annulés</p>
            <p className="font-serif text-xl font-bold text-[#0F172A]">{totalCancelled}</p>
          </div>
          <div className="bg-[#3B82F6] rounded-none p-4 col-span-2 md:col-span-1">
            <p className="text-xs text-white/70 mb-1">Revenu validé</p>
            <p className="font-serif text-xl font-bold text-white">{formatPrice(validatedAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-md rounded-none p-4 border border-white/20 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, client, téléphone, produit..."
                className="w-full pl-9 pr-3 py-1 text-sm bg-white border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="validated">Validés</option>
              <option value="cancelled">Annulés</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="all">Tous les modes</option>
              <option value="wave">Wave</option>
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN Money</option>
              <option value="moov">Moov Money</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-none hover:bg-[#F0F9FF] transition-colors"
            >
              {showFilters ? '− Moins' : '+ Dates'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/60 mb-1">Date début</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-1 text-sm bg-white border border-gray-200 rounded-none focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F172A]/60 mb-1">Date fin</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-1 text-sm bg-white border border-gray-200 rounded-none focus:outline-none" />
              </div>
              {(searchQuery || statusFilter !== 'all' || methodFilter !== 'all' || dateFrom || dateTo) && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setMethodFilter('all'); setDateFrom(''); setDateTo(''); }}
                  className="text-xs text-[#3B82F6] hover:text-[#2563EB] font-medium col-span-2 text-left"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/70 backdrop-blur-md rounded-none border border-white/20">
          <div className="px-4 py-3 border-b border-white/20">
            <p className="text-sm text-[#0F172A]/60">
              {filtered.length} paiement{filtered.length > 1 ? 's' : ''}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#0F172A]/60">Aucun paiement trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">ID</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">Date</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">Client</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">Mode</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">Montant</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">Statut</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#0F172A]/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => (
                    <tr key={payment.id} className="border-t hover:bg-[#F0F9FF]">
                      <td className="px-4 py-3 font-mono text-xs text-[#0F172A]">
                        <button onClick={() => setSelectedPayment(payment)} className="hover:text-[#3B82F6]">
                          #{payment.id.substring(0, 8)}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#0F172A]/60 text-xs">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0F172A]">{payment.customer_name}</p>
                        <p className="text-xs text-[#0F172A]/60">{payment.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-[#0F172A]">{METHOD_LABELS[payment.payment_method] || payment.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className="font-serif text-base font-bold text-[#3B82F6]">{formatPrice(payment.amount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-none text-[10px] font-semibold ${STATUS_COLORS[payment.status]}`}>
                          {STATUS_LABELS[payment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {payment.status !== 'validated' && (
                            <button
                              onClick={() => handleUpdateStatus(payment.id, 'validated')}
                              className="px-2 py-0.5 bg-green-600 text-white rounded-none text-xs hover:bg-green-700 transition-colors"
                            >
                              Valider
                            </button>
                          )}
                          {payment.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(payment.id, 'cancelled')}
                              className="px-2 py-0.5 bg-red-500 text-white rounded-none text-xs hover:bg-red-600 transition-colors"
                            >
                              Annuler
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="px-2 py-0.5 bg-[#3B82F6] text-white rounded-none text-xs hover:bg-[#2563EB] transition-colors"
                          >
                            Détails
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-none shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#0F172A]">
                    Paiement #{selectedPayment.id.substring(0, 8)}
                  </h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[selectedPayment.status]}`}>
                    {STATUS_LABELS[selectedPayment.status]}
                  </span>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-[#F0F9FF] rounded-none">
                  <svg className="w-5 h-5 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-[#F0F9FF] rounded-none">
                <div>
                  <p className="text-xs text-[#0F172A]/60 mb-0.5">Date</p>
                  <p className="font-medium text-[#0F172A] text-sm">
                    {new Date(selectedPayment.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#0F172A]/60 mb-0.5">Client</p>
                  <p className="font-medium text-[#0F172A] text-sm">{selectedPayment.customer_name}</p>
                  <p className="text-xs text-[#0F172A]/60">{selectedPayment.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#0F172A]/60 mb-0.5">Mode</p>
                  <p className="font-medium text-[#0F172A] text-sm capitalize">{METHOD_LABELS[selectedPayment.payment_method]}</p>
                </div>
                <div>
                  <p className="text-xs text-[#0F172A]/60 mb-0.5">Numéro Wave</p>
                  <p className="font-medium text-[#0F172A] text-sm">{selectedPayment.payment_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#0F172A]/60 mb-0.5">Montant</p>
                  <p className="font-serif text-2xl font-bold text-[#3B82F6]">{formatPrice(selectedPayment.amount)}</p>
                </div>
                {selectedPayment.shipping_address && (
                  <div>
                    <p className="text-xs text-[#0F172A]/60 mb-0.5">Adresse</p>
                    <p className="font-medium text-[#0F172A] text-xs">{selectedPayment.shipping_address}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-[#0F172A] mb-3">Articles</h4>
                <div className="space-y-2">
                  {selectedPayment.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#F0F9FF] rounded-none">
                      <div>
                        <p className="font-medium text-sm text-[#0F172A]">{item.title}</p>
                        <p className="text-xs text-[#0F172A]/60">Taille: {item.size} · Qté: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-[#0F172A]">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#0F172A]/10">
                {selectedPayment.status !== 'validated' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'validated')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-none hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Valider
                  </button>
                )}
                {selectedPayment.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'cancelled')}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-none hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Annuler
                  </button>
                )}
                {selectedPayment.status === 'validated' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'pending')}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-none hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    Remettre en attente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
