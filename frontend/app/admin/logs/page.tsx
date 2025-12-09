'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { adminLogsApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin';
import { formatDateTime } from '@/lib/dateUtils';
import { Search, Mail, FileText, AlertCircle } from 'lucide-react';

interface ScrapeLogEntry {
  id: number;
  executed_at: string;
  duration_millis: number;
  total_users: number;
  successful_scrapes: number;
  failed_scrapes: number;
  total_offers_scraped: number;
  errors: Array<{ user_id: number; email: string; error: string }>;
}

interface MailLogEntry {
  id: number;
  executed_at: string;
  subscribed_total: number;
  subscribed_sent: number;
  subscribed_failed: number;
  subscribed_skipped: number;
  subscribed_errors: Array<{ email: string; error: string }>;
  expired_total: number;
  expired_sent: number;
  expired_failed: number;
  expired_errors: Array<{ email: string; error: string }>;
  never_subscribed_total: number;
  never_subscribed_sent: number;
  never_subscribed_failed: number;
  never_subscribed_errors: Array<{ email: string; error: string }>;
}

export default function LogsPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [mailLogs, setMailLogs] = useState<MailLogEntry[]>([]);
  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLogEntry[]>([]);

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const fetchAllLogs = async () => {
    try {
      setLoading(true);
      
      const [mailResult, scrapeResult] = await Promise.all([
        adminLogsApi.getMailLogs(1, 50, authenticatedFetch),
        adminLogsApi.getScrapeLogs(1, 50, authenticatedFetch)
      ]);
      
      setMailLogs(mailResult.logs);
      setScrapeLogs(scrapeResult.logs);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      // Log more details about the error
      if (error?.status) {
        console.error(`API returned status: ${error.status}`);
      }
      if (error?.message) {
        console.error(`Error message: ${error.message}`);
      }
      // Don't show error toast if logs are just empty (404 might be OK if no logs exist yet)
      // Only show error if it's a real error (not 404 with empty response)
      if (error?.status !== 404) {
        toast.error('Nie udało się pobrać logów');
      }
      // Set empty arrays on error to show empty state
      setMailLogs([]);
      setScrapeLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Logi operacji" 
          description="Historia scrapowania ofert i wysyłki emaili"
        />
        <div className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 flex items-center justify-center" style={{ height: '40vh' }}>
          <svg className="animate-spin h-8 w-8 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-180px)]">
      <PageHeader 
        title="Logi operacji" 
        description="Historia scrapowania ofert i wysyłki emaili"
      />
      
      <div className="space-y-4">
        {/* Scrape Logs Section */}
        <div 
          className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 overflow-hidden"
          style={{ height: '38vh', minHeight: '280px' }}
        >
          {/* Section Header - fixed */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 bg-cards-background">
            <div className="p-2 bg-yellow-400/10 rounded-lg">
              <Search className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-base font-bold text-white">Logi scrapowania</h3>
          </div>
          
          {/* Table wrapper - scrollable both directions */}
          <div style={{ height: 'calc(38vh - 60px)', minHeight: '220px', overflow: 'auto' }}>
            {scrapeLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">Brak logów scrapowania</p>
              </div>
            ) : (
              <table style={{ minWidth: '600px', width: '100%' }}>
                <thead className="bg-gray-800 sticky top-0" style={{ zIndex: 10 }}>
                  <tr className="border-b-2 border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800" style={{ width: '180px' }}>
                      Data i godzina
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Czas trwania
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Użytkownicy
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Oferty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scrapeLogs.map((log, index) => {
                    const durationSeconds = Math.round((log.duration_millis || 0) / 1000);
                    const successRate = log.total_users > 0 ? log.successful_scrapes / log.total_users : 1;
                    const formattedErrors = log.errors.map(e => ({ email: e.email, error: e.error }));
                    const isLast = index === scrapeLogs.length - 1;
                    
                    return (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gray-700/50 transition-colors ${!isLast ? 'border-b border-gray-700' : ''}`}
                      >
                        <td className="px-5 py-3 text-sm text-white font-medium whitespace-nowrap" style={{ width: '180px' }}>
                          {formatDateTime(log.executed_at)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm text-gray-300 bg-gray-700 px-3 py-1.5 rounded-lg font-medium">
                            {durationSeconds}s
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusCell
                            sent={log.successful_scrapes}
                            total={log.total_users}
                            successRate={successRate}
                            errors={formattedErrors}
                          />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm font-bold text-white">{log.total_offers_scraped}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mail Logs Section */}
        <div 
          className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 overflow-hidden"
          style={{ height: '40vh', minHeight: '280px' }}
        >
          {/* Section Header - fixed */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 bg-cards-background">
            <div className="p-2 bg-yellow-400/10 rounded-lg">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-base font-bold text-white">Logi wysyłki emaili</h3>
          </div>
          
          {/* Table wrapper - scrollable both directions */}
          <div style={{ height: 'calc(40vh - 60px)', minHeight: '220px', overflow: 'auto' }}>
            {mailLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">Brak logów wysyłki</p>
              </div>
            ) : (
              <table style={{ minWidth: '800px', width: '100%' }}>
                <thead className="bg-gray-800 sticky top-0" style={{ zIndex: 10 }}>
                  <tr className="border-b-2 border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800" style={{ width: '180px' }}>
                      Data i godzina
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Razem
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Subskrybenci
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Wygaśli
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-800">
                      Bez subskrypcji
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mailLogs.map((log, index) => {
                    const totalSent = log.subscribed_sent + log.expired_sent + log.never_subscribed_sent;
                    const totalSkipped = log.subscribed_skipped || 0;
                    const totalAttempted = (log.subscribed_total - totalSkipped) + log.expired_total + log.never_subscribed_total;
                    const totalSuccessRate = totalAttempted > 0 ? totalSent / totalAttempted : 1;
                    const isLast = index === mailLogs.length - 1;
                    
                    return (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gray-700/50 transition-colors ${!isLast ? 'border-b border-gray-700' : ''}`}
                      >
                        <td className="px-5 py-3 text-sm text-white font-medium whitespace-nowrap" style={{ width: '180px' }}>
                          {formatDateTime(log.executed_at)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusCell
                            sent={totalSent}
                            total={totalAttempted}
                            skipped={totalSkipped}
                            successRate={totalSuccessRate}
                            errors={[...log.subscribed_errors, ...log.expired_errors, ...log.never_subscribed_errors]}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <StatusCell
                            sent={log.subscribed_sent}
                            total={log.subscribed_total - log.subscribed_skipped}
                            skipped={log.subscribed_skipped}
                            successRate={
                              (log.subscribed_total - log.subscribed_skipped) > 0 
                                ? log.subscribed_sent / (log.subscribed_total - log.subscribed_skipped) 
                                : 1
                            }
                            errors={log.subscribed_errors}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <StatusCell
                            sent={log.expired_sent}
                            total={log.expired_total}
                            successRate={log.expired_total > 0 ? log.expired_sent / log.expired_total : 1}
                            errors={log.expired_errors}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <StatusCell
                            sent={log.never_subscribed_sent}
                            total={log.never_subscribed_total}
                            successRate={log.never_subscribed_total > 0 ? log.never_subscribed_sent / log.never_subscribed_total : 1}
                            errors={log.never_subscribed_errors}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Status Cell with Dot ====================

interface StatusCellProps {
  sent: number;
  total: number;
  skipped?: number;
  successRate: number;
  errors: Array<{ email: string; error: string }>;
}

function StatusCell({ sent, total, skipped, successRate, errors }: StatusCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const dotRef = useRef<HTMLSpanElement>(null);
  
  // Ensure portal only renders after mount (fixes RSC 404 in production)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  let dotBgColor = '#22c55e';
  if (total > 0 && successRate < 1) {
    dotBgColor = successRate > 0.5 ? '#eab308' : '#ef4444';
  }
  
  const groupedErrors = errors.reduce((acc, err) => {
    const key = err.error || 'Nieznany błąd';
    if (!acc[key]) {
      acc[key] = { count: 0, emails: [] };
    }
    acc[key].count++;
    acc[key].emails.push(err.email);
    return acc;
  }, {} as Record<string, { count: number; emails: string[] }>);
  
  const hasErrors = errors.length > 0;
  const failed = total - sent;
  const hasSkipped = (skipped || 0) > 0;
  const canShowTooltip = hasErrors || hasSkipped;

  const handleMouseEnter = () => {
    if (canShowTooltip && dotRef.current) {
      const rect = dotRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
      setShowTooltip(true);
    }
  };
  
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Dot */}
      <span
        ref={dotRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ 
          display: 'inline-block',
          width: '14px', 
          height: '14px', 
          borderRadius: '50%',
          backgroundColor: dotBgColor,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          cursor: canShowTooltip ? 'pointer' : 'default',
          transition: 'transform 0.15s',
          flexShrink: 0,
        }}
        onMouseOver={(e) => canShowTooltip && (e.currentTarget.style.transform = 'scale(1.25)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />
      
      {/* Tooltip via Portal */}
      {isMounted && showTooltip && createPortal(
        <div 
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{ 
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            backgroundColor: '#111827',
            color: '#ffffff',
            padding: '14px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #374151',
            minWidth: '250px',
            maxWidth: '400px',
          }}
        >
          {/* Skipped info */}
          {hasSkipped && (
            <div style={{ 
              marginBottom: hasErrors ? '12px' : 0, 
              paddingBottom: hasErrors ? '12px' : 0, 
              borderBottom: hasErrors ? '1px solid #4b5563' : 'none' 
            }}>
              Pominięte (brak ofert): <strong>{skipped}</strong>
            </div>
          )}
          
          {/* Errors */}
          {hasErrors && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertCircle style={{ width: '18px', height: '18px', color: '#f87171', flexShrink: 0 }} />
                <span style={{ fontWeight: 700 }}>{errors.length} {errors.length === 1 ? 'błąd' : 'błędów'}</span>
              </div>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(groupedErrors).map(([error, data], index) => (
                  <div 
                    key={index} 
                    style={{ 
                      backgroundColor: '#1f2937', 
                      borderRadius: '6px', 
                      padding: '10px 12px',
                      marginBottom: index < Object.keys(groupedErrors).length - 1 ? '8px' : 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                        color: '#fca5a5', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {data.count}x
                      </span>
                      <span style={{ 
                        color: '#e5e7eb', 
                        fontSize: '13px', 
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                      }}>
                        {error}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Arrow */}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #111827',
            }}
          />
        </div>,
        document.body
      )}
      
      {/* Numbers */}
      <span className="text-sm text-white">
        <span className="font-bold">{sent}</span>
        <span className="text-gray-500 font-medium">/{total}</span>
      </span>
    </div>
  );
}
