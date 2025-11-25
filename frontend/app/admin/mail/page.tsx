'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminSettingsApi, adminMailApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageLoader, AdminSection } from '@/components/admin';

type PreviewType = 'test' | 'offers' | 'no_offers' | 'not_subscribed' | 'expired';

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
            <p className="text-xs text-amber-600 mb-4">
              Aby wysłać szablon, najpierw zapisz klucz API i adres nadawcy
            </p>
          )}
          
          {!previewType && (
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Wybierz typ szablonu aby zobaczyć podgląd
            </p>
          )}
          
          {previewHtml && previewType && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 border-b">
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
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center text-gray-500 text-xs sm:text-sm">
      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Ładowanie...
    </div>
  );
}
