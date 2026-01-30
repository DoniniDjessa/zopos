"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
          <p className="mt-4 text-[#0F172A]/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE]">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0F172A]">
                Zo POS
              </h1>
              <p className="text-sm text-[#0F172A]/60">Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-[#0F172A]">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-[#0F172A]/60">{profile?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded-[16px] hover:bg-[#2563EB] 
                         transition-all duration-200 text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-xl p-8 border border-white/20 mb-6">
          <h2 className="font-serif text-2xl font-semibold text-[#0F172A] mb-2">
            Bienvenue, {profile?.first_name} ! 👋
          </h2>
          <p className="text-[#0F172A]/60">
            Gérez votre boutique de mode premium depuis votre tableau de bord.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Products Card */}
          <Link href="/products">
            <div
              className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg p-6 border border-white/20 
                          hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#3B82F6]/10 rounded-[16px] group-hover:bg-[#3B82F6]/20 transition-colors">
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1">
                    Produits
                  </h3>
                  <p className="text-sm text-[#0F172A]/60">
                    Gérer le catalogue
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Orders Card */}
          <div
            className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg p-6 border border-white/20 
                        hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#3B82F6]/10 rounded-[16px] group-hover:bg-[#3B82F6]/20 transition-colors">
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-1">Commandes</h3>
                <p className="text-sm text-[#0F172A]/60">Bientôt disponible</p>
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div
            className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg p-6 border border-white/20 
                        hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#3B82F6]/10 rounded-[16px] group-hover:bg-[#3B82F6]/20 transition-colors">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-1">Clients</h3>
                <p className="text-sm text-[#0F172A]/60">Bientôt disponible</p>
              </div>
            </div>
          </div>

          {/* Analytics Card */}
          <div
            className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg p-6 border border-white/20 
                        hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#3B82F6]/10 rounded-[16px] group-hover:bg-[#3B82F6]/20 transition-colors">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-1">
                  Analytique
                </h3>
                <p className="text-sm text-[#0F172A]/60">Bientôt disponible</p>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div
            className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg p-6 border border-white/20 
                        hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#3B82F6]/10 rounded-[16px] group-hover:bg-[#3B82F6]/20 transition-colors">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-1">
                  Paramètres
                </h3>
                <p className="text-sm text-[#0F172A]/60">Bientôt disponible</p>
              </div>
            </div>
          </div>

          {/* AI Stylist Card */}
          <div
            className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-lg p-6 border border-white/20 
                        hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#3B82F6]/10 rounded-[16px] group-hover:bg-[#3B82F6]/20 transition-colors">
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-1">
                  AI Stylist
                </h3>
                <p className="text-sm text-[#0F172A]/60">Bientôt disponible</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
