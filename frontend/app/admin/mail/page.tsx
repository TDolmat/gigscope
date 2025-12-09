'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminSettingsApi, adminMailApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageLoader, AdminSection } from '@/components/admin';

type PreviewType = 'test' | 'offers' | 'no_offers' | 'not_subscribed' | 'expired';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  showKey: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
}

const TEMPLATE_OPTIONS: { type: PreviewType; label: string }[] = [
  { type: 'offers', label: 'Z ofertami' },
  { type: 'no_offers', label: 'Brak ofert' },
  { type: 'not_subscribed', label: 'Bez subskrypcji' },
  { type: 'expired', label: 'Wygasła subskrypcja' },
  { type: 'test', label: 'Testowy' },
];

const PREVIEW_LABELS: Record<PreviewType, string> = {
  offers: 'Email z ofertami',
  no_offers: 'Brak ofert',
  not_subscribed: 'Bez subskrypcji',
  expired: 'Wygasła subskrypcja',
  test: 'Testowy email',
};

export default function MailPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Mail settings
  const [mailApiKey, setMailApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [mailSenderEmail, setMailSenderEmail] = useState('');
  const [savingMail, setSavingMail] = useState(false);
  
  // Preview
  const [previewType, setPreviewType] = useState<PreviewType | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Template email
  const [templateEmail, setTemplateEmail] = useState('');
  const [sendingTemplate, setSendingTemplate] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);
  
  const handleSelectType = async (type: PreviewType) => {
    setPreviewType(type);
    try {
      setLoadingPreview(true);
      const result = await adminMailApi.getPreview(type, authenticatedFetch);
      setPreviewHtml(result.html);
    } catch (error) {
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
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(mailApiKey);
      toast.success('Klucz skopiowany do schowka!');
    } catch {
      toast.error('Błąd kopiowania');
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
    } catch (error) {
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
    } catch (error: unknown) {
      console.error('Error sending template email:', error);
      const message = error instanceof Error ? error.message : 'Nie udało się wysłać emaila';
      toast.error(message);
    } finally {
      setSendingTemplate(false);
    }
  };

  if (loading) {
    return <PageLoader title="Ustawienia Maili" />;
  }

  return (
    <div>
      <PageHeader title="Ustawienia Maili" />
      
      <div className="space-y-4 sm:space-y-6">
        {/* Konfiguracja */}
        <AdminSection title="Konfiguracja bramki" className="space-y-4">
          <ApiKeyInput 
            value={mailApiKey}
            onChange={setMailApiKey}
            showKey={showApiKey}
            onToggleShow={() => setShowApiKey(!showApiKey)}
            onCopy={handleCopyApiKey}
          />

          <div>
            <label className="block text-sm font-semibold text-yellow-400 mb-2">Adres nadawcy</label>
            <Input
              type="text"
              placeholder="AI Scoper <noreply@aiscoper.pl>"
              value={mailSenderEmail}
              onChange={(e) => setMailSenderEmail(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveMailSettings} loading={savingMail} variant="primary" size="lg" className="w-full sm:w-auto">
            Zapisz ustawienia
          </Button>
        </AdminSection>

        {/* Podgląd szablonów */}
        <AdminSection title="Podgląd i test szablonów">
          {/* Template buttons */}
          <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-1">
            {TEMPLATE_OPTIONS.map(({ type, label }) => (
              <TemplateButton
                key={type}
                label={label}
                isActive={previewType === type}
                isLoading={loadingPreview}
                onClick={() => handleSelectType(type)}
              />
            ))}
            {loadingPreview && <LoadingIndicator />}
          </div>
          
          {/* Send template form */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
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
              className="w-full sm:w-auto"
            >
              Wyślij szablon
            </Button>
          </div>
          
          {(!mailApiKey || !mailSenderEmail) && (
            <p className="text-xs text-amber-400 mb-4">
              Aby wysłać szablon, najpierw zapisz klucz API i adres nadawcy
            </p>
          )}
          
          {!previewType && (
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Wybierz typ szablonu aby zobaczyć podgląd
            </p>
          )}
          
          {previewHtml && previewType && (
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400 border-b border-gray-700">
                Podgląd: {PREVIEW_LABELS[previewType]}
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[400px] sm:h-[600px] bg-white"
                title="Email Preview"
              />
            </div>
          )}
        </AdminSection>
      </div>
    </div>
  );
}

// Sub-components

interface TemplateButtonProps {
  label: string;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}

function TemplateButton({ label, isActive, isLoading, onClick }: TemplateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
        isActive
          ? 'bg-yellow-400 text-gray-900'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center text-gray-400 text-xs sm:text-sm">
      <svg className="animate-spin h-4 w-4 mr-2 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Ładowanie...
    </div>
  );
}

function ApiKeyInput({ value, onChange, showKey, onToggleShow, onCopy }: ApiKeyInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-yellow-400 mb-2">Klucz API</label>
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          placeholder="re_xxxxxxxxxx..."
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
      <p className="mt-1 text-xs text-gray-400">Klucz API jest bezpiecznie szyfrowany w bazie danych</p>
    </div>
  );
}
