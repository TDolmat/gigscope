'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function MailPage() {
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
}

