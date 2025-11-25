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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Ładowanie preferencji...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-red-500/10 border border-red-100/50 p-8 md:p-14 text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
              Nieprawidłowy link
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Link do zarządzania preferencjami jest nieprawidłowy lub wygasł.
            </p>
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              size="lg"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
      <div className="fixed inset-0 gradient-mesh-dark pointer-events-none" />
      
      {/* Header */}
      <Header variant="default" />

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
            Zarządzaj swoimi
            <br />
            <span className="text-gradient-blue">
              preferencjami
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zaktualizuj słowa kluczowe, aby otrzymywać jeszcze lepiej dopasowane oferty
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-500/10 border border-blue-100/50 p-8 md:p-14">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Email (read-only) */}
            <div>
              <label className="block text-base font-bold text-slate-900 mb-3">
                Adres email
              </label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
              <p className="mt-2 text-sm text-gray-500">
                Nie można zmienić adresu email
              </p>
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
                    Zapisz preferencje
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 text-center">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-slate-700 font-medium">
              💡 <strong>Wskazówka:</strong> Im precyzyjniejsze słowa kluczowe, tym lepiej dopasowane oferty otrzymasz!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

