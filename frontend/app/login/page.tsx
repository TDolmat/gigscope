"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login, isAuthenticated, initializing } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, initializing, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Nieprawidłowy email lub hasło");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191B1F] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-pattern pointer-events-none" />
      
      <div className="w-full max-w-[420px] relative z-10">
        {/* Back to home link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#F1E388] mb-8 sm:mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Strona główna
        </Link>

        {/* Login card */}
        <div className="bg-[#2B2E33] rounded-[1rem] border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 text-center border-b border-white/5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F1E388] rounded-[0.75rem] flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#191B1F]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">Witaj ponownie</h1>
            <p className="text-sm text-white/50">Zaloguj się do panelu administracyjnego</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-5">
            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[0.75rem] p-3 sm:p-3.5">
                <p className="text-xs sm:text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5 sm:mb-2">
                Adres email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-[#191B1F] border-0 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-[#F1E388]/50 transition-all text-white placeholder-white/40 text-sm sm:text-base"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5 sm:mb-2">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[#191B1F] border-0 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-[#F1E388]/50 transition-all text-white placeholder-white/40 text-sm sm:text-base"
              />
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-white/30 rounded-md bg-[#191B1F] peer-checked:bg-[#F1E388] peer-checked:border-[#F1E388] transition-all group-hover:border-white/50" />
                  <svg 
                    className="absolute top-0.5 left-0.5 w-4 h-4 text-[#191B1F] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                  Zapamiętaj mnie
                </span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F1E388] hover:brightness-105 disabled:opacity-50 text-[#191B1F] font-semibold py-3 px-6 rounded-[1rem] transition-all disabled:cursor-not-allowed mt-4 sm:mt-6 text-sm sm:text-base cursor-pointer"
            >
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-white/30 mt-6 sm:mt-8">
          Panel dostępny tylko dla administratorów AI Scoper
        </p>
      </div>
    </div>
  );
}
