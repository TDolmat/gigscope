'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { adminSettingsApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { utcToPolishTime, polishTimeToUtc } from '@/lib/dateUtils';
import { PageHeader, PageLoader, AdminSection } from '@/components/admin';

const FREQUENCY_TO_POLISH: Record<string, string> = {
  'daily': 'codziennie',
  'every_2_days': 'co2dni',
  'weekly': 'cotydzien',
  'disabled': 'wylacz'
};

const POLISH_TO_FREQUENCY: Record<string, string> = {
  'codziennie': 'daily',
  'co2dni': 'every_2_days',
  'cotydzien': 'weekly',
  'wylacz': 'disabled'
};

export default function SettingsPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState('daily');
  const [sendTime, setSendTime] = useState('09:00');
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
      
      setFrequency(FREQUENCY_TO_POLISH[data.email_frequency] || 'codziennie');
      setMaxOffers(String(data.email_max_offers || 15));
      
      if (data.email_daytime) {
        setSendTime(utcToPolishTime(data.email_daytime));
      }
      
      const enabledPlatforms = data.enabled_platforms || [];
      setPlatforms({
        upwork: enabledPlatforms.includes('upwork'),
        fiverr: enabledPlatforms.includes('fiverr'),
        useme: enabledPlatforms.includes('useme'),
        justjoinit: enabledPlatforms.includes('justjoinit'),
        contra: enabledPlatforms.includes('contra'),
        rocketjobs: enabledPlatforms.includes('rocketjobs'),
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const enabledPlatforms = Object.entries(platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => platform);
      
      const utcTime = polishTimeToUtc(sendTime);
      
      await adminSettingsApi.updateSettings({
        enabled_platforms: enabledPlatforms,
        email_frequency: POLISH_TO_FREQUENCY[frequency],
        email_daytime: utcTime,
        email_max_offers: parseInt(maxOffers),
      }, authenticatedFetch);
      
      toast.success('Ustawienia zostały zapisane!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Nie udało się zapisać ustawień');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader title="Ustawienia ogólne" />;
  }

  return (
    <div>
      <PageHeader title="Ustawienia ogólne" />
      
      <div className="space-y-4 sm:space-y-6">
        <AdminSection title="Czas wysyłki" className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Częstotliwość</label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="codziennie">Codziennie</option>
              <option value="co2dni">Co 2 dni</option>
              <option value="cotydzien">Co tydzień</option>
              <option value="wylacz">Wyłącz</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Godzina wysyłki</label>
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <p className="mt-1 text-xs text-gray-500">
              Czas w strefie czasowej Europa/Warszawa (polski czas lokalny)
            </p>
          </div>
        </AdminSection>

        <AdminSection>
          <label className="block text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Platformy do scrapowania</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
        </AdminSection>

        <AdminSection>
          <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Maksymalna liczba ofert w mailu</label>
          <Input
            type="number"
            value={maxOffers}
            onChange={(e) => setMaxOffers(e.target.value)}
            min="1"
            max="50"
          />
        </AdminSection>

        <Button onClick={handleSaveSettings} loading={saving} variant="primary" size="lg" className="w-full sm:w-auto">
          Zapisz ustawienia
        </Button>
      </div>
    </div>
  );
}
