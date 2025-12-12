'use client';

import { useState, useEffect } from 'react';
import { adminDashboardApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { Users, Mail, FileText, TrendingUp, Search } from 'lucide-react';
import { PageHeader, PageLoader, StatCard, StatusCard, ScrapeTooltip, MailTooltip, DashboardChart } from '@/components/admin';

interface DashboardStats {
  summary: {
    active_email_subscribers: number;
    active_befreeclub_subscribers: number;
    total_sent_emails: number;
    total_scraped_offers: number;
  };
  timeseries: {
    sent_emails: Array<{ date: string; count: number }>;
    scraped_offers: Array<{ date: string; count: number }>;
    scoper_subscriptions: Array<{ date: string; count: number }>;
  };
}

interface DashboardStatus {
  scrape: {
    status: 'scheduled' | 'running' | 'completed';
    time: string;
    scheduled_time: string;
    total_offers: number;
    total_users: number;
    successful: number;
    failed: number;
    platform_breakdown: Record<string, number>;
  };
  mail: {
    status: 'scheduled' | 'sent';
    time: string;
    scheduled_time: string;
    total_sent: number;
    total_failed: number;
    user_details: Array<{ email: string; offers_count: number }>;
  };
  frequency: string;
}

export default function DashboardPage() {
  const { authenticatedFetch } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, statusData] = await Promise.all([
        adminDashboardApi.getStats(authenticatedFetch),
        adminDashboardApi.getStatus(authenticatedFetch),
      ]);
      setStats(statsData);
      setStatus(statusData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Nie udało się pobrać danych');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader title="Dashboard" />;
  }

  if (!stats) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="bg-[#2B2E33] rounded-[1rem] border border-white/10 p-8 text-center text-white/50">
          Brak danych do wyświetlenia
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* Today's Status Cards */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatusCard
            title="Status scrapowania"
            status={status.scrape.status}
            time={status.scrape.time}
            scheduledTime={status.scrape.scheduled_time}
            icon={Search}
            tooltipContent={
              <ScrapeTooltip
                totalOffers={status.scrape.total_offers}
                totalUsers={status.scrape.total_users}
                successful={status.scrape.successful}
                failed={status.scrape.failed}
                platformBreakdown={status.scrape.platform_breakdown}
              />
            }
          />
          <StatusCard
            title="Status wysyłki maili"
            status={status.mail.status === 'sent' ? 'sent' : 'scheduled'}
            time={status.mail.time}
            scheduledTime={status.mail.scheduled_time}
            icon={Mail}
            tooltipContent={
              <MailTooltip
                totalSent={status.mail.total_sent}
                totalFailed={status.mail.total_failed}
                userDetails={status.mail.user_details}
              />
            }
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Aktywni subskrybenci maili"
          value={stats.summary.active_email_subscribers}
          icon={Mail}
          colorScheme="brand"
        />
        <StatCard
          title="Subskrybenci BeFreeClub"
          value={stats.summary.active_befreeclub_subscribers}
          icon={Users}
          colorScheme="green"
        />
        <StatCard
          title="Wysłane maile z ofertami"
          value={stats.summary.total_sent_emails}
          icon={TrendingUp}
          colorScheme="brand"
        />
        <StatCard
          title="Zescrapowane oferty"
          value={stats.summary.total_scraped_offers}
          icon={FileText}
          colorScheme="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <DashboardChart
          title="Scrapowane oferty dziennie (ostatnie 30 dni)"
          data={stats.timeseries.scraped_offers}
          color="#F97316"
        />
        <DashboardChart
          title="Wysłane maile (ostatnie 30 dni)"
          data={stats.timeseries.sent_emails}
          color="#F1E388"
        />
        <DashboardChart
          title="Subskrypcje AI Scoper (ostatnie 30 dni)"
          data={stats.timeseries.scoper_subscriptions}
          color="#22C55E"
        />
      </div>
    </div>
  );
}
