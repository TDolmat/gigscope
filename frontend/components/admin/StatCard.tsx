import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorScheme?: 'brand' | 'green' | 'blue' | 'orange';
}

// All cards use brand color for consistency
const brandColors = {
  bg: 'bg-[#F1E388]/10',
  text: 'text-[#F1E388]',
};

/**
 * Statistics card for dashboard
 */
export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  const colors = brandColors;
  
  return (
    <div className="bg-[#2B2E33] rounded-[1rem] border border-white/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="order-2 sm:order-1">
          <p className="text-xs sm:text-sm font-medium text-white/50 leading-tight">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">
            {value}
          </p>
        </div>
        <div className={`${colors.bg} p-2 sm:p-3 rounded-[0.75rem] w-fit order-1 sm:order-2`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
