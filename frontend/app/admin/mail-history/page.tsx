'use client';

import { useState, useEffect } from 'react';
import { adminMailHistoryApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageLoader } from '@/components/admin';
import { formatDateTime } from '@/lib/dateUtils';
import { ChevronDown, ChevronRight, Mail, Eye, X, Calendar, Send } from 'lucide-react';

interface MailHistoryDate {
  date: string;
  emails_sent: number;
}

interface SentEmail {
  id: number;
  email_sent_to: string;
  email_title: string;
  sent_at: string;
  user_email: string;
}

interface EmailPreview {
  id: number;
  email_sent_to: string;
  email_title: string;
  email_body: string;
  sent_at: string;
}

export default function MailHistoryPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<MailHistoryDate[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [dateEmails, setDateEmails] = useState<Record<string, SentEmail[]>>({});
  const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set());
  const [previewEmail, setPreviewEmail] = useState<EmailPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const result = await adminMailHistoryApi.getHistory(1, 100, authenticatedFetch);
      setHistory(result.history || []);
    } catch (error) {
      console.error('Error fetching mail history:', error);
      toast.error('Nie udało się pobrać historii wysyłki');
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = async (date: string) => {
    const newExpanded = new Set(expandedDates);
    
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
      setExpandedDates(newExpanded);
    } else {
      newExpanded.add(date);
      setExpandedDates(newExpanded);
      
      // Fetch emails for this date if not already loaded
      if (!dateEmails[date]) {
        try {
          setLoadingDates(prev => new Set(prev).add(date));
          const result = await adminMailHistoryApi.getEmailsByDate(date, authenticatedFetch);
          setDateEmails(prev => ({ ...prev, [date]: result.emails || [] }));
        } catch (error) {
          console.error('Error fetching emails for date:', error);
          toast.error('Nie udało się pobrać maili z tego dnia');
        } finally {
          setLoadingDates(prev => {
            const next = new Set(prev);
            next.delete(date);
            return next;
          });
        }
      }
    }
  };

  const openPreview = async (emailId: number) => {
    try {
      setLoadingPreview(true);
      const result = await adminMailHistoryApi.getEmailPreview(emailId, authenticatedFetch);
      setPreviewEmail(result);
    } catch (error) {
      console.error('Error fetching email preview:', error);
      toast.error('Nie udało się pobrać podglądu maila');
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewEmail(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <PageLoader title="Historia wysyłki" />;
  }

  return (
    <div className="min-h-[calc(100vh-180px)]">
      <PageHeader 
        title="Historia wysyłki" 
        description="Przeglądaj wysłane maile pogrupowane według dat"
      />

      {history.length === 0 ? (
        <div className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 p-8 text-center">
          <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Brak wysłanych maili</h3>
          <p className="text-gray-400">Historia wysyłki pojawi się tutaj po wysłaniu pierwszych maili</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.date}
              className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 overflow-hidden"
            >
              {/* Date header - clickable */}
              <button
                onClick={() => toggleDate(item.date)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-400/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-medium">{formatDate(item.date)}</h3>
                    <p className="text-sm text-gray-400">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-lg">
                    <Send className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{item.emails_sent}</span>
                    <span className="text-gray-400 text-sm">
                      {item.emails_sent === 1 ? 'mail' : 'maili'}
                    </span>
                  </div>
                  {expandedDates.has(item.date) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded email list */}
              {expandedDates.has(item.date) && (
                <div className="border-t border-gray-700">
                  {loadingDates.has(item.date) ? (
                    <div className="p-6 flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : dateEmails[item.date]?.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      Brak danych o mailach z tego dnia
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {dateEmails[item.date]?.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => openPreview(email.id)}
                          className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-gray-700/50 rounded-lg flex-shrink-0">
                              <Mail className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">{email.email_sent_to}</p>
                              <p className="text-sm text-gray-400 truncate">{email.email_title}</p>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {email.sent_at && formatDateTime(email.sent_at).split(' ')[1]}
                            </span>
                          </div>
                          <div className="ml-4 p-2 text-gray-400 group-hover:text-yellow-400 flex-shrink-0">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Email Preview Modal */}
      {(previewEmail || loadingPreview) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={closePreview}
        >
          <div 
            className="bg-[#2B2E33] rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-medium text-white truncate">
                  {loadingPreview ? 'Ładowanie...' : previewEmail?.email_title}
                </h3>
                {previewEmail && (
                  <p className="text-sm text-gray-400">
                    Do: {previewEmail.email_sent_to} • {formatDateTime(previewEmail.sent_at)}
                  </p>
                )}
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-4 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto">
              {loadingPreview ? (
                <div className="p-8 flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : previewEmail?.email_body ? (
                <iframe
                  srcDoc={previewEmail.email_body}
                  className="w-full h-[600px] bg-white"
                  title="Email Preview"
                />
              ) : (
                <div className="p-8 text-center text-gray-400">
                  Brak zawartości maila
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

