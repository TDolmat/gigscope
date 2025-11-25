"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Nieprawidłowy email lub hasło");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Back to home link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-8 sm:mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Strona główna
        </Link>

        {/* Login card */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 text-center border-b border-neutral-100">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">Witaj ponownie</h1>
            <p className="text-sm text-neutral-500">Zaloguj się do swojego konta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-5">
            {/* Error message */}
            {error && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:p-3.5">
                <p className="text-xs sm:text-sm text-neutral-700">{error}</p>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-1.5 sm:mb-2">
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-neutral-900 placeholder-neutral-400 text-sm sm:text-base"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-1.5 sm:mb-2">
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-neutral-900 placeholder-neutral-400 text-sm sm:text-base"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white font-medium py-2 sm:py-2.5 px-6 rounded-lg transition-colors disabled:cursor-not-allowed mt-4 sm:mt-6 text-sm sm:text-base"
            >
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-neutral-400 mt-6 sm:mt-8">
          Nie masz konta? Skontaktuj się z administratorem.
        </p>
      </div>
    </div>
  );
}
