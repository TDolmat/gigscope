'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminScrapeApi, adminSettingsApi } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateUtils';
import { PageHeader, AdminSection } from '@/components/admin';

// All platform tabs
const PLATFORM_TABS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'upwork', label: 'Upwork' },
  { id: 'justjoinit', label: 'JustJoinIT' },
  { id: 'fiverr', label: 'Fiverr' },
  { id: 'contra', label: 'Contra' },
  { id: 'useme', label: 'Useme' },
  { id: 'rocketjobs', label: 'RocketJobs' },
  { id: 'workconnect', label: 'WorkConnect' },
];

interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  max_offers: number;
}

interface ScoredOffer {
  title: string;
  description: string;
  url: string;
  platform: string;
  budget?: string;
  client_location?: string;
  posted_at?: string;
  fit_score?: number;
  attractiveness_score?: number;
  overall_score?: number;
  selected?: boolean;
  exists_in_database?: boolean;
}

interface AllPlatformsResult {
  mode: string;
  score_mode: string;
  total_offers: number;
  selected_count: number;
  max_offers: number;
  total_duration_ms: number;
  platform_results: Record<string, { count: number; duration_ms?: number; error?: string }>;
  all_offers: ScoredOffer[];
  selected_offers: ScoredOffer[];
}

interface SinglePlatformResult {
  platform: string;
  mode: string;
  search_url?: string;
  scrape_time_ms?: number;
  count: number;
  parsed: ScoredOffer[];
  raw?: string;
}

