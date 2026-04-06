'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLORS } from '@/lib/constants';

interface HotelBarChartProps {
  data: { hotel_code: string; avg_overall: number }[];
}

export default function HotelBarChart({ data }: HotelBarChartProps) {
  const sorted = [...data].sort((a, b) => b.avg_overall - a.avg_overall);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Score by Hotel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="hotel_code" tick={{ fontSize: 12 }} width={55} />
          <Tooltip
            formatter={(value) => [Number(value).toFixed(2), 'Avg Score']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="avg_overall" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {sorted.map((_, index) => (
              <Cell key={index} fill={index === 0 ? COLORS.hiltonBlue : COLORS.hiltonBlueLighter} fillOpacity={index === 0 ? 1 : 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
