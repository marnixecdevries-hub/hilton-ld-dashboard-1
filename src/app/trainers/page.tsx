'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import FilterBar from '@/components/layout/FilterBar';
import { getSupabase } from '@/lib/supabase';
import { Evaluation, HotelCode } from '@/types';
import { getScoreColor } from '@/lib/utils';

function TrainersContent() {
  const searchParams = useSearchParams();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = getSupabase().from('evaluations').select('*').order('evaluation_date', { ascending: false });

      const hotels = searchParams.get('hotels')?.split(',').filter(Boolean);
      const department = searchParams.get('department');

      if (hotels?.length) query = query.in('hotel_code', hotels);
      if (department) query = query.ilike('trainer_department', `%${department}%`);

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

  // Group by trainer
  const trainerMap = new Map<string, Evaluation[]>();
  for (const e of evaluations) {
    const key = e.trainer_name;
    if (!trainerMap.has(key)) trainerMap.set(key, []);
    trainerMap.get(key)!.push(e);
  }

  const trainers = Array.from(trainerMap.entries()).map(([name, evals]) => {
    const sorted = [...evals].sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime());
    const latest = sorted[0];
    const avgOverall = evals.reduce((s, e) => s + Number(e.avg_overall), 0) / evals.length;
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (sorted.length >= 2) {
      const diff = Number(sorted[0].avg_overall) - Number(sorted[1].avg_overall);
      trend = diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'flat';
    }

    return {
      name,
      hotel_code: latest.hotel_code as HotelCode,
      department: latest.trainer_department,
      evaluation_count: evals.length,
      latest_overall: Number(latest.avg_overall),
      avg_overall: Number(avgOverall.toFixed(2)),
      trend,
    };
  }).sort((a, b) => b.avg_overall - a.avg_overall);

  const filtered = search
    ? trainers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.department.toLowerCase().includes(search.toLowerCase()))
    : trainers;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hilton-blue">Trainers</h1>
        <p className="text-gray-500 mt-1">View and compare individual trainer performance</p>
      </div>

      <FilterBar departments={departments} />

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by trainer name or department..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-hilton-blue focus:ring-1 focus:ring-hilton-blue outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          No trainers found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Trainer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hotel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Department</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Evaluations</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Avg Score</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Latest</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/trainers/${encodeURIComponent(t.name)}`} className="text-hilton-blue hover:underline font-medium">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.hotel_code}</td>
                  <td className="px-4 py-3 text-gray-600">{t.department}</td>
                  <td className="text-center px-4 py-3 text-gray-600">{t.evaluation_count}</td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(t.avg_overall)}`}>
                      {t.avg_overall.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(t.latest_overall)}`}>
                      {t.latest_overall.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    {t.trend === 'up' && <TrendingUp size={18} className="inline text-green-500" />}
                    {t.trend === 'down' && <TrendingDown size={18} className="inline text-red-500" />}
                    {t.trend === 'flat' && <Minus size={18} className="inline text-gray-400" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TrainersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" /></div>}>
      <TrainersContent />
    </Suspense>
  );
}
