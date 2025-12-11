'use client';

import { useState, useEffect } from 'react';
import { adminDashboardApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { Users, Mail, FileText, TrendingUp } from 'lucide-react';
import { PageHeader, PageLoader, StatCard, DashboardChart } from '@/components/admin';

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

export default function DashboardPage() {
  const { authenticatedFetch } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardApi.getStats(authenticatedFetch);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Nie udało się pobrać statystyk');
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
          title="Wysłane maile (ostatnie 30 dni)"
          data={stats.timeseries.sent_emails}
          color="#F1E388"
        />
        <DashboardChart
          title="Scrapowane oferty dziennie (ostatnie 30 dni)"
          data={stats.timeseries.scraped_offers}
          color="#F97316"
        />
        <DashboardChart
          title="Subskrypcje AI Scoper (ostatnie 30 dni)"
          data={stats.timeseries.scoper_subscriptions}
          color="#E5D77A"
        />
      </div>
    </div>
  );
}
