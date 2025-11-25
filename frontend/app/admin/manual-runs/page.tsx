'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminManualRunsApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { PageHeader, AdminSection } from '@/components/admin';
import { Search, Mail, Zap, AlertTriangle, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';

type ModalType = 'scrape' | 'mail' | 'both' | null;

interface RunResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function ManualRunsPage() {
  const { authenticatedFetch } = useAuth();
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [loading, setLoading] = useState<ModalType>(null);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);

  const handleScrapeAll = async () => {
    try {
      setLoading('scrape');
      setLastResult(null);
      
      const result = await adminManualRunsApi.scrapeAll(authenticatedFetch);
      
      if (result.success) {
        toast.success(`Scraping zakończony! ${result.successful_scrapes}/${result.total_users} użytkowników`);
        setLastResult({
          success: true,
          message: `Pomyślnie zescrapowano oferty dla ${result.successful_scrapes} z ${result.total_users} użytkowników`,
          details: {
            total_users: result.total_users,
            successful_scrapes: result.successful_scrapes,
            failed_scrapes: result.failed_scrapes,
            total_offers: result.total_scraped_offers,
            duration_seconds: Math.round((result.total_duration_millis || 0) / 1000),
          }
        });
      } else {
        toast.error(result.error || 'Wystąpił błąd podczas scrapowania');
        setLastResult({
          success: false,
          message: result.error || 'Wystąpił błąd podczas scrapowania',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas scrapowania';
      toast.error(message);
      setLastResult({ success: false, message });
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmails = async () => {
    try {
      setLoading('mail');
      setLastResult(null);
      
      const result = await adminManualRunsApi.sendEmails(authenticatedFetch);
      
      if (result.success) {
        toast.success(`Wysyłka zakończona! ${result.summary.total_sent} wysłanych`);
        setLastResult({
          success: true,
          message: `Wysłano ${result.summary.total_sent} emaili`,
          details: {
            total_sent: result.summary.total_sent,
            total_failed: result.summary.total_failed,
            subscribed_users: result.summary.subscribed_users,
            never_subscribed: result.summary.never_subscribed_users,
            expired_users: result.summary.expired_users,
          }
        });
      } else {
        toast.error(result.error || 'Wystąpił błąd podczas wysyłania emaili');
        setLastResult({
          success: false,
          message: result.error || 'Wystąpił błąd podczas wysyłania emaili',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas wysyłania emaili';
      toast.error(message);
      setLastResult({ success: false, message });
    } finally {
      setLoading(null);
    }
  };

  const handleScrapeAndSend = async () => {
    try {
      setLoading('both');
      setLastResult(null);
      
      const result = await adminManualRunsApi.scrapeAndSend(authenticatedFetch);
      
      if (result.success) {
        toast.success('Scraping i wysyłka zakończone pomyślnie!');
        setLastResult({
          success: true,
          message: result.message,
          details: {
            scrape: result.scrape_result,
            mail: result.mail_result?.summary,
          }
        });
      } else {
        toast.error(result.error || 'Wystąpił błąd');
        setLastResult({
          success: false,
          message: result.error || 'Wystąpił błąd',
          details: {
            scrape: result.scrape_result,
            mail: result.mail_result?.summary,
          }
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd';
      toast.error(message);
      setLastResult({ success: false, message });
    } finally {
      setLoading(null);
    }
  };

  const handleConfirm = async () => {
    setModalOpen(null);
    
    switch (modalOpen) {
      case 'scrape':
        await handleScrapeAll();
        break;
      case 'mail':
        await handleSendEmails();
        break;
      case 'both':
        await handleScrapeAndSend();
        break;
    }
  };

  const getModalConfig = () => {
    switch (modalOpen) {
      case 'scrape':
        return {
          title: 'Potwierdź scraping',
          description: 'Czy na pewno chcesz uruchomić scraping ofert dla wszystkich aktywnych użytkowników? Ta operacja może potrwać kilka minut i zużyje kredyty Apify.',
        };
      case 'mail':
        return {
          title: 'Potwierdź wysyłkę emaili',
          description: 'Czy na pewno chcesz wysłać emaile do wszystkich użytkowników? Ta operacja wyśle emaile natychmiast - upewnij się, że oferty zostały wcześniej zescrapowane.',
        };
      case 'both':
        return {
          title: 'Potwierdź scraping i wysyłkę',
          description: 'Czy na pewno chcesz uruchomić pełny proces? Najpierw zostaną zescrapowane oferty dla wszystkich użytkowników, a następnie wysłane emaile. Ta operacja może potrwać kilka minut.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div>
      <PageHeader 
        title="Ręczne uruchamianie" 
        description="Ręcznie uruchom scraping ofert lub wysyłkę emaili"
      />
      
      <div className="space-y-4 sm:space-y-6">
        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Uwaga</h4>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              Te operacje są przeznaczone do ręcznego uruchamiania poza harmonogramem. 
              Upewnij się, że rozumiesz konsekwencje przed uruchomieniem.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Scrape all */}
          <AdminSection className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Scraping ofert
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 flex-grow">
              Uruchom scraping ofert z Upwork dla wszystkich aktywnych subskrybentów. 
              Oferty zostaną zapisane w bazie danych.
            </p>
            <Button
              onClick={() => setModalOpen('scrape')}
              loading={loading === 'scrape'}
              disabled={loading !== null}
              variant="secondary"
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Scrapuj oferty
            </Button>
          </AdminSection>

          {/* Send emails */}
          <AdminSection className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-100 rounded-lg">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Wysyłka emaili
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 flex-grow">
              Wyślij emaile z ofertami do wszystkich użytkowników. Emaile zostaną 
              wysłane tylko jeśli są dostępne niewysłane oferty.
            </p>
            <Button
              onClick={() => setModalOpen('mail')}
              loading={loading === 'mail'}
              disabled={loading !== null}
              variant="secondary"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Wyślij emaile
            </Button>
          </AdminSection>

          {/* Both */}
          <AdminSection className="flex flex-col h-full border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Pełny proces
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 flex-grow">
              Uruchom pełny proces: najpierw scraping ofert dla wszystkich użytkowników, 
              a następnie automatyczna wysyłka emaili.
            </p>
            <Button
              onClick={() => setModalOpen('both')}
              loading={loading === 'both'}
              disabled={loading !== null}
              variant="primary"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Scraping + Emaile
            </Button>
          </AdminSection>
        </div>

        {/* Last result */}
        {lastResult && (
          <AdminSection title="Ostatni wynik">
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              lastResult.success 
                ? 'bg-emerald-50 border border-emerald-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-grow">
                <p className={`text-sm font-medium ${
                  lastResult.success ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {lastResult.message}
                </p>
                
                {lastResult.details && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Scrape details */}
                    {lastResult.details.total_users !== undefined && (
                      <>
                        <DetailCard 
                          icon={Users} 
                          label="Użytkownicy" 
                          value={`${lastResult.details.successful_scrapes}/${lastResult.details.total_users}`} 
                        />
                        <DetailCard 
                          icon={Search} 
                          label="Oferty" 
                          value={lastResult.details.total_offers || 0} 
                        />
                        {lastResult.details.duration_seconds !== undefined && (
                          <DetailCard 
                            icon={Clock} 
                            label="Czas" 
                            value={`${lastResult.details.duration_seconds}s`} 
                          />
                        )}
                      </>
                    )}
                    
                    {/* Mail details */}
                    {lastResult.details.total_sent !== undefined && (
                      <>
                        <DetailCard 
                          icon={Mail} 
                          label="Wysłane" 
                          value={lastResult.details.total_sent} 
                        />
                        {lastResult.details.total_failed > 0 && (
                          <DetailCard 
                            icon={XCircle} 
                            label="Nieudane" 
                            value={lastResult.details.total_failed} 
                          />
                        )}
                      </>
                    )}
                    
                    {/* Combined details */}
                    {lastResult.details.scrape && lastResult.details.mail && (
                      <>
                        <DetailCard 
                          icon={Search} 
                          label="Scrape" 
                          value={`${lastResult.details.scrape.successful_scrapes}/${lastResult.details.scrape.total_users}`} 
                        />
                        <DetailCard 
                          icon={Mail} 
                          label="Emaile" 
                          value={`${lastResult.details.mail.total_sent} wysłanych`} 
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AdminSection>
        )}

        {/* Loading indicator */}
        {loading && (
          <AdminSection>
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-gray-600">
                  {loading === 'scrape' && 'Scrapowanie ofert...'}
                  {loading === 'mail' && 'Wysyłanie emaili...'}
                  {loading === 'both' && 'Scrapowanie i wysyłanie...'}
                </p>
                <p className="text-xs text-gray-500">
                  Ta operacja może potrwać kilka minut
                </p>
              </div>
            </div>
          </AdminSection>
        )}
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText="Tak, uruchom"
        cancelText="Anuluj"
        variant="danger"
      />
    </div>
  );
}

// Sub-component for detail cards
interface DetailCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

function DetailCard({ icon: Icon, label, value }: DetailCardProps) {
  return (
    <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
      <Icon className="w-4 h-4 text-gray-500" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

