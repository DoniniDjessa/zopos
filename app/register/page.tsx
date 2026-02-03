"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      router.push("/"); // Redirect to home page after successful registration
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription. Veuillez réessayer.");
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
          <p className="text-[#0F172A]/60 font-light">
            Rejoignez l'élégance technologique
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-none shadow-xl p-8 border border-white/20">
          <h2 className="font-serif text-3xl font-semibold text-[#0F172A] mb-6">
            Inscription
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 rounded-none text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[#0F172A] mb-2"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                           transition-all duration-200 text-[#0F172A]"
                  placeholder="Jean"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-[#0F172A] mb-2"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                           focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                           transition-all duration-200 text-[#0F172A]"
                  placeholder="Dupont"
                />
              </div>
            </div>

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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                         transition-all duration-200 text-[#0F172A]"
                placeholder="••••••••"
              />
              <p className="text-xs text-[#0F172A]/50 mt-1">
                Minimum 8 caractères
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#0F172A] mb-2"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
                         transition-all duration-200 text-[#0F172A]"
                placeholder="••••••••"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-[#3B82F6] border-[#3B82F6]/30 rounded 
                         focus:ring-2 focus:ring-[#3B82F6]"
              />
              <label htmlFor="terms" className="text-sm text-[#0F172A]/60">
                J'accepte les{" "}
                <Link
                  href="/terms"
                  className="text-[#3B82F6] hover:text-[#2563EB]"
                >
                  conditions d'utilisation
                </Link>{" "}
                et la{" "}
                <Link
                  href="/privacy"
                  className="text-[#3B82F6] hover:text-[#2563EB]"
                >
                  politique de confidentialité
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3B82F6] text-white py-1.5 rounded-none font-medium
                       hover:bg-[#2563EB] active:scale-[0.98] transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3B82F6]/25 mt-2"
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
                  Création...
                </span>
              ) : (
                "Créer mon compte"
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

          {/* Login Link */}
          <div className="text-center">
            <p className="text-[#0F172A]/60">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-[#3B82F6] font-medium hover:text-[#2563EB] transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#0F172A]/40 mt-6">
          © 2026 les Ateliers Zo
        </p>
      </div>
    </div>
  );
}
