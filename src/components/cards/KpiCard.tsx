'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  previousValue?: number;
  currentValue?: number;
}

export default function KpiCard({ title, value, subtitle, previousValue, currentValue }: KpiCardProps) {
  let trend: 'up' | 'down' | 'flat' | null = null;
  let trendValue = '';

  if (previousValue !== undefined && currentValue !== undefined && previousValue > 0) {
    const diff = currentValue - previousValue;
    if (diff > 0.05) {
      trend = 'up';
      trendValue = `+${diff.toFixed(2)}`;
    } else if (diff < -0.05) {
      trend = 'down';
      trendValue = diff.toFixed(2);
    } else {
      trend = 'flat';
      trendValue = '0.00';
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-hilton-blue mt-2">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
          }`}>
            {trend === 'up' && <TrendingUp size={14} />}
            {trend === 'down' && <TrendingDown size={14} />}
            {trend === 'flat' && <Minus size={14} />}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
