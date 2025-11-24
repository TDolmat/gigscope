'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminScrapeApi, adminSettingsApi } from '@/lib/api';

type Tab = 'all' | 'upwork' | 'fiverr';

export default function ScrapePage() {
  const { authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upwork');
  
  // Upwork configuration
  const [apifyApiKey, setApifyApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [perPage, setPerPage] = useState(10); // Default to 10 for tests
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  
  // Testing state
  const [testing, setTesting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Results
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Load Apify API key on mount
  useEffect(() => {
    const loadApifyKey = async () => {
      try {
        const data = await adminSettingsApi.getApifyKey(authenticatedFetch);
        if (data.apify_api_key) {
          setApifyApiKey(data.apify_api_key);
        }
      } catch (err) {
        console.error('Error loading Apify key:', err);
      }
    };
    
    if (activeTab === 'upwork') {
      loadApifyKey();
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
    setConfigMessage('');
    
    try {
      await adminSettingsApi.updateApifyKey(apifyApiKey, authenticatedFetch);
      setConfigMessage('Klucz API zapisany pomyślnie!');
      setTimeout(() => setConfigMessage(''), 3000);
    } catch (err: any) {
      setConfigMessage('Błąd: ' + (err.message || 'Nie udało się zapisać'));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apifyApiKey);
      setConfigMessage('Klucz skopiowany do schowka!');
      setTimeout(() => setConfigMessage(''), 2000);
    } catch (err) {
      setConfigMessage('Błąd kopiowania');
    }
  };

  const handleTest = async () => {
    setError('');
    setResults(null);
    setTesting(true);
    setStartTime(Date.now());
    setElapsedTime(0);

    try {
      // Parse comma-separated values
      const mustContainArray = mustContain.split(',').map(s => s.trim()).filter(s => s);
      const mayContainArray = mayContain.split(',').map(s => s.trim()).filter(s => s);
      const mustNotContainArray = mustNotContain.split(',').map(s => s.trim()).filter(s => s);

      const result = await adminScrapeApi.testScrape(
        mustContainArray,
        mayContainArray,
        mustNotContainArray,
        perPage,
        authenticatedFetch
      );

      setResults(result);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas scrapowania');
      console.error('Scrape error:', err);
    } finally {
      setTesting(false);
    }
  };

  const tabs: { id: Tab; label: string; comingSoon?: boolean }[] = [
    { id: 'all', label: 'Wszystkie', comingSoon: true },
    { id: 'upwork', label: 'Upwork' },
    { id: 'fiverr', label: 'Fiverr', comingSoon: true },
  ];

  return (
    <div className="overflow-x-hidden">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Scrape Test</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.comingSoon && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  wkrótce
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Upwork Tab Content */}
      {activeTab === 'upwork' && (
        <div className="space-y-6">
          {/* Configuration Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfiguracja</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Klucz API Apify
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Wprowadź klucz API Apify"
                  value={apifyApiKey}
                  onChange={(e) => setApifyApiKey(e.target.value)}
                  className="pr-20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    disabled={!apifyApiKey}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Kopiuj klucz"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {/* Eye toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={!apifyApiKey}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={showApiKey ? 'Ukryj klucz' : 'Pokaż klucz'}
                  >
                    {showApiKey ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Klucz API jest bezpiecznie szyfrowany w bazie danych
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button 
                variant="primary" 
                size="md"
                onClick={handleSaveConfig}
                loading={savingConfig}
              >
                Zapisz konfigurację
              </Button>
              {configMessage && (
                <span className={`text-sm ${configMessage.includes('Błąd') ? 'text-red-600' : 'text-green-600'}`}>
                  {configMessage}
                </span>
              )}
            </div>
          </div>

          {/* Per Page Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liczba ofert</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liczba ofert na stronę
              </label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 ofert (domyślny test)</option>
                <option value={20}>20 ofert</option>
                <option value={50}>50 ofert (produkcyjny)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Domyślnie 10 dla testów, 50 dla scrapowania produkcyjnego
              </p>
            </div>
          </div>

          {/* Keywords Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Słowa kluczowe</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Musi zawierać
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  (oddzielone przecinkami)
                </span>
              </label>
              <Input
                placeholder="np. react, typescript, developer"
                value={mustContain}
                onChange={(e) => setMustContain(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Może zawierać
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  (oddzielone przecinkami)
                </span>
              </label>
              <Input
                placeholder="np. nextjs, tailwind, redux"
                value={mayContain}
                onChange={(e) => setMayContain(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nie może zawierać
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  (oddzielone przecinkami)
                </span>
              </label>
              <Input
                placeholder="np. wordpress, php, junior"
                value={mustNotContain}
                onChange={(e) => setMustNotContain(e.target.value)}
              />
            </div>

            {/* Test Button */}
            <div className="pt-4">
              <Button 
                onClick={handleTest} 
                loading={testing} 
                variant="primary" 
                size="lg"
                className="w-full sm:w-auto"
              >
                {testing ? 'Testowanie...' : 'Testuj'}
              </Button>
            </div>

            {/* Loading State */}
            {testing && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm text-gray-600">
                    Czas trwania: {(elapsedTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              {/* Search URL */}
              {results.search_url && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">URL zapytania</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <a
                      href={results.search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                    >
                      {results.search_url}
                    </a>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Podsumowanie</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Znaleziono ofert</p>
                    <p className="text-2xl font-bold text-blue-600">{results.count}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Czas scrapowania</p>
                    <p className="text-2xl font-bold text-green-600">
                      {results.scrape_time_ms ? `${(results.scrape_time_ms/1000).toFixed(2)} s` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Platforma</p>
                    <p className="text-2xl font-bold text-purple-600">Upwork</p>
                  </div>
                </div>
              </div>

              {/* Parsed Output */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Wyniki ({results.count} ofert)
                </h3>
                <div className="max-h-96 overflow-y-auto overflow-x-hidden border border-gray-200 rounded-lg">
                  {results.parsed && results.parsed.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {results.parsed.map((offer: any, index: number) => (
                        <div key={index} className="p-4 hover:bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-2 break-words">{offer.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 break-words whitespace-pre-wrap">
                            {offer.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            {offer.budget && (
                              <span className="flex items-center">
                                <span className="font-medium">Budżet:</span>&nbsp;{offer.budget}
                              </span>
                            )}
                            {offer.client_name && (
                              <span className="flex items-center break-words">
                                <span className="font-medium">Klient:</span>&nbsp;{offer.client_name}
                              </span>
                            )}
                            {offer.posted_at && (
                              <span className="flex items-center">
                                <span className="font-medium">Data:</span>&nbsp;
                                {new Date(offer.posted_at).toLocaleString('pl-PL')}
                              </span>
                            )}
                          </div>
                          {offer.url && (
                            <a
                              href={offer.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block break-all"
                            >
                              Zobacz ofertę →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      Brak ofert do wyświetlenia
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Output */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Wyniki (raw)</h3>
                <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap break-words">
                    {results.raw}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Tabs (Empty for now) */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wkrótce dostępne</h3>
            <p className="text-gray-500">
              Funkcja przeszukiwania wszystkich platform jednocześnie zostanie wkrótce dodana
            </p>
          </div>
        </div>
      )}

      {activeTab === 'fiverr' && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wkrótce dostępne</h3>
            <p className="text-gray-500">
              Scraper dla platformy Fiverr jest w trakcie implementacji
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

