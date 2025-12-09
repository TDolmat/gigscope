'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminScrapeApi, adminSettingsApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader, AdminSection } from '@/components/admin';

type Tab = 'all' | 'upwork' | 'fiverr';

const TABS: { id: Tab; label: string; comingSoon?: boolean }[] = [
  { id: 'all', label: 'Wszystkie', comingSoon: true },
  { id: 'upwork', label: 'Upwork' },
  { id: 'fiverr', label: 'Fiverr', comingSoon: true },
];

export default function ScrapePage() {
  const { authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upwork');
  const [loading, setLoading] = useState(true);
  
  // Upwork configuration
  const [apifyApiKey, setApifyApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [upworkMaxOffers, setUpworkMaxOffers] = useState(50);
  const [perPage, setPerPage] = useState(10);
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Testing state
  const [testing, setTesting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Results
  const [results, setResults] = useState<ScrapeResults | null>(null);
  const [error, setError] = useState<string>('');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [apifyData, settingsData] = await Promise.all([
          adminSettingsApi.getApifyKey(authenticatedFetch),
          adminSettingsApi.getSettings(authenticatedFetch),
        ]);
        
        if (apifyData.apify_api_key) {
          setApifyApiKey(apifyData.apify_api_key);
        }
        if (settingsData.upwork_max_offers) {
          setUpworkMaxOffers(settingsData.upwork_max_offers);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        toast.error('Nie udało się pobrać ustawień');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'upwork') {
      loadSettings();
    }
  }, [activeTab, authenticatedFetch]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testing && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testing, startTime]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    
    try {
      await Promise.all([
        adminSettingsApi.updateApifyKey(apifyApiKey, authenticatedFetch),
        adminSettingsApi.updateSettings({ upwork_max_offers: upworkMaxOffers }, authenticatedFetch),
      ]);
      toast.success('Konfiguracja została zapisana!');
    } catch (err) {
      console.error('Error saving config:', err);
      toast.error('Nie udało się zapisać konfiguracji');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apifyApiKey);
      toast.success('Klucz skopiowany do schowka!');
    } catch (err) {
      toast.error('Błąd kopiowania');
    }
  };

  const handleTest = async () => {
    setError('');
    setResults(null);
    setTesting(true);
    setStartTime(Date.now());
    setElapsedTime(0);

    try {
      const parseKeywords = (str: string) => str.split(',').map(s => s.trim()).filter(s => s);

      const result = await adminScrapeApi.testScrape(
        parseKeywords(mustContain),
        parseKeywords(mayContain),
        parseKeywords(mustNotContain),
        perPage,
        authenticatedFetch
      );

      setResults(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas scrapowania';
      setError(message);
      console.error('Scrape error:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <PageHeader title="Scrape Test" />

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-4 sm:mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }
              `}
            >
              {tab.label}
              {tab.comingSoon && (
                <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs bg-gray-700 text-gray-400 px-1.5 sm:px-2 py-0.5 rounded">
                  wkrótce
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Upwork Tab Content */}
      {activeTab === 'upwork' && loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {activeTab === 'upwork' && !loading && (
        <div className="space-y-4 sm:space-y-6">
          {/* Configuration Section */}
          <AdminSection title="Konfiguracja" className="space-y-4">
            <ApiKeyInput 
              value={apifyApiKey}
              onChange={setApifyApiKey}
              showKey={showApiKey}
              onToggleShow={() => setShowApiKey(!showApiKey)}
              onCopy={handleCopyApiKey}
            />

            <div>
              <label className="block text-sm font-semibold text-yellow-400 mb-2">Maksymalna liczba ofert</label>
              <select
                value={upworkMaxOffers}
                onChange={(e) => setUpworkMaxOffers(Number(e.target.value))}
                className="block w-full px-3 py-2 text-sm border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-gray-700 text-white"
              >
                <option value={10}>10 ofert</option>
                <option value={20}>20 ofert</option>
                <option value={50}>50 ofert</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Maksymalna liczba ofert pobieranych z Upwork podczas scrapowania
              </p>
            </div>

            <Button onClick={handleSaveConfig} loading={savingConfig} variant="primary" size="lg" className="w-full sm:w-auto">
              Zapisz konfigurację
            </Button>
          </AdminSection>

          {/* Test Section */}
          <AdminSection title="Test scrapera" className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-yellow-400 mb-2">Liczba ofert do testu</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="block w-full px-3 py-2 text-sm border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-gray-700 text-white"
              >
                <option value={10}>10 ofert (szybki test)</option>
                <option value={20}>20 ofert</option>
                <option value={50}>50 ofert</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Tylko do testów - produkcyjne scrapowanie używa ustawień z konfiguracji
              </p>
            </div>

            <KeywordInput label="Musi zawierać" value={mustContain} onChange={setMustContain} placeholder="np. react, typescript, developer" />
            <KeywordInput label="Może zawierać" value={mayContain} onChange={setMayContain} placeholder="np. nextjs, tailwind, redux" />
            <KeywordInput label="Nie może zawierać" value={mustNotContain} onChange={setMustNotContain} placeholder="np. wordpress, php, junior" />

            {/* Test Button */}
            <div className="pt-2 sm:pt-4">
              <Button onClick={handleTest} loading={testing} variant="primary" size="lg" className="w-full sm:w-auto">
                {testing ? 'Testowanie...' : 'Testuj scrapera'}
              </Button>
            </div>

            {/* Loading State */}
            {testing && (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-yellow-400 mb-4" />
                  <p className="text-sm text-gray-300">Czas trwania: {(elapsedTime / 1000).toFixed(1)}s</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-xs sm:text-sm text-red-300">{error}</p>
              </div>
            )}
          </AdminSection>

          {/* Results Section */}
          {results && <ScrapeResultsSection results={results} />}
        </div>
      )}

      {/* Coming Soon Tabs */}
      {activeTab === 'all' && <ComingSoonPlaceholder emoji="🔍" text="Funkcja przeszukiwania wszystkich platform jednocześnie zostanie wkrótce dodana" />}
      {activeTab === 'fiverr' && <ComingSoonPlaceholder emoji="💼" text="Scraper dla platformy Fiverr jest w trakcie implementacji" />}
    </div>
  );
}

// Types and Sub-components

interface ScrapeResults {
  count: number;
  search_url?: string;
  scrape_time_ms?: number;
  parsed?: Array<{
    title: string;
    description: string;
    budget?: string;
    client_name?: string;
    posted_at?: string;
    url?: string;
  }>;
  raw?: string;
}

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  showKey: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
}

function ApiKeyInput({ value, onChange, showKey, onToggleShow, onCopy }: ApiKeyInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-yellow-400 mb-2">Klucz API Apify</label>
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          placeholder="Wprowadź klucz API Apify"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-20"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          <button
            type="button"
            onClick={onCopy}
            disabled={!value}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Kopiuj klucz"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggleShow}
            disabled={!value}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title={showKey ? 'Ukryj klucz' : 'Pokaż klucz'}
          >
            {showKey ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">Klucz API jest bezpiecznie szyfrowany w bazie danych</p>
    </div>
  );
}

interface KeywordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function KeywordInput({ label, value, onChange, placeholder }: KeywordInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-2">
        {label}
        <span className="text-xs text-gray-400 ml-2 font-normal">(oddzielone przecinkami)</span>
      </label>
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

interface ScrapeResultsSectionProps {
  results: ScrapeResults;
}

function ScrapeResultsSection({ results }: ScrapeResultsSectionProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search URL */}
      {results.search_url && (
        <AdminSection title="URL zapytania">
          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
            <a href={results.search_url} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-yellow-400 hover:text-yellow-300 break-all underline">
              {results.search_url}
            </a>
          </div>
        </AdminSection>
      )}

      {/* Summary */}
      <AdminSection title="Podsumowanie">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-yellow-400/10 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Znaleziono ofert</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{results.count}</p>
          </div>
          <div className="bg-yellow-400/10 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Czas scrapowania</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">
              {results.scrape_time_ms ? `${(results.scrape_time_ms/1000).toFixed(1)}s` : 'N/A'}
            </p>
          </div>
          <div className="bg-yellow-400/10 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Platforma</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">Upwork</p>
          </div>
        </div>
      </AdminSection>

      {/* Parsed Output */}
      <AdminSection title={`Wyniki (${results.count} ofert)`}>
        <div className="max-h-80 sm:max-h-96 overflow-y-auto overflow-x-hidden border border-gray-700 rounded-lg">
          {results.parsed && results.parsed.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {results.parsed.map((offer, index) => (
                <div key={index} className="p-3 sm:p-4 hover:bg-gray-700/50">
                  <h4 className="font-semibold text-white mb-2 text-sm sm:text-base break-words">{offer.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-400 mb-2 break-words whitespace-pre-wrap line-clamp-3">{offer.description}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                    {offer.budget && <span className="flex items-center"><span className="font-medium text-gray-400">Budżet:</span>&nbsp;{offer.budget}</span>}
                    {offer.client_name && <span className="flex items-center break-words"><span className="font-medium text-gray-400">Klient:</span>&nbsp;{offer.client_name}</span>}
                    {offer.posted_at && <span className="flex items-center"><span className="font-medium text-gray-400">Data:</span>&nbsp;{new Date(offer.posted_at).toLocaleString('pl-PL')}</span>}
                  </div>
                  {offer.url && (
                    <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-yellow-400 hover:text-yellow-300 mt-2 inline-block break-all">
                      Zobacz ofertę →
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Brak ofert do wyświetlenia</div>
          )}
        </div>
      </AdminSection>

      {/* Raw Output */}
      <AdminSection title="Wyniki (raw)">
        <div className="max-h-80 sm:max-h-96 overflow-y-auto overflow-x-hidden">
          <pre className="text-[10px] sm:text-xs bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600 whitespace-pre-wrap break-words text-gray-300">
            {results.raw}
          </pre>
        </div>
      </AdminSection>
    </div>
  );
}

interface ComingSoonPlaceholderProps {
  emoji: string;
  text: string;
}

function ComingSoonPlaceholder({ emoji, text }: ComingSoonPlaceholderProps) {
  return (
    <div className="bg-cards-background rounded-lg shadow-xl shadow-black/20 border border-gray-700 p-8 sm:p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-4xl sm:text-6xl mb-4">{emoji}</div>
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Wkrótce dostępne</h3>
        <p className="text-sm text-gray-400">{text}</p>
      </div>
    </div>
  );
}
