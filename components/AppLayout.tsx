"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE]">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-md border-b border-white/20 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: Logo & Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#F0F9FF] rounded-[12px] transition-colors"
            >
              <svg
                className="w-6 h-6 text-[#0F172A]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/">
              <h1 className="font-serif text-2xl font-bold text-[#0F172A] cursor-pointer">
                Zo POS
              </h1>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A]/40"
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
              <input
                type="search"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px]
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all text-[#0F172A]"
              />
            </div>
          </div>

          {/* Right: User Info & Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#F0F9FF] rounded-[12px] transition-colors relative">
              <svg
                className="w-6 h-6 text-[#0F172A]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#3B82F6] rounded-full"></span>
            </button>
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-[#0F172A]/10">
              <div className="text-right">
                <p className="text-sm font-medium text-[#0F172A]">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-[#0F172A]/60">Admin</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 hover:bg-red-50 rounded-[12px] transition-colors"
                title="Déconnexion"
              >
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white/70 backdrop-blur-md border-r border-white/20 
                   transition-transform duration-300 z-40 ${
                     sidebarOpen ? "translate-x-0" : "-translate-x-full"
                   }`}
      >
        <nav className="p-4 space-y-2">
          {/* Home */}
          <Link href="/">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors cursor-pointer group ${
                isActive("/") &&
                !isActive("/dashboard") &&
                !isActive("/products")
                  ? "bg-[#3B82F6]/10"
                  : "hover:bg-[#3B82F6]/10"
              }`}
            >
              <svg
                className="w-5 h-5 text-[#3B82F6] group-hover:text-[#2563EB]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-medium text-[#0F172A]">Accueil</span>
            </div>
          </Link>

          {/* Dashboard */}
          <Link href="/dashboard">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors cursor-pointer group ${
                isActive("/dashboard")
                  ? "bg-[#3B82F6]/10"
                  : "hover:bg-[#3B82F6]/10"
              }`}
            >
              <svg
                className="w-5 h-5 text-[#3B82F6] group-hover:text-[#2563EB]"
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
              <span className="font-medium text-[#0F172A]">Dashboard</span>
            </div>
          </Link>

          {/* Products */}
          <Link href="/products">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors cursor-pointer group ${
                isActive("/products")
                  ? "bg-[#3B82F6]/10"
                  : "hover:bg-[#3B82F6]/10"
              }`}
            >
              <svg
                className="w-5 h-5 text-[#3B82F6] group-hover:text-[#2563EB]"
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
              <span className="font-medium text-[#0F172A]">Produits</span>
            </div>
          </Link>

          {/* Orders */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-[#3B82F6]/10 
                        transition-colors cursor-pointer group opacity-50"
          >
            <svg
              className="w-5 h-5 text-[#0F172A]/40"
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
            <span className="font-medium text-[#0F172A]/40">Commandes</span>
          </div>

          {/* Customers */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-[#3B82F6]/10 
                        transition-colors cursor-pointer group opacity-50"
          >
            <svg
              className="w-5 h-5 text-[#0F172A]/40"
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
            <span className="font-medium text-[#0F172A]/40">Clients</span>
          </div>

          <div className="border-t border-[#0F172A]/10 my-4"></div>

          {/* Analytics */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-[#3B82F6]/10 
                        transition-colors cursor-pointer group opacity-50"
          >
            <svg
              className="w-5 h-5 text-[#0F172A]/40"
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
            <span className="font-medium text-[#0F172A]/40">Analytique</span>
          </div>

          {/* AI Stylist */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-[#3B82F6]/10 
                        transition-colors cursor-pointer group opacity-50"
          >
            <svg
              className="w-5 h-5 text-[#0F172A]/40"
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
            <span className="font-medium text-[#0F172A]/40">AI Stylist</span>
          </div>

          <div className="border-t border-[#0F172A]/10 my-4"></div>

          {/* Settings */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-[#3B82F6]/10 
                        transition-colors cursor-pointer group opacity-50"
          >
            <svg
              className="w-5 h-5 text-[#0F172A]/40"
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
            <span className="font-medium text-[#0F172A]/40">Paramètres</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? "pl-0 lg:pl-64" : "pl-0"
        }`}
      >
        {children}
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
