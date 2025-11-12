'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { Mail, Check, Plus, X, Sparkles, HelpCircle } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setSuccess(false);

    // Validation
    if (!email) {
      setEmailError('Adres email jest wymagany');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Wprowadź poprawny adres email');
      return;
    }

    if (!mustContain.trim()) {
      setError('Podaj przynajmniej jedno słowo kluczowe w sekcji "Musi zawierać"');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call when backend is ready
      // await subscriptionApi.subscribe(email, { mustContain, mayContain, mustNotContain });
      
      // Temporary success simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setEmail('');
      setMustContain('');
      setMayContain('');
      setMustNotContain('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Wystąpił błąd podczas zapisywania. Spróbuj ponownie.');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh-dark pointer-events-none" />
      
      {/* Header - Sticky Glass Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-2xl bg-white/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold">
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                GigScope
              </span>
            </h1>
            
            <button
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              Jak to działa?
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-6 py-16 md:py-28">
        {/* Hero Section */}
        <div className="text-center mb-24 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 text-blue-700 rounded-full text-sm font-semibold mb-8 border border-blue-100/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Codzienne powiadomienia
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-7 leading-tight tracking-tight">
            Najlepsze zlecenia
            <br />
            <span className="text-gradient-blue">
              spersonalizowane dla Ciebie
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Codziennie otrzymuj <span className="text-blue-600 font-bold">najlepsze oferty</span> dopasowane 
            do Twoich potrzeb i preferencji
          </p>
        </div>

        {/* Subscription Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-500/10 border border-blue-100/50 p-8 md:p-14 animate-scaleIn">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Email Input */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <label className="block text-base font-bold text-slate-900">
                    Twój adres email
                  </label>
                  <Tooltip
                    content={
                      <div className="max-w-xs text-left">
                        <p className="font-semibold mb-1">Dla członków be free club</p>
                        <p className="text-xs opacity-90">
                          Nie jesteś członkiem?{' '}
                          <a 
                            href="https://circle.befree.club" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-300"
                          >
                            Dołącz tutaj
                          </a>
                        </p>
                      </div>
                    }
                  />
                </div>
                <Input
                  type="email"
                  placeholder="twoj.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  disabled={loading}
                />
              </div>

              {/* Keywords Section */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-blue-600" />
                    <label className="block text-base font-bold text-slate-900">
                      Musi zawierać
                    </label>
                    <Tooltip content="Zlecenia będą zawierały wszystkie te słowa kluczowe. To główny filtr." />
                  </div>
                  <Input
                    placeholder="np. React, TypeScript, Frontend (oddziel przecinkami)"
                    value={mustContain}
                    onChange={(e) => setMustContain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-500">Oddziel słowa kluczowe przecinkami</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <label className="block text-base font-bold text-slate-900">
                      Może zawierać
                    </label>
                    <Tooltip content="Zlecenia z tymi słowami będą wyżej w rankingu, ale nie są wymagane." />
                  </div>
                  <Input
                    placeholder="np. Next.js, Tailwind, UI/UX (oddziel przecinkami)"
                    value={mayContain}
                    onChange={(e) => setMayContain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-500">Preferowane, ale opcjonalne</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <X className="w-5 h-5 text-blue-600" />
                    <label className="block text-base font-bold text-slate-900">
                      Nie może zawierać
                    </label>
                    <Tooltip content="Zlecenia zawierające te słowa zostaną automatycznie odfiltrowane." />
                  </div>
                  <Input
                    placeholder="np. WordPress, PHP, Backend (oddziel przecinkami)"
                    value={mustNotContain}
                    onChange={(e) => setMustNotContain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-500">Wyklucz niechciane technologie</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-5 bg-red-50 border border-red-200 rounded-xl animate-fadeInUp">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <p className="text-sm text-red-900 font-semibold flex-1 pt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl animate-fadeInUp">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">🎉</span>
                    <p className="text-sm text-blue-900 font-semibold flex-1 pt-0.5">
                      Świetnie! Będziesz otrzymywać codzienne powiadomienia ze zleceniami dopasowanymi do Twoich słów kluczowych.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="w-full shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 text-lg font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Zapisywanie...'
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Rozpocznij otrzymywanie zleceń
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-14 text-center animate-fadeIn">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                🌟 <strong>Dla członków be free club:</strong> Otrzymuj codziennie najlepsze oferty
                spersonalizowanych zleceń o ustalonej porze. Możliwość zmiany preferencji 
                lub wypisania się w każdej chwili.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowHowItWorks(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-extrabold text-slate-900">Jak to działa?</h3>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Ustaw swoje preferencje</h4>
                    <p className="text-gray-600">
                      Wpisz email i określ słowa kluczowe, które <strong>muszą</strong> być w zleceniu, 
                      które <strong>mogą</strong> być (preferowane), oraz które <strong>nie mogą</strong> się pojawić.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Otrzymuj codzienne powiadomienia</h4>
                    <p className="text-gray-600">
                      Każdego dnia o ustalonej porze dostaniesz maila z <strong>najlepszymi ofertami</strong>, 
                      które spełniają Twoje kryteria i pojawiły się tego dnia.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Zarządzaj subskrypcją</h4>
                    <p className="text-gray-600">
                      W każdym mailu znajdziesz opcję <strong>zmiany preferencji</strong> słów kluczowych 
                      lub <strong>wypisania się</strong> z powiadomień.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                    <p className="text-sm text-slate-700 font-medium">
                      <strong>💡 Wskazówka:</strong> Im precyzyjniejsze słowa kluczowe, tym lepiej dopasowane oferty!
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-blue-200">
                    <p className="text-sm text-slate-700 font-medium mb-2">
                      <strong>🔒 Dla członków be free club</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      Ta usługa jest dostępna tylko dla członków społeczności.{' '}
                      <a 
                        href="https://circle.befree.club" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold hover:text-blue-700 underline"
                      >
                        Dołącz do be free club →
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => setShowHowItWorks(false)}
                  variant="primary"
                  size="lg"
                >
                  Rozumiem, zaczynam!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative border-t border-blue-100/30 mt-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-1">
                GigScope
              </h3>
              <p className="text-xs text-gray-500">Najlepsze oferty freelance</p>
            </div>
            <p className="text-sm text-gray-600">© 2025 GigScope. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
