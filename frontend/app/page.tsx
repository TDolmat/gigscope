'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { TagInput, tagsToString } from '@/components/ui/TagInput';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HowItWorksModal } from '@/components/HowItWorksModal';
import { Mail, Check, Plus, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { EXTERNAL_LINKS } from '@/lib/config';

export default function Home() {
  const [email, setEmail] = useState('');
  const [mustContainTags, setMustContainTags] = useState<string[]>([]);
  const [mayContainTags, setMayContainTags] = useState<string[]>([]);
  const [mustNotContainTags, setMustNotContainTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    setIsSubmitting(true);

    // Trigger button ripple effect
    if (buttonRef.current) {
      buttonRef.current.classList.add('btn-success-pulse');
    }

    try {
      const { userApi } = await import('@/lib/api');
      const mustContain = tagsToString(mustContainTags);
      const mayContain = tagsToString(mayContainTags);
      const mustNotContain = tagsToString(mustNotContainTags);
      
      await userApi.subscribe(email, mustContain, mayContain, mustNotContain);
      
      toast.success('Świetnie! Będziesz otrzymywać codzienne powiadomienia ze zleceniami dopasowanymi do Twoich słów kluczowych.', {
        duration: 6000,
      });
      
      setEmail('');
      setMustContainTags([]);
      setMayContainTags([]);
      setMustNotContainTags([]);
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
      setTimeout(() => {
        setIsSubmitting(false);
        if (buttonRef.current) {
          buttonRef.current.classList.remove('btn-success-pulse');
        }
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#191B1F]">
      {/* Fixed topographic background */}
      <div className="bg-topographic" />
      
      <Header variant="home" onHowItWorksClick={() => setShowHowItWorks(true)} />

      <main className="relative">
        {/* Hero Section - Full width */}
        <HeroSection />

        {/* Form Section - Centered container */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Subscription Form Card */}
            <div className="bg-[#2B2E33] rounded-[1rem] sm:rounded-[1.5rem] border border-[#F1E388]/10 p-5 sm:p-8 md:p-14 animate-scaleIn shadow-[0_0_40px_rgba(241,227,136,0.12)]">
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
                    tags={mustContainTags}
                    onTagsChange={setMustContainTags}
                    disabled={loading}
                  />
                  <KeywordField
                    type="may"
                    tags={mayContainTags}
                    onTagsChange={setMayContainTags}
                    disabled={loading}
                  />
                  <KeywordField
                    type="not"
                    tags={mustNotContainTags}
                    onTagsChange={setMustNotContainTags}
                    disabled={loading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 sm:p-5 bg-red-500/10 border border-red-500/30 rounded-[1rem] animate-fadeInUp">
                    <div className="flex items-start gap-3">
                      <span className="text-lg sm:text-xl flex-shrink-0">⚠️</span>
                      <p className="text-xs sm:text-sm text-red-400 font-semibold flex-1 pt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2 sm:pt-6">
                  <button
                    ref={buttonRef}
                    type="submit"
                    disabled={loading}
                    className={`w-full px-8 py-4 text-sm sm:text-lg font-bold rounded-[1rem] transition-all duration-300 
                      bg-[#F1E388] text-[#191B1F] hover:bg-[#E5D77C] hover:brightness-105 
                      shadow-[0_0_30px_rgba(241,227,136,0.4)] hover:shadow-[0_0_40px_rgba(241,227,136,0.55)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-[0.98] cursor-pointer
                      flex items-center justify-center gap-2
                      btn-submit-effect
                      ${isSubmitting ? 'btn-success-animation' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        Rozpocznij otrzymywanie zleceń
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Info Box */}
            <div className="mt-8 sm:mt-14 text-center animate-fadeIn">
              <div className="p-4 sm:p-6 bg-[#2B2E33] rounded-[1rem] border border-[#F1E388]/20">
                <p className="text-xs sm:text-sm text-white/70 font-medium leading-relaxed flex flex-wrap items-center justify-center gap-1">
                  🌟 <strong className="text-white">Dla członków</strong>
                  <Image src="/befreeclub-text.png" alt="Be Free Club" width={80} height={16} className="h-3.5 sm:h-4 w-auto inline-block" />
                  <span>Otrzymuj codziennie najlepsze oferty spersonalizowanych zleceń o ustalonej porze. Możliwość zmiany preferencji lub wypisania się w każdej chwili.</span>
                </p>
                <a 
                  href={EXTERNAL_LINKS.BE_FREE_CLUB_JOIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs sm:text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  Nie jesteś członkiem? Dołącz do klubu
                  <span>→</span>
                </a>
              </div>
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
    <div className="text-center py-16 sm:py-24 md:py-32 px-4 animate-fadeInUp">
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F1E388]/10 text-[#F1E388] rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-[#F1E388]/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F1E388] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F1E388]" />
        </span>
        Codzienne powiadomienia
      </div>

      <h2 className="font-[family-name:var(--font-permanent-marker)] text-6xl sm:text-6xl md:text-8xl text-[#F1E388] mb-6 sm:mb-8 leading-tight tracking-wide hero-glow">
        AI Scoper
      </h2>
      
      <p className="text-base sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed font-medium px-2">
        Najlepsze oferty dla <span className="text-[#F1E388]">freelancerów</span> spersonalizowane pod Twoje słowa kluczowe.
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
        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
        <label className="block text-sm sm:text-base font-bold text-white">
          Twój adres email
        </label>
        <Tooltip
          content={
            <div className="text-left">
              <p className="font-semibold mb-1 text-white flex items-center gap-1.5">
                Dla członków <Image src="/befreeclub-text.png" alt="Be Free Club" width={60} height={12} className="h-3 w-auto inline-block" />
              </p>
              <p className="text-xs text-white/70">
                Nie jesteś członkiem?{' '}
                <a 
                  href={EXTERNAL_LINKS.BE_FREE_CLUB_JOIN} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
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
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled: boolean;
}

const KEYWORD_CONFIG = {
  must: {
    icon: Check,
    label: 'Musi zawierać',
    placeholder: 'np. React, TypeScript, Frontend (oddziel spacjami lub przecinkami)',
    helperText: <>Wystarczy <span className="font-semibold text-white">jedno</span> z tych słów (lub więcej)</>,
    tooltip: (
      <div className="text-left">
        <p className="font-semibold mb-2 text-white">✅ Wszystkie słowa wymagane</p>
        <p className="text-xs text-white/70 mb-2">
          Zlecenie musi zawierać <strong className="text-white">KAŻDE</strong> z podanych słów kluczowych.
        </p>
        <div className="bg-white/5 rounded-lg p-2 text-xs mb-2">
          <p className="font-semibold mb-1 text-white">Przykład:</p>
          <p className="text-white/70">React, TypeScript, Frontend</p>
          <p className="text-white/50 mt-1">→ Zlecenie musi zawierać React <strong className="text-white">I</strong> TypeScript <strong className="text-white">I</strong> Frontend</p>
        </div>
        <p className="text-xs text-white/50 border-t border-white/10 pt-2">
          💡 Dla platform zagranicznych wpisuj słowa po angielsku
        </p>
      </div>
    ),
  },
  may: {
    icon: Plus,
    label: 'Może zawierać',
    labelSuffix: '(główne słowa kluczowe)',
    placeholder: 'np. Next.js, Tailwind, UI/UX (oddziel spacjami lub przecinkami)',
    helperText: <>Wystarczy <span className="font-semibold text-white">jedno</span> z tych słów (lub więcej)</>,
    tooltip: (
      <div className="text-left">
        <p className="font-semibold mb-2 text-white">➕ Jedno lub więcej słów</p>
        <p className="text-xs text-white/70 mb-2">
          Zlecenie zawierające <strong className="text-white">KTÓREKOLWIEK</strong> z tych słów zostanie pokazane.
        </p>
        <div className="bg-white/5 rounded-lg p-2 text-xs mb-2">
          <p className="font-semibold mb-1 text-white">Przykład:</p>
          <p className="text-white/70">Next.js, Tailwind, UI/UX</p>
          <p className="text-white/50 mt-1">→ Zlecenie z Next.js <strong className="text-white">LUB</strong> Tailwind <strong className="text-white">LUB</strong> UI/UX zostanie pokazane</p>
        </div>
        <p className="text-xs text-white/50 border-t border-white/10 pt-2">
          💡 Dla platform zagranicznych wpisuj słowa po angielsku
        </p>
      </div>
    ),
  },
  not: {
    icon: X,
    label: 'Nie może zawierać',
    placeholder: 'np. WordPress, PHP, Backend (oddziel spacjami lub przecinkami)',
    helperText: <><span className="font-semibold text-white">Żadne</span> z tych słów nie może wystąpić</>,
    tooltip: (
      <div className="text-left">
        <p className="font-semibold mb-2 text-white">❌ Żadne z tych słów</p>
        <p className="text-xs text-white/70 mb-2">
          Zlecenie zawierające <strong className="text-white">KTÓREKOLWIEK</strong> z tych słów zostanie odfiltrowane.
        </p>
        <div className="bg-white/5 rounded-lg p-2 text-xs mb-2">
          <p className="font-semibold mb-1 text-white">Przykład:</p>
          <p className="text-white/70">WordPress, PHP, Backend</p>
          <p className="text-white/50 mt-1">→ Jeśli zlecenie zawiera WordPress <strong className="text-white">LUB</strong> PHP <strong className="text-white">LUB</strong> Backend, zostanie ukryte</p>
        </div>
        <p className="text-xs text-white/50 border-t border-white/10 pt-2">
          💡 Dla platform zagranicznych wpisuj słowa po angielsku
        </p>
      </div>
    ),
  },
};

function KeywordField({ type, tags, onTagsChange, disabled }: KeywordFieldProps) {
  const config = KEYWORD_CONFIG[type];
  const Icon = config.icon;
  
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
        <label className="block text-sm sm:text-base font-bold text-white">
          {config.label}
        </label>
        {'labelSuffix' in config && (
          <span className="text-xs font-normal text-white/50">{config.labelSuffix}</span>
        )}
        <Tooltip content={config.tooltip} />
      </div>
      <TagInput
        placeholder={config.placeholder}
        value={tags}
        onChange={onTagsChange}
        disabled={disabled}
      />
      <p className="mt-2 text-xs sm:text-sm text-white/50">{config.helperText}</p>
    </div>
  );
}
