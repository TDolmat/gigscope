'use client';

import React, { useState } from 'react';
import { LucideIcon, Clock, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { utcToPolishTime } from '@/lib/dateUtils';

type StatusType = 'scheduled' | 'running' | 'completed' | 'sent';

interface StatusCardProps {
  title: string;
  status: StatusType;
  time: string;
  scheduledTime?: string;
  icon: LucideIcon;
  tooltipContent?: React.ReactNode;
}

const statusConfig: Record<StatusType, { label: string; color: string; bgColor: string; icon: LucideIcon }> = {
  scheduled: {
    label: 'Zaplanowany',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    icon: Calendar,
  },
  running: {
    label: 'Uruchomiony',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    icon: Loader2,
  },
  completed: {
    label: 'Zakończony',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    icon: CheckCircle2,
  },
  sent: {
    label: 'Wysłany',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    icon: CheckCircle2,
  },
};

/**
 * Status card for dashboard with hover tooltip
 */
export function StatusCard({ 
  title, 
  status, 
  time, 
  scheduledTime, 
  icon: MainIcon,
  tooltipContent 
}: StatusCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  const getTimeLabel = () => {
    const polishTime = utcToPolishTime(time);
    switch (status) {
      case 'scheduled':
        return `na ${polishTime}`;
      case 'running':
        return `od ${polishTime}`;
      case 'completed':
      case 'sent':
        return `o ${polishTime}`;
      default:
        return polishTime;
    }
  };
  
  return (
    <div 
      className="relative bg-[#2B2E33] rounded-[1rem] border border-white/10 p-4 sm:p-6"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex flex-col gap-3">
        {/* Header with icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#F1E388]/10 p-2 sm:p-2.5 rounded-[0.75rem]">
              <MainIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
            </div>
            <span className="text-sm sm:text-base font-medium text-white">{title}</span>
          </div>
        </div>
        
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{getTimeLabel()}</span>
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && tooltipContent && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-[#1F2125] border border-white/10 rounded-lg shadow-xl p-4 mx-2">
            {tooltipContent}
          </div>
        </div>
      )}
    </div>
  );
}

// Tooltip content components

interface ScrapeTooltipProps {
  totalOffers: number;
  totalUsers: number;
  successful: number;
  failed: number;
  platformBreakdown: Record<string, number>;
}

export function ScrapeTooltip({ totalOffers, totalUsers, successful, failed, platformBreakdown }: ScrapeTooltipProps) {
  const platforms = Object.entries(platformBreakdown);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">Łącznie ofert:</span>
        <span className="font-medium text-white">{totalOffers}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">Użytkownicy:</span>
        <span className="font-medium text-white">{successful}/{totalUsers}</span>
      </div>
      {failed > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Nieudane:</span>
          <span className="font-medium text-red-400">{failed}</span>
        </div>
      )}
      {platforms.length > 0 && (
        <div className="border-t border-white/10 pt-3 mt-3">
          <p className="text-xs text-white/40 mb-2">Podział na platformy:</p>
          <div className="space-y-1.5">
            {platforms.map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between text-xs">
                <span className="text-white/60 capitalize">{platform}</span>
                <span className="font-medium text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {platforms.length === 0 && totalOffers === 0 && (
        <p className="text-xs text-white/40 italic">Brak danych z dzisiejszego scrapingu</p>
      )}
    </div>
  );
}

interface MailTooltipProps {
  totalSent: number;
  totalFailed: number;
  userDetails: Array<{ email: string; offers_count: number }>;
}

export function MailTooltip({ totalSent, totalFailed, userDetails }: MailTooltipProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">Wysłane maile:</span>
        <span className="font-medium text-white">{totalSent}</span>
      </div>
      {totalFailed > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Nieudane:</span>
          <span className="font-medium text-red-400">{totalFailed}</span>
        </div>
      )}
      {userDetails.length > 0 && (
        <div className="border-t border-white/10 pt-3 mt-3">
          <p className="text-xs text-white/40 mb-2">Wysłano do ({userDetails.length}):</p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {userDetails.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2">
                <span className="text-white/60 truncate flex-1" title={user.email}>
                  {user.email}
                </span>
                <span className="font-medium text-white whitespace-nowrap">
                  {user.offers_count} {user.offers_count === 1 ? 'oferta' : user.offers_count < 5 ? 'oferty' : 'ofert'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {userDetails.length === 0 && totalSent === 0 && (
        <p className="text-xs text-white/40 italic">Brak wysłanych maili dzisiaj</p>
      )}
    </div>
  );
}

