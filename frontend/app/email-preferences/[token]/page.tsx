'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, Plus, X, Sparkles, ArrowLeft } from 'lucide-react';
import { userApi } from '@/lib/api';
import { toast } from 'sonner';

export default function EmailPreferencesPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [email, setEmail] = useState('');
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchPreferences = async () => {
      try {
        setLoadingData(true);
        const data = await userApi.getPreferences(token);
        
        setEmail(data.email);
        setMustContain(data.mustContain?.join(', ') || '');
        setMayContain(data.mayContain?.join(', ') || '');
        setMustNotContain(data.mustNotContain?.join(', ') || '');
      } catch (err: any) {
        console.error('Error fetching preferences:', err);
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setError('Nie udało się załadować preferencji. Spróbuj ponownie.');
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchPreferences();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      await userApi.updatePreferences(token, mustContain, mayContain, mustNotContain);
      
      toast.success('Preferencje zostały pomyślnie zaktualizowane!', {
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Update preferences error:', err);
      setError('Wystąpił błąd podczas aktualizacji. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#191B1F] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#F1E388] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 font-medium text-sm sm:text-base">Ładowanie preferencji...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#191B1F]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="bg-[#2B2E33] rounded-[1rem] sm:rounded-[1.5rem] border border-red-500/30 p-6 sm:p-8 md:p-14 text-center">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">⚠️</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 sm:mb-4">
              Nieprawidłowy link
            </h1>
            <p className="text-base sm:text-lg text-white/70 mb-6 sm:mb-8">
              Link do zarządzania preferencjami jest nieprawidłowy lub wygasł.
            </p>
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróć do strony głównej
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191B1F]">
      <div className="fixed inset-0 bg-pattern pointer-events-none" />
      
      {/* Header */}
      <Header variant="default" />

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 leading-tight tracking-tight">
            Zarządzaj swoimi
            <br />
            <span className="font-[family-name:var(--font-permanent-marker)] text-[#F1E388] hero-glow">
              preferencjami
            </span>
          </h2>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto px-2">
            Zaktualizuj słowa kluczowe, aby otrzymywać jeszcze lepiej dopasowane oferty
          </p>
        </div>

        <div className="bg-[#2B2E33] rounded-[1rem] sm:rounded-[1.5rem] border border-white/10 p-5 sm:p-8 md:p-14">
          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-white mb-2 sm:mb-3">
                Adres email
              </label>
              <Input
                type="email"
                value={email}
                disabled
                className="opacity-60"
              />
              <p className="mt-2 text-xs sm:text-sm text-white/50">
                Nie można zmienić adresu email
              </p>
            </div>

            {/* Keywords Section */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
                  <label className="block text-sm sm:text-base font-bold text-white">
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
                <p className="mt-2 text-xs sm:text-sm text-white/50">Oddziel słowa kluczowe przecinkami</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
                  <label className="block text-sm sm:text-base font-bold text-white">
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
                <p className="mt-2 text-xs sm:text-sm text-white/50">Preferowane, ale opcjonalne</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
                  <label className="block text-sm sm:text-base font-bold text-white">
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
                <p className="mt-2 text-xs sm:text-sm text-white/50">Wyklucz niechciane technologie</p>
              </div>
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                className="w-full text-sm sm:text-lg font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Zapisywanie...'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    Zapisz preferencje
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="p-4 sm:p-6 bg-[#2B2E33] rounded-[1rem] border border-[#F1E388]/20">
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              💡 <strong className="text-[#F1E388]">Wskazówka:</strong> Im precyzyjniejsze słowa kluczowe, tym lepiej dopasowane oferty otrzymasz!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
