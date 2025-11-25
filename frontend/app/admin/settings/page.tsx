'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { adminSettingsApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

// Convert UTC time (HH:MM) to Polish time (Europe/Warsaw)
function utcToPolishTime(utcTime: string): string {
  if (!utcTime) return '09:00';
  
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create a date object for today with the UTC time
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  ));
  
  // Format to Polish timezone
  const polishTime = utcDate.toLocaleTimeString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return polishTime;
}

// Convert Polish time (HH:MM) to UTC time
function polishTimeToUtc(polishTime: string): string {
  if (!polishTime) return '08:00';
  
  const [hours, minutes] = polishTime.split(':').map(Number);
  
  // Create a date in Polish timezone
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${polishTime}:00`;
  
  // Parse as Polish time and get UTC
  const polishDate = new Date(dateStr);
  
  // Get the offset for Europe/Warsaw
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(polishDate);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  const offsetStr = offsetPart?.value || '+01';
  
  // Parse offset (e.g., "GMT+1" or "GMT+2")
  const offsetMatch = offsetStr.match(/([+-])(\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[2]) * (offsetMatch[1] === '+' ? 1 : -1) : 1;
  
  // Calculate UTC hours
  let utcHours = hours - offsetHours;
  if (utcHours < 0) utcHours += 24;
  if (utcHours >= 24) utcHours -= 24;
  
  return `${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default function SettingsPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState('daily');
  const [sendTime, setSendTime] = useState('09:00'); // Polish time (displayed)
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
      
      // Convert UTC time from backend to Polish time for display
      if (data.email_daytime) {
        setSendTime(utcToPolishTime(data.email_daytime));
      }
      
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
      
      // Convert Polish time to UTC for backend
      const utcTime = polishTimeToUtc(sendTime);
      
      await adminSettingsApi.updateSettings({
        enabled_platforms: enabledPlatforms,
        email_frequency: frequencyMap[frequency],
        email_daytime: utcTime,
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
        {/* Czas wysyłki */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Czas wysyłki</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Częstotliwość</label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Czas w strefie czasowej Europa/Warszawa (polski czas lokalny)
            </p>
          </div>
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
