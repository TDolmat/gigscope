import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorScheme: 'blue' | 'green' | 'purple' | 'orange';
}

const colorSchemes = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
};

/**
 * Statistics card for dashboard
 */
export function StatCard({ title, value, icon: Icon, colorScheme }: StatCardProps) {
  const colors = colorSchemes[colorScheme];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="order-2 sm:order-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {value}
          </p>
        </div>
        <div className={`${colors.bg} p-2 sm:p-3 rounded-lg w-fit order-1 sm:order-2`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}

