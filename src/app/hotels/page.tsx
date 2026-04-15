'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import FilterBar from '@/components/layout/FilterBar';
import { getSupabase } from '@/lib/supabase';
import { Evaluation } from '@/types';
import { HOTEL_CODES, HOTELS, SCORE_FIELDS, CRITERIA_LABELS } from '@/lib/constants';
import { getScoreBgHex } from '@/lib/utils';

function HotelsContent() {
  const searchParams = useSearchParams();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = getSupabase().from('evaluations').select('*');

      const department = searchParams.get('department');
      const dateFrom = searchParams.get('from');
      const dateTo = searchParams.get('to');

      if (department) query = query.ilike('trainer_department', `%${department}%`);
      if (dateFrom) query = query.gte('evaluation_date', dateFrom);
      if (dateTo) query = query.lte('evaluation_date', dateTo);

      const { data } = await query;
      setEvaluations(data || []);
      setLoading(false);
    }

    async function fetchDepartments() {
      const { data } = await getSupabase().from('evaluations').select('trainer_department');
      if (data) setDepartments([...new Set(data.map(d => d.trainer_department))].sort());
    }

    fetchData();
    fetchDepartments();
  }, [searchParams]);

  interface HotelStat {
    hotel_code: string;
    hotel_name: string;
    count: number;
    avg_presentation: number;
    avg_delivery: number;
    avg_coaching: number;
    avg_overall: number;
    criteria: Record<string, number>;
  }

  // Group by hotel
  const hotelStats = HOTEL_CODES.map(code => {
    const hotelEvals = evaluations.filter(e => e.hotel_code === code);
    if (hotelEvals.length === 0) return null;

    const avg = (field: string) =>
      hotelEvals.reduce((sum, e) => sum + Number(e[field as keyof Evaluation]), 0) / hotelEvals.length;

    return {
      hotel_code: code,
      hotel_name: HOTELS[code],
      count: hotelEvals.length,
      avg_presentation: Number(avg('avg_presentation').toFixed(2)),
      avg_delivery: Number(avg('avg_delivery').toFixed(2)),
      avg_coaching: Number(avg('avg_coaching').toFixed(2)),
      avg_overall: Number(avg('avg_overall').toFixed(2)),
      criteria: Object.fromEntries(
        SCORE_FIELDS.map(f => [f, Number(avg(`score_${f}`).toFixed(2))])
      ),
    };
  }).filter(h => h !== null);

  const sortedByOverall = [...hotelStats].sort((a, b) => b.avg_overall - a.avg_overall);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hilton-blue">Hotel Comparison</h1>
        <p className="text-gray-500 mt-1">Benchmark performance across hotels</p>
      </div>

      <FilterBar departments={departments} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" />
        </div>
      ) : hotelStats.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          No data available
        </div>
      ) : (
        <>
          {/* Grouped bar chart - categories per hotel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Averages by Hotel</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hotelStats} margin={{ left: 10, right: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hotel_code" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Legend />
                <Bar dataKey="avg_presentation" name="Presentation" fill="#002F61" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="avg_delivery" name="Delivery" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="avg_coaching" name="Coaching" fill="#0891b2" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Skills Heatmap</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Hotel</th>
                    {SCORE_FIELDS.map(f => (
                      <th key={f} className="text-center px-2 py-2 font-medium text-gray-500 min-w-[80px]">
                        <span className="block truncate" title={CRITERIA_LABELS[f]}>{CRITERIA_LABELS[f]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hotelStats.map((h) => (
                    <tr key={h.hotel_code} className="border-t border-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">{h.hotel_code}</td>
                      {SCORE_FIELDS.map(f => {
                        const score = h.criteria[f];
                        return (
                          <td key={f} className="text-center px-2 py-2">
                            <span
                              className="inline-block px-2 py-1 rounded text-xs font-bold min-w-[40px]"
                              style={{ backgroundColor: getScoreBgHex(score), color: score < 3.5 && score >= 2 ? '#1a1a1a' : '#fff' }}
                            >
                              {score.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ranking table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Hotel Rankings</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Rank</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hotel</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Evaluations</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Presentation</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Delivery</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Coaching</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Overall</th>
                </tr>
              </thead>
              <tbody>
                {sortedByOverall.map((h, i) => (
                  <tr key={h.hotel_code} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-hilton-blue">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{h.hotel_code}</span>
                      <span className="text-gray-400 text-xs ml-2">{h.hotel_name}</span>
                    </td>
                    <td className="text-center px-4 py-3 text-gray-600">{h.count}</td>
                    <td className="text-center px-4 py-3">{h.avg_presentation.toFixed(2)}</td>
                    <td className="text-center px-4 py-3">{h.avg_delivery.toFixed(2)}</td>
                    <td className="text-center px-4 py-3">{h.avg_coaching.toFixed(2)}</td>
                    <td className="text-center px-4 py-3 font-bold text-hilton-blue">{h.avg_overall.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" /></div>}>
      <HotelsContent />
    </Suspense>
  );
}
