'use client';

import { useState, useEffect } from 'react';
import { adminDashboardApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Mail, FileText, TrendingUp } from 'lucide-react';

interface DashboardStats {
  summary: {
    active_email_subscribers: number;
    active_circle_subscribers: number;
    total_sent_emails: number;
    total_scraped_offers: number;
  };
  timeseries: {
    sent_emails: Array<{ date: string; count: number }>;
    circle_subscriptions: Array<{ date: string; count: number }>;
    scraped_offers: Array<{ date: string; count: number }>;
    gigscope_subscriptions: Array<{ date: string; count: number }>;
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
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Nie udało się pobrać statystyk');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h2>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h2>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          Brak danych do wyświetlenia
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Active Email Subscribers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">Aktywni subskrybenci maili</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.summary.active_email_subscribers}</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg w-fit order-1 sm:order-2">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Circle Subscribers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">Aktywni subskrybenci Circle</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.summary.active_circle_subscribers}</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg w-fit order-1 sm:order-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Sent Emails */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">Wysłane maile z ofertami</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.summary.total_sent_emails}</p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg w-fit order-1 sm:order-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Scraped Offers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">Zescrapowane oferty</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.summary.total_scraped_offers}</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg w-fit order-1 sm:order-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts - 2x2 Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Sent Emails Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Wysłane maile (ostatnie 30 dni)</h3>
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeseries.sent_emails}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '10px' }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  labelFormatter={formatDate}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circle Subscriptions Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Subskrypcje Circle (ostatnie 30 dni)</h3>
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeseries.circle_subscriptions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '10px' }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  labelFormatter={formatDate}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scraped Offers Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Scrapowane oferty dziennie (ostatnie 30 dni)</h3>
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeseries.scraped_offers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '10px' }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  labelFormatter={formatDate}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GigScope Subscriptions Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Subskrypcje GigScope (ostatnie 30 dni)</h3>
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeseries.gigscope_subscriptions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '10px' }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  labelFormatter={formatDate}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
