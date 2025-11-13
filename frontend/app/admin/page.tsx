'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import Link from 'next/link';

type Section = 'dashboard' | 'settings' | 'users' | 'scrape' | 'mail';

// Mock data dla użytkowników
const mockUsers = [
  {
    id: 1,
    email: 'jan.kowalski@example.com',
    mustContain: 'React, TypeScript',
    mayContain: 'Next.js',
    mustNotContain: 'PHP',
    joinedAt: '2025-11-01',
    subscriptionUntil: '2026-11-01',
  },
  {
    id: 2,
    email: 'anna.nowak@example.com',
    mustContain: 'Python, Django',
    mayContain: 'FastAPI',
    mustNotContain: 'WordPress',
    joinedAt: '2025-10-15',
    subscriptionUntil: '2026-10-15',
  },
];

export default function AdminPage() {
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  
  // Ustawienia ogólne
  const [frequency, setFrequency] = useState('codziennie');
  const [maxOffers, setMaxOffers] = useState('15');
  const [platforms, setPlatforms] = useState({
    upwork: true,
    fiverr: true,
    useme: true,
    justjoinit: true,
    contra: false,
    rocketjobs: false,
  });
  
  // Scrape test
  const [testMustContain, setTestMustContain] = useState('');
  const [testMayContain, setTestMayContain] = useState('');
  const [testMustNotContain, setTestMustNotContain] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  
  // Mail settings
  const [apiKey, setApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Ustawienia zapisane!');
    }, 1000);
  };

  const handleRunTest = () => {
    setTesting(true);
    // Symulacja testu
    setTimeout(() => {
      setTestResults([
        { id: 1, title: 'Senior React Developer', platform: 'Upwork', url: '#' },
        { id: 2, title: 'Frontend Engineer - React/TypeScript', platform: 'JustJoinIT', url: '#' },
      ]);
      setTesting(false);
    }, 2000);
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Implementacja statystyk - w przyszłości
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ustawienia ogólne</h2>
            
            <div className="space-y-6">
              {/* Częstotliwość */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Częstotliwość wysyłania wiadomości</label>
                <select 
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="codziennie">Codziennie</option>
                  <option value="co2dni">Co 2 dni</option>
                  <option value="cotydzien">Co tydzień</option>
                  <option value="wylacz">Wyłącz</option>
                </select>
              </div>

              {/* Platformy */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-4">Platformy do scrapowania</label>
                <div className="space-y-3">
                  {Object.entries(platforms).map(([key, value]) => (
                    <Checkbox
                      key={key}
                      id={`platform-${key}`}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      checked={value}
                      onChange={(checked) => setPlatforms({ ...platforms, [key]: checked })}
                    />
                  ))}
                </div>
              </div>

              {/* Max ofert */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Maksymalna liczba ofert w mailu</label>
                <Input
                  type="number"
                  value={maxOffers}
                  onChange={(e) => setMaxOffers(e.target.value)}
                  min="1"
                  max="50"
                />
              </div>

              <Button onClick={handleSaveSettings} loading={saving} variant="primary" size="lg">
                Zapisz ustawienia
              </Button>
            </div>
          </div>
        );

      case 'users':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Użytkownicy</h2>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Musi zawierać</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Może zawierać</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nie może zawierać</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Data dołączenia</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subskrypcja do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.mustContain}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.mayContain || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.mustNotContain || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.joinedAt}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.subscriptionUntil}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'scrape':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Scrape Test</h2>
            
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Musi zawierać</label>
                <Input
                  placeholder="np. React, TypeScript"
                  value={testMustContain}
                  onChange={(e) => setTestMustContain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Może zawierać</label>
                <Input
                  placeholder="np. Next.js, Tailwind"
                  value={testMayContain}
                  onChange={(e) => setTestMayContain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nie może zawierać</label>
                <Input
                  placeholder="np. WordPress, PHP"
                  value={testMustNotContain}
                  onChange={(e) => setTestMustNotContain(e.target.value)}
                />
              </div>

              <Button onClick={handleRunTest} loading={testing} variant="primary" size="lg">
                {testing ? 'Testowanie...' : 'Testuj'}
              </Button>
            </div>

            {testResults.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Wyniki ({testResults.length})</h3>
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div key={result.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">{result.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Platforma: {result.platform}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'mail':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ustawienia Maili</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Konfiguracja</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Klucz API</label>
                  <Input
                    type="password"
                    placeholder="Wpisz klucz API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Adres email wysyłkowy</label>
                  <Input
                    type="email"
                    placeholder="noreply@gigscope.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>

                <Button onClick={handleSaveSettings} loading={saving} variant="primary" size="lg">
                  Zapisz ustawienia
                </Button>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Podgląd maila</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900">GigScope</h4>
                    <p className="text-sm text-gray-600">Twoje dzisiejsze zlecenia</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
                    <div className="font-semibold text-gray-900">Senior React Developer</div>
                    <div className="text-sm text-gray-600 mt-1">Upwork • $50-80/h</div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
                    <div className="font-semibold text-gray-900">Frontend Engineer</div>
                    <div className="text-sm text-gray-600 mt-1">JustJoinIT • 15000-20000 PLN</div>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500 mt-6">
                    <a href="#" className="text-blue-600 hover:underline">Zmień preferencje</a> • <a href="#" className="text-blue-600 hover:underline">Wypisz się</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">GigScope Admin</h1>
            <p className="text-xs text-gray-500">Panel zarządzania</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              ← Strona główna
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setCurrentSection('dashboard')}
              className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                currentSection === 'dashboard' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => setCurrentSection('settings')}
              className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                currentSection === 'settings' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ustawienia ogólne
            </button>
            
            <button
              onClick={() => setCurrentSection('users')}
              className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                currentSection === 'users' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Użytkownicy
            </button>
            
            <button
              onClick={() => setCurrentSection('scrape')}
              className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                currentSection === 'scrape' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Scrape test
            </button>
            
            <button
              onClick={() => setCurrentSection('mail')}
              className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                currentSection === 'mail' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Mail
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
