'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { adminSettingsApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState('daily');
  const [maxOffers, setMaxOffers] = useState('15');
  const [platforms, setPlatforms] = useState({
    upwork: false,
    fiverr: false,
    useme: false,
    justjoinit: false,
    contra: false,
    rocketjobs: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminSettingsApi.getSettings(authenticatedFetch);
      
      // Map frequency from backend to frontend
      const frequencyMap: Record<string, string> = {
        'daily': 'codziennie',
        'every_2_days': 'co2dni',
        'weekly': 'cotydzien',
        'disabled': 'wylacz'
      };
      
      setFrequency(frequencyMap[data.email_frequency] || 'codziennie');
      setMaxOffers(String(data.email_max_offers || 15));
      
      // Convert enabled_platforms array to object
      const enabledPlatforms = data.enabled_platforms || [];
      setPlatforms({
        upwork: enabledPlatforms.includes('upwork'),
        fiverr: enabledPlatforms.includes('fiverr'),
        useme: enabledPlatforms.includes('useme'),
        justjoinit: enabledPlatforms.includes('justjoinit'),
        contra: enabledPlatforms.includes('contra'),
        rocketjobs: enabledPlatforms.includes('rocketjobs'),
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Map frequency from frontend to backend
      const frequencyMap: Record<string, string> = {
        'codziennie': 'daily',
        'co2dni': 'every_2_days',
        'cotydzien': 'weekly',
        'wylacz': 'disabled'
      };
      
      // Convert platforms object to array of enabled platforms
      const enabledPlatforms = Object.entries(platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => platform);
      
      await adminSettingsApi.updateSettings({
        enabled_platforms: enabledPlatforms,
        email_frequency: frequencyMap[frequency],
        email_max_offers: parseInt(maxOffers),
      }, authenticatedFetch);
      
      toast.success('Ustawienia zostały zapisane!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Nie udało się zapisać ustawień');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ustawienia ogólne</h2>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

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