export default function ScrapePage() {
  const { authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Platforms state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  
  // Configuration
  const [apifyApiKey, setApifyApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [scoringPrompt, setScoringPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [maxOffers, setMaxOffers] = useState('10');
  const [minFitScore, setMinFitScore] = useState('5');
  const [minAttractiveness, setMinAttractiveness] = useState('5');
  const [shuffleKeywords, setShuffleKeywords] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // WorkConnect specific state (for cache management)
  const [workconnectMockEnabled, setWorkconnectMockEnabled] = useState(false);
  const [workconnectCacheHours, setWorkconnectCacheHours] = useState('2');
  const [workconnectCacheStats, setWorkconnectCacheStats] = useState<{count: number; last_updated: string | null}>({ count: 0, last_updated: null });
  const [refreshingCache, setRefreshingCache] = useState(false);
  
  // Test keywords
  const [mustContain, setMustContain] = useState('');
  const [mayContain, setMayContain] = useState('');
  const [mustNotContain, setMustNotContain] = useState('');
  const [savedTestKeywords, setSavedTestKeywords] = useState<{
    must_contain: string[] | null;
    may_contain: string[] | null;
    must_not_contain: string[] | null;
  } | null>(null);
  
  // Testing state
  const [testing, setTesting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Results
  const [singlePlatformResults, setSinglePlatformResults] = useState<SinglePlatformResult | null>(null);
  const [allPlatformsResults, setAllPlatformsResults] = useState<AllPlatformsResult | null>(null);
  const [error, setError] = useState<string>('');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [apifyData, platformsData, testKeywordsData, openaiData, workconnectData] = await Promise.all([
          adminSettingsApi.getApifyKey(authenticatedFetch),
          adminScrapeApi.getPlatforms(authenticatedFetch),
          adminScrapeApi.getTestKeywords(authenticatedFetch),
          adminScrapeApi.getOpenAISettings(authenticatedFetch),
          adminScrapeApi.getWorkConnectSettings(authenticatedFetch),
        ]);
        
        if (apifyData.apify_api_key) {
          setApifyApiKey(apifyData.apify_api_key);
        }
        if (platformsData.platforms) {
          setPlatforms(platformsData.platforms);
        }
        if (testKeywordsData) {
          setSavedTestKeywords(testKeywordsData);
        }
        if (openaiData) {
          if (openaiData.openai_api_key) {
            setOpenaiApiKey(openaiData.openai_api_key);
          }
          if (openaiData.openai_scoring_prompt) {
            setScoringPrompt(openaiData.openai_scoring_prompt);
          }
          if (openaiData.default_prompt) {
            setDefaultPrompt(openaiData.default_prompt);
          }
          if (openaiData.email_max_offers) {
            setMaxOffers(String(openaiData.email_max_offers));
          }
          if (openaiData.min_fit_score !== undefined) {
            setMinFitScore(String(openaiData.min_fit_score));
          }
          if (openaiData.min_attractiveness_score !== undefined) {
            setMinAttractiveness(String(openaiData.min_attractiveness_score));
          }
          if (openaiData.shuffle_keywords !== undefined) {
            setShuffleKeywords(openaiData.shuffle_keywords);
          }
        }
        // Load WorkConnect settings (cache config only - enabled/max_offers comes from platforms list)
        if (workconnectData) {
          setWorkconnectMockEnabled(workconnectData.mock_enabled || false);
          setWorkconnectCacheHours(String(workconnectData.cache_hours || 2));
          if (workconnectData.cache_stats) {
            setWorkconnectCacheStats(workconnectData.cache_stats);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        toast.error('Nie udało się pobrać ustawień');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [authenticatedFetch]);

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

  const currentPlatform = platforms.find(p => p.id === activeTab);
  const isPlatformEnabled = activeTab === 'all' || currentPlatform?.enabled;

  const handleTogglePlatform = async () => {
    if (activeTab === 'all') return;
    
    try {
      const result = await adminScrapeApi.togglePlatform(activeTab, authenticatedFetch);
      setPlatforms(prev => prev.map(p => 
        p.id === activeTab ? { ...p, enabled: result.enabled } : p
      ));
      toast.success(result.enabled ? 'Platforma włączona' : 'Platforma wyłączona');
    } catch (err) {
      toast.error('Nie udało się zmienić statusu platformy');
    }
  };

  const handleUpdatePlatformMaxOffers = async (platformId: string, maxOffers: number) => {
    try {
      await adminScrapeApi.updatePlatformMaxOffers(platformId, maxOffers, authenticatedFetch);
      setPlatforms(prev => prev.map(p => 
        p.id === platformId ? { ...p, max_offers: maxOffers } : p
      ));
      toast.success(`Max ofert dla ${platformId} zaktualizowane`);
    } catch (err) {
      toast.error('Nie udało się zaktualizować max ofert');
    }
  };

  // WorkConnect specific handlers
  const handleRefreshWorkconnectCache = async () => {
    setRefreshingCache(true);
    try {
      const result = await adminScrapeApi.refreshWorkConnectCache(authenticatedFetch);
      setWorkconnectCacheStats({
        count: result.offers_count,
        last_updated: result.cached_at,
      });
      toast.success(`Cache odświeżony - pobrano ${result.offers_count} ofert`);
    } catch (err) {
      toast.error('Nie udało się odświeżyć cache');
    } finally {
      setRefreshingCache(false);
    }
  };

  const handleClearWorkconnectCache = async () => {
    try {
      await adminScrapeApi.clearWorkConnectCache(authenticatedFetch);
      setWorkconnectCacheStats({ count: 0, last_updated: null });
      toast.success('Cache został wyczyszczony');
    } catch (err) {
      toast.error('Nie udało się wyczyścić cache');
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    
    try {
      const promises = [
        adminSettingsApi.updateApifyKey(apifyApiKey, authenticatedFetch),
      ];
      
      if (activeTab === 'all') {
        promises.push(
          adminScrapeApi.updateOpenAISettings({
            openai_api_key: openaiApiKey,
            openai_scoring_prompt: scoringPrompt || undefined,
            email_max_offers: parseInt(maxOffers),
            min_fit_score: parseFloat(minFitScore),
            min_attractiveness_score: parseFloat(minAttractiveness),
            shuffle_keywords: shuffleKeywords,
          }, authenticatedFetch)
        );
      }
      
      if (activeTab === 'workconnect') {
        promises.push(
          adminScrapeApi.updateWorkConnectSettings({
            mock_enabled: workconnectMockEnabled,
            cache_hours: parseFloat(workconnectCacheHours),
          }, authenticatedFetch)
        );
      }
      
      await Promise.all(promises);
      toast.success('Konfiguracja została zapisana!');
    } catch (err) {
      console.error('Error saving config:', err);
      toast.error('Nie udało się zapisać konfiguracji');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveTestKeywords = async () => {
    try {
      const parseKeywords = (str: string) => str.split(',').map(s => s.trim()).filter(s => s);
      await adminScrapeApi.saveTestKeywords(
        parseKeywords(mustContain),
        parseKeywords(mayContain),
        parseKeywords(mustNotContain),
        authenticatedFetch
      );
      setSavedTestKeywords({
        must_contain: parseKeywords(mustContain),
        may_contain: parseKeywords(mayContain),
        must_not_contain: parseKeywords(mustNotContain),
      });
      toast.success('Testowe słowa kluczowe zostały zapisane!');
    } catch (err) {
      toast.error('Nie udało się zapisać słów kluczowych');
    }
  };

  const handleLoadTestKeywords = () => {
    if (savedTestKeywords) {
      setMustContain((savedTestKeywords.must_contain || []).join(', '));
      setMayContain((savedTestKeywords.may_contain || []).join(', '));
      setMustNotContain((savedTestKeywords.must_not_contain || []).join(', '));
      toast.success('Załadowano testowe słowa kluczowe');
    }
  };

  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('Klucz skopiowany do schowka!');
    } catch (err) {
      toast.error('Błąd kopiowania');
    }
  };

  const parseKeywords = (str: string) => str.split(',').map(s => s.trim()).filter(s => s);

  const handleTestSinglePlatform = async (mode: 'real' | 'mock') => {
    setError('');
    setSinglePlatformResults(null);
    setTesting(true);
    setStartTime(Date.now());
    setElapsedTime(0);

    try {
      // Use platform's max_offers setting
      const platformMaxOffers = currentPlatform?.max_offers || 50;
      
      const result = await adminScrapeApi.testScrape(
        activeTab,
        mode,
        parseKeywords(mustContain),
        parseKeywords(mayContain),
        parseKeywords(mustNotContain),
        platformMaxOffers,
        authenticatedFetch
      );

      setSinglePlatformResults(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas scrapowania';
      setError(message);
      console.error('Scrape error:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleTestAllPlatforms = async (mode: 'real' | 'mock', scoreMode: 'real' | 'mock') => {
    setError('');
    setAllPlatformsResults(null);
    setTesting(true);
    setStartTime(Date.now());
    setElapsedTime(0);

    try {
      // Get enabled platforms
      const enabledPlatforms = platforms.filter(p => p.enabled).map(p => p.id);
      
      if (enabledPlatforms.length === 0) {
        setError('Brak włączonych platform. Włącz przynajmniej jedną platformę.');
        setTesting(false);
        return;
      }

      const result = await adminScrapeApi.scrapeAll(
        mode,
        scoreMode,
        parseKeywords(mustContain),
        parseKeywords(mayContain),
        parseKeywords(mustNotContain),
        enabledPlatforms,
        parseInt(maxOffers),
        authenticatedFetch
      );

      setAllPlatformsResults(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas scrapowania';
      setError(message);
      console.error('Scrape error:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleResetPrompt = () => {
    setScoringPrompt('');
    toast.success('Prompt został zresetowany do domyślnego');
  };

  const enabledPlatformsCount = platforms.filter(p => p.enabled).length;

  return (
    <div className="overflow-x-hidden">
      <PageHeader title="Scrape Test" />

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-4 sm:mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 min-w-max">
          {PLATFORM_TABS.map((tab) => {
            const platform = platforms.find(p => p.id === tab.id);
            const isEnabled = tab.id === 'all' || platform?.enabled;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSinglePlatformResults(null);
                  setAllPlatformsResults(null);
                  setError('');
                }}
                className={`
                  py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap flex items-center gap-1.5
                  ${activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }
                `}
              >
                {tab.id !== 'all' && (
                  <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-600'}`} />
                )}
                {tab.label}
                {tab.id === 'all' && enabledPlatformsCount > 0 && (
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">
                    {enabledPlatformsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {!loading && (
        <div className="space-y-4 sm:space-y-6">
          {/* Platform Toggle and Max Offers (for individual platform tabs except workconnect) */}
          {activeTab !== 'all' && activeTab !== 'workconnect' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-white font-medium">
                    {currentPlatform?.name || activeTab}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {isPlatformEnabled 
                      ? 'Ta platforma jest włączona i będzie używana przy scrapowaniu' 
                      : 'Ta platforma jest wyłączona'}
                  </p>
                </div>
                <button
                  onClick={handleTogglePlatform}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${isPlatformEnabled ? 'bg-green-600' : 'bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${isPlatformEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
              
              {/* Max Offers per Platform */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <label className="block text-sm font-semibold text-yellow-400 mb-2">
                  Max ofert do scrapowania z {currentPlatform?.name || activeTab}
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={currentPlatform?.max_offers || 50}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 50;
                      setPlatforms(prev => prev.map(p => 
                        p.id === activeTab ? { ...p, max_offers: value } : p
                      ));
                    }}
                    min="1"
                    max="200"
                    className="w-32"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdatePlatformMaxOffers(activeTab, currentPlatform?.max_offers || 50)}
                  >
                    Zapisz
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Limit ofert scrapowanych z tej platformy (1-200)
                </p>
              </div>
            </div>
          )}

          {/* WorkConnect - uses same toggle/max_offers as other platforms, plus cache status */}
          {activeTab === 'workconnect' && (
            <div className="space-y-4">
              {/* Enable/Disable - same as other platforms */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <h3 className="text-white font-medium">
                    {currentPlatform?.name || 'WorkConnect'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {isPlatformEnabled 
                      ? 'Ta platforma jest włączona i będzie używana przy scrapowaniu' 
                      : 'Ta platforma jest wyłączona'}
                  </p>
                </div>
                <button
                  onClick={handleTogglePlatform}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${isPlatformEnabled ? 'bg-green-600' : 'bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${isPlatformEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
              
              {/* Max Offers - same as other platforms */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <label className="block text-sm font-semibold text-yellow-400 mb-2">
                  Max ofert do scrapowania z {currentPlatform?.name || 'WorkConnect'}
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={currentPlatform?.max_offers || 50}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 50;
                      setPlatforms(prev => prev.map(p => 
                        p.id === activeTab ? { ...p, max_offers: value } : p
                      ));
                    }}
                    min="1"
                    max="200"
                    className="w-32"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdatePlatformMaxOffers(activeTab, currentPlatform?.max_offers || 50)}
                  >
                    Zapisz
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Limit ofert scrapowanych z tej platformy (1-200)
                </p>
              </div>

              {/* Cache status - unique to WorkConnect */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-yellow-400 mb-3">Status cache</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700/50 p-3 rounded">
                    <p className="text-xs text-gray-400">Ofert w cache</p>
                    <p className="text-xl font-bold text-white">{workconnectCacheStats.count}</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded">
                    <p className="text-xs text-gray-400">Ostatnia aktualizacja</p>
                    <p className="text-sm text-white">
                      {workconnectCacheStats.last_updated 
                        ? formatDateTime(workconnectCacheStats.last_updated)
                        : 'Nigdy'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRefreshWorkconnectCache}
                    loading={refreshingCache}
                  >
                    🔄 Odśwież cache
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearWorkconnectCache}
                    disabled={refreshingCache}
                  >
                    🗑️ Wyczyść cache
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Section */}
          <AdminSection title="Konfiguracja" className="space-y-4">
            {/* Apify API Key - shown for Upwork and All tabs */}
            {(activeTab === 'upwork' || activeTab === 'all') && (
              <ApiKeyInput 
                label="Klucz API Apify (Upwork)"
                value={apifyApiKey}
                onChange={setApifyApiKey}
                showKey={showApiKey}
                onToggleShow={() => setShowApiKey(!showApiKey)}
                onCopy={() => handleCopyApiKey(apifyApiKey)}
              />
            )}

            {/* WorkConnect config - shown for WorkConnect tab */}
            {activeTab === 'workconnect' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-yellow-400 mb-2">
                    Czas ważności cache (godziny)
                  </label>
                  <Input
                    type="number"
                    value={workconnectCacheHours}
                    onChange={(e) => setWorkconnectCacheHours(e.target.value)}
                    min="0.1"
                    max="168"
                    step="0.5"
                    className="w-32"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Po tym czasie cache zostanie automatycznie odświeżony (np. 0.5 = 30 min, 2 = 2 godziny)
                  </p>
                </div>

                {/* Mock mode toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Tryb Mock</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Używaj mockowanych danych zamiast prawdziwego scrapowania
                    </p>
                  </div>
                  <button
                    onClick={() => setWorkconnectMockEnabled(!workconnectMockEnabled)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${workconnectMockEnabled ? 'bg-green-600' : 'bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${workconnectMockEnabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </>
            )}

            {/* OpenAI API Key - shown only for All tab */}
            {activeTab === 'all' && (
              <>
                <ApiKeyInput 
                  label="Klucz API OpenAI"
                  value={openaiApiKey}
                  onChange={setOpenaiApiKey}
                  showKey={showOpenaiKey}
                  onToggleShow={() => setShowOpenaiKey(!showOpenaiKey)}
                  onCopy={() => handleCopyApiKey(openaiApiKey)}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-yellow-400">
                      Prompt do oceny ofert
                    </label>
                    <button
                      onClick={handleResetPrompt}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Resetuj do domyślnego
                    </button>
                  </div>
                  <textarea
                    value={scoringPrompt || defaultPrompt}
                    onChange={(e) => setScoringPrompt(e.target.value)}
                    rows={8}
                    className="block w-full px-3 py-2 text-sm border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-gray-700 text-white font-mono"
                    placeholder="Prompt do oceny ofert..."
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Użyj {'{must_contain}'}, {'{may_contain}'}, {'{must_not_contain}'}, {'{offers_json}'} jako zmiennych
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-yellow-400 mb-2">Max ofert do wysyłki</label>
                  <Input
                    type="number"
                    value={maxOffers}
                    onChange={(e) => setMaxOffers(e.target.value)}
                    min="1"
                    max="50"
                    placeholder="np. 10"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Maksymalna liczba ofert które trafią do maila (z zachowaniem różnorodności platform)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-2">Min. dopasowanie</label>
                    <Input
                      type="number"
                      value={minFitScore}
                      onChange={(e) => setMinFitScore(e.target.value)}
                      min="1"
                      max="10"
                      step="0.5"
                      placeholder="5"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Min. fit score (1-10)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-yellow-400 mb-2">Min. atrakcyjność</label>
                    <Input
                      type="number"
                      value={minAttractiveness}
                      onChange={(e) => setMinAttractiveness(e.target.value)}
                      min="1"
                      max="10"
                      step="0.5"
                      placeholder="5"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Min. attractiveness score (1-10)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Oferty poniżej tych progów nie będą wybierane, chyba że brakuje ofert lepszej jakości.
                </p>

                {/* Shuffle Keywords Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Losuj kolejność słów kluczowych</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Miesza słowa kluczowe przed każdym scrapowaniem, co zwiększa różnorodność wyników
                    </p>
                  </div>
                  <button
                    onClick={() => setShuffleKeywords(!shuffleKeywords)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${shuffleKeywords ? 'bg-green-600' : 'bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${shuffleKeywords ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </>
            )}

            <Button onClick={handleSaveConfig} loading={savingConfig} variant="primary" size="lg" className="w-full sm:w-auto">
              Zapisz konfigurację
            </Button>
          </AdminSection>

          {/* Test Section */}
          <AdminSection title="Test scrapera" className="space-y-4">
            {/* Test Keywords Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                onClick={handleLoadTestKeywords} 
                variant="secondary" 
                size="sm"
                disabled={!savedTestKeywords || (
                  (savedTestKeywords.must_contain?.length ?? 0) === 0 &&
                  (savedTestKeywords.may_contain?.length ?? 0) === 0 &&
                  (savedTestKeywords.must_not_contain?.length ?? 0) === 0
                )}
              >
                📋 Załaduj testowe słowa
              </Button>
              <Button 
                onClick={handleSaveTestKeywords} 
                variant="secondary" 
                size="sm"
                disabled={!mustContain && !mayContain && !mustNotContain}
              >
                💾 Zapisz jako testowe
              </Button>
              {savedTestKeywords && ((savedTestKeywords.must_contain?.length ?? 0) > 0 || (savedTestKeywords.may_contain?.length ?? 0) > 0) && (
                <span className="text-xs text-gray-400">
                  Zapisane: {[...(savedTestKeywords.must_contain || []), ...(savedTestKeywords.may_contain || [])].slice(0, 3).join(', ')}
                  {(savedTestKeywords.must_contain?.length ?? 0) + (savedTestKeywords.may_contain?.length ?? 0) > 3 && '...'}
                </span>
              )}
            </div>

            <KeywordInput label="Musi zawierać" value={mustContain} onChange={setMustContain} placeholder="np. react, typescript, developer" />
            <KeywordInput label="Może zawierać" value={mayContain} onChange={setMayContain} placeholder="np. nextjs, tailwind, redux" />
            <KeywordInput label="Nie może zawierać" value={mustNotContain} onChange={setMustNotContain} placeholder="np. wordpress, php, junior" />

            {/* Test Buttons */}
            <div className="pt-2 sm:pt-4 flex flex-wrap gap-3">
              {activeTab === 'all' ? (
                <>
                  <Button 
                    onClick={() => handleTestAllPlatforms('mock', 'mock')} 
                    loading={testing} 
                    variant="secondary" 
                    size="lg"
                    disabled={enabledPlatformsCount === 0}
                  >
                    🧪 Test Mock (Scrape + Score)
                  </Button>
                  <Button 
                    onClick={() => handleTestAllPlatforms('mock', 'real')} 
                    loading={testing} 
                    variant="secondary" 
                    size="lg"
                    disabled={!openaiApiKey || enabledPlatformsCount === 0}
                  >
                    🤖 Mock Scrape + Real OpenAI
                  </Button>
                  <Button 
                    onClick={() => handleTestAllPlatforms('real', 'real')} 
                    loading={testing} 
                    variant="primary" 
                    size="lg"
                    disabled={enabledPlatformsCount === 0}
                  >
                    🚀 Test Real (jak w produkcji)
                  </Button>
                </>
              ) : activeTab === 'workconnect' ? (
                <>
                  <Button 
                    onClick={() => handleTestSinglePlatform('mock')} 
                    loading={testing} 
                    variant="secondary" 
                    size="lg"
                    disabled={!isPlatformEnabled}
                  >
                    🧪 Test Mock
                  </Button>
                  <Button 
                    onClick={() => handleTestSinglePlatform('real')} 
                    loading={testing} 
                    variant="primary" 
                    size="lg"
                    disabled={!isPlatformEnabled}
                  >
                    🚀 Test Real (z cache)
                  </Button>
                  {!isPlatformEnabled && (
                    <p className="text-xs text-orange-400 w-full">
                      ⚠️ Włącz platformę aby uruchomić test
                    </p>
                  )}
                  {isPlatformEnabled && workconnectCacheStats.count === 0 && (
                    <p className="text-xs text-yellow-400 w-full">
                      💡 Cache jest pusty - kliknij &quot;Odśwież cache&quot; powyżej aby pobrać oferty
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => handleTestSinglePlatform('mock')} 
                    loading={testing} 
                    variant="secondary" 
                    size="lg"
                    disabled={!isPlatformEnabled}
                  >
                    🧪 Test Mock
                  </Button>
                  <Button 
                    onClick={() => handleTestSinglePlatform('real')} 
                    loading={testing} 
                    variant="primary" 
                    size="lg"
                    disabled={!isPlatformEnabled || (activeTab === 'upwork' && !apifyApiKey)}
                  >
                    🚀 Test Real
                  </Button>
                  {!isPlatformEnabled && (
                    <p className="text-xs text-orange-400 w-full">
                      ⚠️ Włącz platformę aby uruchomić test
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Enabled platforms info for All tab */}
            {activeTab === 'all' && (
              <div className="text-xs text-gray-400 pt-2">
                Włączone platformy: {platforms.filter(p => p.enabled).map(p => p.name).join(', ') || 'brak'}
              </div>
            )}

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

          {/* Results Section - Single Platform */}
          {singlePlatformResults && activeTab !== 'all' && (
            <SinglePlatformResultsSection results={singlePlatformResults} />
          )}

          {/* Results Section - All Platforms */}
          {allPlatformsResults && activeTab === 'all' && (
            <AllPlatformsResultsSection results={allPlatformsResults} maxOffers={parseInt(maxOffers)} />
          )}
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showKey: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
}

function ApiKeyInput({ label, value, onChange, showKey, onToggleShow, onCopy }: ApiKeyInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-yellow-400 mb-2">{label}</label>
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          placeholder={`Wprowadź ${label.toLowerCase()}`}
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
      <p className="mt-1 text-xs text-gray-400">Klucz jest bezpiecznie szyfrowany w bazie danych</p>
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

function SinglePlatformResultsSection({ results }: { results: SinglePlatformResult }) {
  const existsInDbCount = results.parsed?.filter(o => o.exists_in_database).length || 0;
  
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
            <p className="text-xl sm:text-2xl font-bold text-yellow-400 capitalize">{results.platform}</p>
          </div>
        </div>
      </AdminSection>

      {/* Parsed Output */}
      <AdminSection title={`Wyniki (${results.count} ofert)`}>
        {existsInDbCount > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            📦 {existsInDbCount} ofert już istnieje w bazie (były wcześniej wysłane)
          </p>
        )}
        <div className="max-h-80 sm:max-h-96 overflow-y-auto overflow-x-hidden border border-gray-700 rounded-lg">
          {results.parsed && results.parsed.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {results.parsed.map((offer, index) => (
                <div key={index} className="p-3 sm:p-4 hover:bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white text-sm sm:text-base break-words flex-1">{offer.title}</h4>
                    {offer.exists_in_database && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 cursor-help flex-shrink-0"
                        title="Ta oferta była już wcześniej wysłana do któregoś użytkownika"
                      >
                        📦 w bazie
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-2 break-words whitespace-pre-wrap line-clamp-3">{offer.description}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                    {offer.budget && <span className="flex items-center"><span className="font-medium text-gray-400">Budżet:</span>&nbsp;{offer.budget}</span>}
                    {offer.client_location && <span className="flex items-center break-words"><span className="font-medium text-gray-400">Lokalizacja:</span>&nbsp;{offer.client_location}</span>}
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
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  upwork: 'bg-green-600/30 text-green-400',
  fiverr: 'bg-emerald-600/30 text-emerald-400',
  justjoinit: 'bg-blue-600/30 text-blue-400',
  contra: 'bg-purple-600/30 text-purple-400',
  useme: 'bg-orange-600/30 text-orange-400',
  rocketjobs: 'bg-red-600/30 text-red-400',
  workconnect: 'bg-cyan-600/30 text-cyan-400',
};

function AllPlatformsResultsSection({ results, maxOffers }: { results: AllPlatformsResult; maxOffers: number }) {
  const existsInDbCount = results.all_offers?.filter(o => o.exists_in_database).length || 0;
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <AdminSection title="Podsumowanie">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
          <div className="bg-yellow-400/10 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Wszystkich ofert</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{results.total_offers}</p>
          </div>
          <div className="bg-green-400/10 p-3 sm:p-4 rounded-lg border border-green-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Wybranych (do maila)</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">{results.selected_count}</p>
          </div>
          <div className="bg-yellow-400/10 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Max ofert</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{maxOffers}</p>
          </div>
          <div className="bg-yellow-400/10 p-3 sm:p-4 rounded-lg border border-yellow-500/20">
            <p className="text-xs sm:text-sm text-gray-400">Czas scrapowania</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">
              {results.total_duration_ms ? `${(results.total_duration_ms/1000).toFixed(1)}s` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {Object.entries(results.platform_results).map(([platform, data]) => (
            <div key={platform} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
              <p className="text-xs text-gray-400 capitalize">{platform}</p>
              <p className="text-lg font-bold text-white">{data.count} ofert</p>
              {data.error && <p className="text-xs text-red-400 mt-1 truncate" title={data.error}>{data.error}</p>}
            </div>
          ))}
        </div>
      </AdminSection>

      {/* All Offers with Scores */}
      <AdminSection title={`Wszystkie oferty (${results.total_offers}) - posortowane wg oceny`}>
        <p className="text-xs text-gray-400 mb-3">
          💚 Oferty które trafią do maila • ⚫ Oferty poza limitem (wyszarzone) {existsInDbCount > 0 && `• 📦 ${existsInDbCount} ofert już w bazie`}
        </p>
        <div className="max-h-[600px] overflow-y-auto overflow-x-hidden border border-gray-700 rounded-lg">
          {results.all_offers && results.all_offers.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {results.all_offers.map((offer, index) => (
                <div 
                  key={index} 
                  className={`p-3 sm:p-4 transition-colors ${
                    offer.selected 
                      ? 'hover:bg-gray-700/50 border-l-2 border-l-green-500' 
                      : 'opacity-50 bg-gray-800/50 border-l-2 border-l-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                          PLATFORM_COLORS[offer.platform] || 'bg-gray-600/30 text-gray-400'
                        }`}>
                          {offer.platform}
                        </span>
                        {offer.selected && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-600/30 text-green-400">
                            ✓ w mailu
                          </span>
                        )}
                        {offer.exists_in_database && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 cursor-help"
                            title="Ta oferta była już wcześniej wysłana do któregoś użytkownika"
                          >
                            📦 w bazie
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-white mb-2 text-sm sm:text-base break-words">{offer.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-400 mb-2 break-words whitespace-pre-wrap line-clamp-2">{offer.description}</p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                        {offer.budget && <span><span className="font-medium text-gray-400">Budżet:</span> {offer.budget}</span>}
                        {offer.client_location && <span><span className="font-medium text-gray-400">Lokalizacja:</span> {offer.client_location}</span>}
                      </div>
                      {offer.url && (
                        <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-yellow-400 hover:text-yellow-300 mt-2 inline-block break-all">
                          Zobacz ofertę →
                        </a>
                      )}
                    </div>
                    
                    {/* Scores */}
                    <div className="flex-shrink-0 text-right space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-400">Dopasowanie:</span>
                        <ScoreBadge score={offer.fit_score || 0} />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-400">Atrakcyjność:</span>
                        <ScoreBadge score={offer.attractiveness_score || 0} />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-600">
                        <span className="text-xs text-white font-medium">Ogólna:</span>
                        <ScoreBadge score={offer.overall_score || 0} large />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Brak ofert do wyświetlenia</div>
          )}
        </div>
      </AdminSection>
    </div>
  );
}

function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const getScoreColor = (s: number) => {
    if (s >= 8) return 'bg-green-600/30 text-green-400 border-green-500/50';
    if (s >= 6) return 'bg-yellow-600/30 text-yellow-400 border-yellow-500/50';
    if (s >= 4) return 'bg-orange-600/30 text-orange-400 border-orange-500/50';
    return 'bg-red-600/30 text-red-400 border-red-500/50';
  };

  return (
    <span className={`
      ${large ? 'text-sm px-2 py-1' : 'text-xs px-1.5 py-0.5'} 
      rounded border font-mono font-bold
      ${getScoreColor(score)}
    `}>
      {score.toFixed(1)}
    </span>
  );
}
