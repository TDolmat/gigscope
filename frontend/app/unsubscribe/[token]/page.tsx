'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Mail, Settings, UserX, CheckCircle } from 'lucide-react';
import { userApi } from '@/lib/api';
import { toast } from 'sonner';

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [alreadyUnsubscribed, setAlreadyUnsubscribed] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInfo = async () => {
      try {
        setLoadingData(true);
        const data = await userApi.getUnsubscribeInfo(token);
        
        setEmail(data.email);
        setAlreadyUnsubscribed(!data.is_subscribed);
      } catch (err: any) {
        console.error('Error fetching unsubscribe info:', err);
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setError('Nie udało się załadować informacji. Spróbuj ponownie.');
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchInfo();
  }, [token]);

  const handleUnsubscribe = async () => {
    setError('');
    setLoading(true);

    try {
      await userApi.unsubscribe(token);
      setSuccess(true);
      setAlreadyUnsubscribed(true);
      
      toast.success('Zostałeś pomyślnie wypisany z newslettera.', {
        duration: 5000,
      });
    } catch (err) {
      setError('Wystąpił błąd podczas wypisywania. Spróbuj ponownie.');
      console.error('Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#191B1F]">
        <div className="bg-topographic" />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#F1E388] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 font-medium text-sm sm:text-base">Ładowanie...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#191B1F] flex flex-col">
        <div className="bg-topographic" />
        <Header variant="default" />
        <main className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
          <div className="max-w-2xl w-full bg-[#2B2E33] rounded-[1rem] sm:rounded-[1.5rem] border border-red-500/30 p-6 sm:p-8 md:p-14 text-center animate-scaleIn">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">⚠️</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 sm:mb-4">
              Nieprawidłowy link
            </h1>
            <p className="text-base sm:text-lg text-white/70 mb-6 sm:mb-8">
              Link do wypisania się jest nieprawidłowy lub wygasł.
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
        </main>
        <Footer />
      </div>
    );
  }

  if (success || alreadyUnsubscribed) {
    return (
      <div className="min-h-screen bg-[#191B1F]">
        {/* Fixed topographic background */}
        <div className="bg-topographic" />
        
        {/* Header */}
        <Header variant="default" />

        <main className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Success Card */}
          <div className="bg-[#2B2E33] rounded-[1rem] sm:rounded-[1.5rem] border border-[#F1E388]/10 p-6 sm:p-8 md:p-14 text-center animate-scaleIn shadow-[0_0_40px_rgba(241,227,136,0.12)]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-[#F1E388]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#F1E388]" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4">
              Zostałeś wypisany
            </h1>
            <p className="text-base sm:text-lg text-white/70 mb-2">
              Adres <strong className="text-[#F1E388] break-all">{email}</strong>
            </p>
            <p className="text-sm sm:text-base text-white/50 mb-6 sm:mb-8">
              został usunięty z listy mailingowej.
            </p>

            {/* Re-subscribe suggestion */}
            <div className="bg-[#F1E388]/10 border border-[#F1E388]/20 rounded-[1rem] p-4 sm:p-6 mb-6 sm:mb-8">
              <p className="text-sm sm:text-base font-semibold text-[#F1E388] mb-2">
                💡 Zmiana zdania?
              </p>
              <p className="text-xs sm:text-sm text-white/60">
                Jeśli oferty były źle dobrane, może zmiana słów kluczowych pomoże? 
                Możesz wrócić do strony głównej i zapisać się ponownie z innymi preferencjami.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                onClick={() => router.push('/')}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Mail className="w-4 h-4 mr-2" />
                Zapisz się ponownie
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Strona główna
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191B1F]">
      {/* Fixed topographic background */}
      <div className="bg-topographic" />
      
      {/* Header */}
      <Header variant="default" />

      {/* Main Content */}
      <main className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 text-red-400 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-red-500/20">
            <UserX className="w-4 h-4" />
            Wypisz się
          </div>
        </div>

        {/* Unsubscribe Card */}
        <div className="bg-[#2B2E33] rounded-[1rem] sm:rounded-[1.5rem] border border-[#F1E388]/10 p-6 sm:p-8 md:p-14 animate-scaleIn shadow-[0_0_40px_rgba(241,227,136,0.12)]">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">😢</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4">
              Przykro nam, że chcesz odejść
            </h2>
            <p className="text-base sm:text-lg text-white/70">
              Czy na pewno chcesz wypisać się z newslettera dla adresu:
            </p>
            <p className="text-lg sm:text-xl font-bold text-[#F1E388] mt-3 break-all">
              {email}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-red-500/10 border border-red-500/30 rounded-[1rem] animate-fadeInUp">
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl flex-shrink-0">⚠️</span>
                <p className="text-xs sm:text-sm text-red-400 font-semibold flex-1 pt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Info Box - Alternative suggestion */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-[#F1E388]/10 border border-[#F1E388]/20 rounded-[1rem]">
            <p className="text-sm sm:text-base font-semibold text-[#F1E388] mb-2">
              💡 Zanim odejdziesz...
            </p>
            <p className="text-xs sm:text-sm text-white/60">
              Jeśli oferty nie pasują do Twoich oczekiwań, może warto po prostu zmienić słowa kluczowe? 
              Dzięki temu otrzymasz oferty lepiej dopasowane do Twoich potrzeb.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Zmień preferencje słów kluczowych
            </Button>

            <Button
              onClick={handleUnsubscribe}
              variant="secondary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Wypisywanie...' : 'Tak, wypisz mnie z otrzymywania ofert'}
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróć do strony głównej
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
