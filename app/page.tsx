"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#0F172A] mb-2">
            Bienvenue sur Zo POS
          </h1>
          <p className="text-lg text-[#0F172A]/60">
            Système de point de vente pour votre boutique de mode.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/pos">
            <div
              className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20 
                          hover:shadow-lg transition-all cursor-pointer group"
            >
              <div
                className="w-12 h-12 bg-[#3B82F6]/10 rounded-none flex items-center justify-center mb-4
                            group-hover:bg-[#3B82F6]/20 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-[#3B82F6]"
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
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-2">
                Point de Vente
              </h3>
              <p className="text-sm text-[#0F172A]/60">
                Scanner et vendre vos produits
              </p>
            </div>
          </Link>

          <Link href="/products">
            <div
              className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20 
                          hover:shadow-lg transition-all cursor-pointer group"
            >
              <div
                className="w-12 h-12 bg-purple-500/10 rounded-none flex items-center justify-center mb-4
                            group-hover:bg-purple-500/20 transition-colors"
              >
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
              <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-2">
                Produits
              </h3>
              <p className="text-sm text-[#0F172A]/60">
                Gérer votre inventaire
              </p>
            </div>
          </Link>

          <Link href="/ventes">
            <div
              className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20 
                          hover:shadow-lg transition-all cursor-pointer group"
            >
              <div
                className="w-12 h-12 bg-green-500/10 rounded-none flex items-center justify-center mb-4
                            group-hover:bg-green-500/20 transition-colors"
              >
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-2">
                Ventes
              </h3>
              <p className="text-sm text-[#0F172A]/60">
                Historique des transactions
              </p>
            </div>
          </Link>

          <Link href="/dashboard">
            <div
              className="bg-white/70 backdrop-blur-md rounded-none p-6 border border-white/20 
                          hover:shadow-lg transition-all cursor-pointer group"
            >
              <div
                className="w-12 h-12 bg-orange-500/10 rounded-none flex items-center justify-center mb-4
                            group-hover:bg-orange-500/20 transition-colors"
              >
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-2">
                Dashboard
              </h3>
              <p className="text-sm text-[#0F172A]/60">
                Vue d'ensemble et statistiques
              </p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
