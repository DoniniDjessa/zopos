"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth";
import { forceUpdatePasswordAction } from "@/app/actions/manage-user";

// set to true to show the "forgot password" / "force update" UI
const SHOW_PASSWORD_UPDATE_MODE = false;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const clearAllAuthData = async () => {
    try {
      // Clear Supabase session
      const { supabase } = await import("@/lib/supabase/client");
      await supabase.auth.signOut();
      
      // Clear all localStorage
      localStorage.clear();
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      alert("Cache effacé. Veuillez réessayer de vous connecter.");
      window.location.reload();
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isUpdateMode && newPassword) {
        // 1. Force update password from server (no need for current password)
        const result = await forceUpdatePasswordAction(email, newPassword);
        
        if (!result.success) {
          throw new Error(result.error || "Échec de la mise à jour forcée.");
        }

        setSuccess("Mot de passe mis à jour avec succès ! Connexion en cours...");
        
        // 2. Log in with the NEW password
        await authService.login({ email, password: newPassword });
        
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        // Standard Login
        await authService.login({ email, password });
        router.push("/"); 
      }
    } catch (err: any) {
      setError(
        err.message || "Échec de l'opération. Veuillez vérifier vos identifiants.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE]">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-5xl font-bold text-[#0F172A] mb-2">
            LA BOUTIQUE ZO
          </h1>
          <p className="text-[#0F172A]/60 font-light">Les Ateliers Zo</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-none shadow-xl p-8 border border-white/20">
          <h2 className="font-serif text-3xl font-semibold text-[#0F172A] mb-6">
            Connexion
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 mb-6 rounded-none text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-1.5 mb-6 rounded-none text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0F172A] mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                         transition-all duration-200 text-[#0F172A]"
                placeholder="votre@email.com"
              />
            </div>

            {/* Password Field (Current) - Hide if in update mode */}
            {!isUpdateMode && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#0F172A] mb-2"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isUpdateMode}
                  className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                           transition-all duration-200 text-[#0F172A]"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Toggle Update Mode */}
            {SHOW_PASSWORD_UPDATE_MODE && (
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="update-password"
                  checked={isUpdateMode}
                  onChange={(e) => setIsUpdateMode(e.target.checked)}
                  className="w-4 h-4 text-[#3B82F6] border-[#3B82F6]/20 rounded-none focus:ring-[#3B82F6]"
                />
                <label
                  htmlFor="update-password"
                  className="text-sm font-medium text-[#0F172A]/70 cursor-pointer"
                >
                  🛠️ Nouveau mot de passe (J&apos;ai oublié le mien)
                </label>
              </div>
            )}

            {/* New Password Field (Conditional) */}
            {isUpdateMode && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-[#3B82F6] mb-2"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required={isUpdateMode}
                  className="w-full px-4 py-1.5 bg-white border border-[#3B82F6] rounded-none 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                           transition-all duration-200 text-[#0F172A]"
                  placeholder="Nouveau ••••••••"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-1.5 rounded-none font-medium active:scale-[0.98] transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-lg 
                       ${isUpdateMode ? "bg-[#3B82F6] hover:bg-[#2563EB] shadow-[#3B82F6]/25" : "bg-[#0F172A] hover:bg-black shadow-black/10"} 
                       text-white`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isUpdateMode ? "Mise à jour..." : "Connexion..."}
                </span>
              ) : (
                isUpdateMode ? "Mettre à jour et se connecter" : "Se connecter"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#0F172A]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/70 text-[#0F172A]/60">ou</span>
            </div>
          </div>

          {/* Clear Cache Button */}
          <button
            type="button"
            onClick={clearAllAuthData}
            className="w-full bg-orange-500 text-white py-1.5 rounded-none font-medium
                     hover:bg-orange-600 active:scale-[0.98] transition-all duration-200"
          >
            🔧 Effacer le cache et réinitialiser
          </button>

          {/* Register Link - Disabled, users created by admins only */}
          {/* <div className="text-center">
            <p className="text-[#0F172A]/60">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="text-[#3B82F6] font-medium hover:text-[#2563EB] transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div> */}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#0F172A]/40 mt-6">
          © 2026 les Ateliers Zo.
        </p>
      </div>
    </div>
  );
}
