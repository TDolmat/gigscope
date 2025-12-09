import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateForChart } from '@/lib/dateUtils';

interface ChartDataPoint {
  date: string;
  count: number;
}

interface DashboardChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
}

/**
 * Reusable chart component for dashboard
 */
export function DashboardChart({ title, data, color }: DashboardChartProps) {
  return (
    <div className="bg-[#2B2E33] rounded-[1rem] border border-white/10 p-4 sm:p-6">
      <h3 className="text-sm sm:text-lg font-semibold text-white mb-3 sm:mb-4">
        {title}
      </h3>
      <div className="h-[200px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDateForChart}
              stroke="rgba(255,255,255,0.4)"
              style={{ fontSize: '10px' }}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)" 
              style={{ fontSize: '10px' }} 
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
              width={30} 
            />
            <Tooltip 
              labelFormatter={formatDateForChart}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)', 
                backgroundColor: '#2B2E33',
                color: '#FFFFFF',
                fontSize: '12px' 
              }}
              labelStyle={{ color: '#FFFFFF' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={color} 
              strokeWidth={2}
              fill={color}
              fillOpacity={0.15}
              dot={{ fill: color, r: 3, fillOpacity: 1 }}
              activeDot={{ r: 5, fillOpacity: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
