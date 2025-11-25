'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, Check, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [email, setEmail] = useState('');
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    // Validation
    if (!email) {
      setEmailError('Adres email jest wymagany');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Wprowadź poprawny adres email');
      return;
    }

    setLoading(true);

    try {
      const { userApi } = await import('@/lib/api');
      await userApi.subscribe(email, mustContain, mayContain, mustNotContain);
      
      // Show success toast
      toast.success('Świetnie! Będziesz otrzymywać codzienne powiadomienia ze zleceniami dopasowanymi do Twoich słów kluczowych.', {
        duration: 6000,
      });
      
      // Clear form
      setEmail('');
      setMustContain('');
      setMayContain('');
      setMustNotContain('');
    } catch (err: any) {
      // Check if it's a 409 Conflict (already subscribed) - this is expected, not an error
      if (err.status === 409) {
        toast.warning('Ten adres email jest już zapisany do otrzymywania ofert. Jeśli chcesz zmienić preferencje lub wypisać się, użyj linków w otrzymanym mailu.', {
          duration: 7000,
        });
      } else {
        // Only log real errors
        console.error('Subscription error:', err);
        
        if (err.message && err.message.includes('error')) {
          setError(err.message);
        } else {
      setError('Wystąpił błąd podczas zapisywania. Spróbuj ponownie.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh-dark pointer-events-none" />
      
      {/* Header - Sticky Glass Navbar */}
      <Header variant="home" onHowItWorksClick={() => setShowHowItWorks(true)} />

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
                      <div className="text-left">
                        <p className="font-semibold mb-1">Dla członków be free club</p>
                        <p className="text-xs opacity-90">
                          Nie jesteś członkiem?{' '}
                          <a 
                            href="https://circle.befree.club" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-300 transition-colors"
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
                    <Tooltip 
                      content={
                        <div className="text-left">
                          <p className="font-semibold mb-2">✅ Wszystkie słowa wymagane</p>
                          <p className="text-xs opacity-90 mb-2">
                            Zlecenie musi zawierać <strong>KAŻDE</strong> z podanych słów kluczowych.
                          </p>
                          <div className="bg-white/10 rounded p-2 text-xs mb-2">
                            <p className="font-semibold mb-1">Przykład:</p>
                            <p className="opacity-90">React, TypeScript, Frontend</p>
                            <p className="opacity-75 mt-1">→ Zlecenie musi zawierać React <strong>I</strong> TypeScript <strong>I</strong> Frontend</p>
                          </div>
                          <p className="text-xs opacity-75 border-t border-white/20 pt-2">
                            💡 Dla platform zagranicznych wpisuj słowa po angielsku
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    placeholder="np. React, TypeScript, Frontend (oddziel przecinkami)"
                    value={mustContain}
                    onChange={(e) => setMustContain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">Każde</span> słowo musi być w zleceniu
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <label className="block text-base font-bold text-slate-900">
                      Może zawierać
                      <span className="ml-2 text-xs font-normal text-gray-500">(główne słowa kluczowe)</span>
                    </label>
                    <Tooltip 
                      content={
                        <div className="text-left">
                          <p className="font-semibold mb-2">➕ Jedno lub więcej słów</p>
                          <p className="text-xs opacity-90 mb-2">
                            Zlecenie zawierające <strong>KTÓREKOLWIEK</strong> z tych słów zostanie pokazane.
                          </p>
                          <div className="bg-white/10 rounded p-2 text-xs mb-2">
                            <p className="font-semibold mb-1">Przykład:</p>
                            <p className="opacity-90">Next.js, Tailwind, UI/UX</p>
                            <p className="opacity-75 mt-1">→ Zlecenie z Next.js <strong>LUB</strong> Tailwind <strong>LUB</strong> UI/UX zostanie pokazane</p>
                          </div>
                          <p className="text-xs opacity-75 border-t border-white/20 pt-2">
                            💡 Dla platform zagranicznych wpisuj słowa po angielsku
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    placeholder="np. Next.js, Tailwind, UI/UX (oddziel przecinkami)"
                    value={mayContain}
                    onChange={(e) => setMayContain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Wystarczy <span className="font-semibold">jedno</span> z tych słów (lub więcej)
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <X className="w-5 h-5 text-blue-600" />
                    <label className="block text-base font-bold text-slate-900">
                      Nie może zawierać
                    </label>
                    <Tooltip 
                      content={
                        <div className="text-left">
                          <p className="font-semibold mb-2">❌ Żadne z tych słów</p>
                          <p className="text-xs opacity-90 mb-2">
                            Zlecenie zawierające <strong>KTÓREKOLWIEK</strong> z tych słów zostanie odfiltrowane.
                          </p>
                          <div className="bg-white/10 rounded p-2 text-xs mb-2">
                            <p className="font-semibold mb-1">Przykład:</p>
                            <p className="opacity-90">WordPress, PHP, Backend</p>
                            <p className="opacity-75 mt-1">→ Jeśli zlecenie zawiera WordPress <strong>LUB</strong> PHP <strong>LUB</strong> Backend, zostanie ukryte</p>
                          </div>
                          <p className="text-xs opacity-75 border-t border-white/20 pt-2">
                            💡 Dla platform zagranicznych wpisuj słowa po angielsku
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    placeholder="np. WordPress, PHP, Backend (oddziel przecinkami)"
                    value={mustNotContain}
                    onChange={(e) => setMustNotContain(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">Żadne</span> z tych słów nie może wystąpić
                  </p>
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

                {/* Keyword Logic Explanation */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Jak działają słowa kluczowe?
                  </h4>
                  
                  <div className="space-y-5">
                    <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-xl">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-slate-900 mb-2">Musi zawierać (I / AND)</h5>
                          <p className="text-sm text-gray-700 mb-3">
                            Zlecenie musi zawierać <strong>WSZYSTKIE</strong> podane słowa kluczowe.
                          </p>
                          <div className="bg-white/70 rounded-lg p-3 text-sm">
                            <p className="font-semibold text-slate-900 mb-1">Przykład:</p>
                            <p className="text-gray-700 mb-2"><code className="bg-gray-100 px-2 py-0.5 rounded">React, TypeScript, Frontend</code></p>
                            <p className="text-gray-600">
                              ✅ Zlecenie: "Szukamy developera React + TypeScript do projektu frontend"
                            </p>
                            <p className="text-gray-600">
                              ❌ Zlecenie: "Szukamy developera React do projektu frontend" (brak TypeScript)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                      <div className="flex items-start gap-3">
                        <Plus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-slate-900 mb-2">Może zawierać (LUB / OR)</h5>
                          <p className="text-sm text-gray-700 mb-3">
                            Zlecenie zawierające <strong>JEDNO LUB WIĘCEJ</strong> z tych słów zostanie pokazane.
                          </p>
                          <div className="bg-white/70 rounded-lg p-3 text-sm">
                            <p className="font-semibold text-slate-900 mb-1">Przykład:</p>
                            <p className="text-gray-700 mb-2"><code className="bg-gray-100 px-2 py-0.5 rounded">Next.js, Tailwind, UI/UX</code></p>
                            <p className="text-gray-600">
                              ✅ Zlecenie z Next.js zostanie pokazane
                            </p>
                            <p className="text-gray-600">
                              ✅ Zlecenie z Tailwind zostanie pokazane
                            </p>
                            <p className="text-gray-600">
                              ✅ Zlecenie z Next.js + Tailwind również zostanie pokazane
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
                      <div className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-slate-900 mb-2">Nie może zawierać (NIE / NOT)</h5>
                          <p className="text-sm text-gray-700 mb-3">
                            Zlecenia z <strong>KTÓRYMKOLWIEK</strong> z tych słów zostaną całkowicie odfiltrowane.
                          </p>
                          <div className="bg-white/70 rounded-lg p-3 text-sm">
                            <p className="font-semibold text-slate-900 mb-1">Przykład:</p>
                            <p className="text-gray-700 mb-2"><code className="bg-gray-100 px-2 py-0.5 rounded">WordPress, PHP, Backend</code></p>
                            <p className="text-gray-600">
                              ❌ Zlecenie z WordPress zostanie ukryte
                            </p>
                            <p className="text-gray-600">
                              ❌ Zlecenie z PHP zostanie ukryte
                            </p>
                            <p className="text-gray-600">
                              ❌ Zlecenie zawierające Backend również nie pojawi się w wynikach
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                    <p className="text-sm text-slate-700 font-medium mb-2">
                      <strong>💡 Wskazówka:</strong> Im precyzyjniejsze słowa kluczowe, tym lepiej dopasowane oferty!
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Pamiętaj: dla platform międzynarodowych (Upwork, Fiverr) używaj słów po angielsku, dla polskich platform (Useme) po polsku.
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
      <Footer />
    </div>
  );
}
