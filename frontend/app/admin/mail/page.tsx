'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminSettingsApi, adminMailApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

export default function MailPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Mail settings
  const [mailApiKey, setMailApiKey] = useState('');
  const [mailSenderEmail, setMailSenderEmail] = useState('');
  const [savingMail, setSavingMail] = useState(false);
  
  // Preview
  const [previewType, setPreviewType] = useState<'test' | 'offers' | 'no_offers' | 'not_subscribed' | 'expired' | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Template email
  const [templateEmail, setTemplateEmail] = useState('');
  const [sendingTemplate, setSendingTemplate] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);
  
  const handleSelectType = async (type: 'test' | 'offers' | 'no_offers' | 'not_subscribed' | 'expired') => {
    setPreviewType(type);
    try {
      setLoadingPreview(true);
      const result = await adminMailApi.getPreview(type, authenticatedFetch);
      setPreviewHtml(result.html);
    } catch (error: any) {
      console.error('Error loading preview:', error);
      toast.error('Nie udało się załadować podglądu');
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminSettingsApi.getSettings(authenticatedFetch);
      setMailApiKey(data.mail_api_key || '');
      setMailSenderEmail(data.mail_sender_email || '');
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMailSettings = async () => {
    try {
      setSavingMail(true);
      
      await adminSettingsApi.updateSettings({
        mail_api_key: mailApiKey,
        mail_sender_email: mailSenderEmail,
      }, authenticatedFetch);
      
      toast.success('Ustawienia mailowe zostały zapisane!');
    } catch (error: any) {
      console.error('Error saving mail settings:', error);
      toast.error('Nie udało się zapisać ustawień mailowych');
    } finally {
      setSavingMail(false);
    }
  };

  const handleSendTemplateEmail = async () => {
    if (!templateEmail) {
      toast.error('Podaj adres email');
      return;
    }
    if (!previewType) {
      toast.error('Wybierz typ szablonu');
      return;
    }
    
    try {
      setSendingTemplate(true);
      await adminMailApi.sendTemplateEmail(previewType, templateEmail, authenticatedFetch);
      toast.success(`Email "${previewType}" został wysłany na ${templateEmail}`);
    } catch (error: any) {
      console.error('Error sending template email:', error);
      toast.error(error.message || 'Nie udało się wysłać emaila');
    } finally {
      setSendingTemplate(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ustawienia Maili</h2>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ustawienia Maili</h2>
      
      <div className="space-y-6">
        {/* Konfiguracja */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Konfiguracja bramki</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Klucz API</label>
            <Input
              type="password"
              placeholder="re_xxxxxxxxxx..."
              value={mailApiKey}
              onChange={(e) => setMailApiKey(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Adres nadawcy</label>
            <Input
              type="text"
              placeholder="GigScope <noreply@gigscope.pl>"
              value={mailSenderEmail}
              onChange={(e) => setMailSenderEmail(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveMailSettings} loading={savingMail} variant="primary" size="lg">
            Zapisz ustawienia
          </Button>
        </div>

        {/* Podgląd szablonów */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Podgląd i test szablonów</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleSelectType('offers')}
              disabled={loadingPreview}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewType === 'offers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Z ofertami
            </button>
            <button
              onClick={() => handleSelectType('no_offers')}
              disabled={loadingPreview}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewType === 'no_offers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Brak ofert
            </button>
            <button
              onClick={() => handleSelectType('not_subscribed')}
              disabled={loadingPreview}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewType === 'not_subscribed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bez subskrypcji
            </button>
            <button
              onClick={() => handleSelectType('expired')}
              disabled={loadingPreview}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewType === 'expired'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wygasła subskrypcja
            </button>
            <button
              onClick={() => handleSelectType('test')}
              disabled={loadingPreview}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewType === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Testowy
            </button>
            {loadingPreview && (
              <div className="flex items-center text-gray-500 text-sm">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ładowanie...
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mb-4">
            <Input
              type="email"
              value={templateEmail}
              onChange={(e) => setTemplateEmail(e.target.value)}
              placeholder="Email do wysyłki szablonu"
              className="flex-1"
            />
            <Button 
              onClick={handleSendTemplateEmail} 
              loading={sendingTemplate}
              variant="primary"
              size="sm"
              disabled={!mailApiKey || !mailSenderEmail || !templateEmail || !previewType}
            >
              Wyślij szablon
            </Button>
          </div>
          
          {(!mailApiKey || !mailSenderEmail) && (
            <p className="text-xs text-amber-600 mb-4">
              Aby wysłać szablon, najpierw zapisz klucz API i adres nadawcy
            </p>
          )}
          
          {!previewType && (
            <p className="text-sm text-gray-500 mb-4">
              Wybierz typ szablonu aby zobaczyć podgląd
            </p>
          )}
          
          {previewHtml && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b">
                Podgląd: {previewType === 'offers' ? 'Email z ofertami' : 
                         previewType === 'no_offers' ? 'Brak ofert' :
                         previewType === 'not_subscribed' ? 'Bez subskrypcji' :
                         previewType === 'expired' ? 'Wygasła subskrypcja' : 'Testowy email'}
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] bg-white"
                title="Email Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
