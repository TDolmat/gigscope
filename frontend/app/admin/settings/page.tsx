'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminSettingsApi.getSettings(authenticatedFetch);
      
      setFrequency(FREQUENCY_TO_POLISH[data.email_frequency] || 'codziennie');
      
      if (data.email_daytime) {
        setSendTime(utcToPolishTime(data.email_daytime));
      }
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
      
      const utcTime = polishTimeToUtc(sendTime);
      
      await adminSettingsApi.updateSettings({
        email_frequency: POLISH_TO_FREQUENCY[frequency],
        email_daytime: utcTime,
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
            <label className="block text-sm font-semibold text-white mb-2">Częstotliwość</label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 bg-[#191B1F] border-0 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-[#F1E388]/50 text-sm sm:text-base text-white"
            >
              <option value="codziennie">Codziennie</option>
              <option value="co2dni">Co 2 dni</option>
              <option value="cotydzien">Co tydzień</option>
              <option value="wylacz">Wyłącz</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Godzina wysyłki</label>
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 bg-[#191B1F] border-0 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-[#F1E388]/50 text-sm sm:text-base text-white"
            />
            <p className="mt-1 text-xs text-white/50">
              Czas w strefie czasowej Europa/Warszawa (polski czas lokalny)
            </p>
          </div>
        </AdminSection>

        <p className="text-sm text-gray-400">
          Ustawienia platform i maksymalnej liczby ofert znajdują się w zakładce <strong className="text-yellow-400">Scrape</strong>.
        </p>

        <Button onClick={handleSaveSettings} loading={saving} variant="primary" size="lg" className="w-full sm:w-auto">
          Zapisz ustawienia
        </Button>
      </div>
    </div>
  );
}
