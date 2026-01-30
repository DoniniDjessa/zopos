"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authService.login({ email, password });
      router.push("/"); // Redirect to home page after successful login
    } catch (err: any) {
      setError(
        err.message || "Échec de la connexion. Vérifiez vos identifiants.",
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
            Zo POS
          </h1>
          <p className="text-[#0F172A]/60 font-light">Affirmez votre style</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-xl p-8 border border-white/20">
          <h2 className="font-serif text-3xl font-semibold text-[#0F172A] mb-6">
            Connexion
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-[16px] text-sm">
              {error}
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
                className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                         transition-all duration-200 text-[#0F172A]"
                placeholder="votre@email.com"
              />
            </div>

            {/* Password Field */}
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
                required
                className="w-full px-4 py-3 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-[16px] 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                         transition-all duration-200 text-[#0F172A]"
                placeholder="••••••••"
              />
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-[#3B82F6] hover:text-[#2563EB] transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3B82F6] text-white py-3.5 rounded-[24px] font-medium
                       hover:bg-[#2563EB] active:scale-[0.98] transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3B82F6]/25"
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
                  Connexion...
                </span>
              ) : (
                "Se connecter"
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

          {/* Register Link */}
          <div className="text-center">
            <p className="text-[#0F172A]/60">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="text-[#3B82F6] font-medium hover:text-[#2563EB] transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#0F172A]/40 mt-6">
          © 2026 Zo POS. Fashion meets Technology.
        </p>
      </div>
    </div>
  );
}
