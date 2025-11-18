'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

export default function SettingsPage() {
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
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Ustawienia zapisane!');
    }, 1000);
  };

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
}

