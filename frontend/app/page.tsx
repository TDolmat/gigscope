'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HowItWorksModal } from '@/components/HowItWorksModal';
import { Mail, Check, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { EXTERNAL_LINKS } from '@/lib/config';

export default function Home() {
  const [email, setEmail] = useState('');
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');

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
      
      toast.success('Świetnie! Będziesz otrzymywać codzienne powiadomienia ze zleceniami dopasowanymi do Twoich słów kluczowych.', {
        duration: 6000,
      });
      
      setEmail('');
      setMustContain('');
      setMayContain('');
      setMustNotContain('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 409) {
        toast.warning('Ten adres email jest już zapisany do otrzymywania ofert. Jeśli chcesz zmienić preferencje lub wypisać się, użyj linków w otrzymanym mailu.', {
          duration: 7000,
        });
      } else {
        console.error('Subscription error:', err);
        const message = err instanceof Error ? err.message : '';
        if (message.includes('error')) {
          setError(message);
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
      <div className="fixed inset-0 gradient-mesh-dark pointer-events-none" />
      
      <Header variant="home" onHowItWorksClick={() => setShowHowItWorks(true)} />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-28">
        {/* Hero Section */}
        <HeroSection />

        {/* Subscription Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-500/10 border border-blue-100/50 p-5 sm:p-8 md:p-14 animate-scaleIn">
            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
              {/* Email Input */}
              <EmailField 
                email={email}
                onChange={setEmail}
                  error={emailError}
                  disabled={loading}
                />

              {/* Keywords Section */}
              <div className="space-y-6 sm:space-y-8">
                <KeywordField
                  type="must"
                    value={mustContain}
                  onChange={setMustContain}
                    disabled={loading}
                  />
                <KeywordField
                  type="may"
                    value={mayContain}
                  onChange={setMayContain}
                    disabled={loading}
                  />
                <KeywordField
                  type="not"
                    value={mustNotContain}
                  onChange={setMustNotContain}
                    disabled={loading}
                  />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 sm:p-5 bg-red-50 border border-red-200 rounded-xl animate-fadeInUp">
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl flex-shrink-0">⚠️</span>
                    <p className="text-xs sm:text-sm text-red-900 font-semibold flex-1 pt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 sm:pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="w-full shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 text-sm sm:text-lg font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Zapisywanie...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Rozpocznij otrzymywanie zleceń
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-8 sm:mt-14 text-center animate-fadeIn">
            <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200">
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                🌟 <strong>Dla członków be free club:</strong> Otrzymuj codziennie najlepsze oferty
                spersonalizowanych zleceń o ustalonej porze. Możliwość zmiany preferencji 
                lub wypisania się w każdej chwili.
              </p>
              <a 
                href={EXTERNAL_LINKS.BEFREE_CLUB}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-xs sm:text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Nie jesteś członkiem? Dołącz do klubu →
              </a>
            </div>
          </div>
        </div>
      </main>

      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <Footer />
              </div>
  );
}

// Sub-components

function HeroSection() {
  return (
    <div className="text-center mb-12 sm:mb-24 animate-fadeInUp">
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50/80 text-blue-700 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-blue-100/50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
        </span>
        Codzienne powiadomienia
                </div>

      <h2 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 mb-4 sm:mb-7 leading-tight tracking-tight">
        Najlepsze zlecenia
        <br />
        <span className="text-gradient-blue">spersonalizowane dla Ciebie</span>
      </h2>
      
      <p className="text-base sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium px-2">
        Codziennie otrzymuj <span className="text-blue-600 font-bold">najlepsze oferty</span> dopasowane 
        do Twoich potrzeb i preferencji
                    </p>
                  </div>
  );
}

interface EmailFieldProps {
  email: string;
  onChange: (value: string) => void;
  error: string;
  disabled: boolean;
}

function EmailField({ email, onChange, error, disabled }: EmailFieldProps) {
  return (
                        <div>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        <label className="block text-sm sm:text-base font-bold text-slate-900">
          Twój adres email
        </label>
        <Tooltip
          content={
            <div className="text-left">
              <p className="font-semibold mb-1">Dla członków be free club</p>
              <p className="text-xs opacity-90">
                Nie jesteś członkiem?{' '}
                      <a 
                        href={EXTERNAL_LINKS.BEFREE_CLUB} 
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
        onChange={(e) => onChange(e.target.value)}
        error={error}
        disabled={disabled}
      />
              </div>
  );
}

interface KeywordFieldProps {
  type: 'must' | 'may' | 'not';
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const KEYWORD_CONFIG = {
  must: {
    icon: Check,
    label: 'Musi zawierać',
    placeholder: 'np. React, TypeScript, Frontend (oddziel przecinkami)',
    helperText: <>Wystarczy <span className="font-semibold">jedno</span> z tych słów (lub więcej)</>,
    tooltip: (
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
    ),
  },
  may: {
    icon: Plus,
    label: 'Może zawierać',
    labelSuffix: '(główne słowa kluczowe)',
    placeholder: 'np. Next.js, Tailwind, UI/UX (oddziel przecinkami)',
    helperText: <>Wystarczy <span className="font-semibold">jedno</span> z tych słów (lub więcej)</>,
    tooltip: (
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
    ),
  },
  not: {
    icon: X,
    label: 'Nie może zawierać',
    placeholder: 'np. WordPress, PHP, Backend (oddziel przecinkami)',
    helperText: <><span className="font-semibold">Żadne</span> z tych słów nie może wystąpić</>,
    tooltip: (
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
    ),
  },
};

function KeywordField({ type, value, onChange, disabled }: KeywordFieldProps) {
  const config = KEYWORD_CONFIG[type];
  const Icon = config.icon;
  
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        <label className="block text-sm sm:text-base font-bold text-slate-900">
          {config.label}
        </label>
        {'labelSuffix' in config && (
          <span className="text-xs font-normal text-gray-500">{config.labelSuffix}</span>
        )}
        <Tooltip content={config.tooltip} />
      </div>
      <Input
        placeholder={config.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="mt-2 text-xs sm:text-sm text-gray-600">{config.helperText}</p>
    </div>
  );
}
