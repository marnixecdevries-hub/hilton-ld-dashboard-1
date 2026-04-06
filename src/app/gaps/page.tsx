'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import FilterBar from '@/components/layout/FilterBar';
import { supabase } from '@/lib/supabase';
import { Evaluation, ScoreCriterion, HotelCode } from '@/types';
import { SCORE_FIELDS, CRITERIA_LABELS, HOTEL_CODES, HOTELS, CATEGORY_CRITERIA, CATEGORY_LABELS, COLORS } from '@/lib/constants';
import { getScoreBgHex, getScoreColor } from '@/lib/utils';
import Link from 'next/link';

function GapsContent() {
  const searchParams = useSearchParams();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase.from('evaluations').select('*');

      const hotels = searchParams.get('hotels')?.split(',').filter(Boolean);
      const department = searchParams.get('department');
      const dateFrom = searchParams.get('from');
      const dateTo = searchParams.get('to');

      if (hotels?.length) query = query.in('hotel_code', hotels);
      if (department) query = query.ilike('trainer_department', `%${department}%`);
      if (dateFrom) query = query.gte('evaluation_date', dateFrom);
      if (dateTo) query = query.lte('evaluation_date', dateTo);

      const { data } = await query;
      setEvaluations(data || []);
      setLoading(false);
    }

    async function fetchDepartments() {
      const { data } = await supabase.from('evaluations').select('trainer_department');
      if (data) setDepartments([...new Set(data.map(d => d.trainer_department))].sort());
    }

    fetchData();
    fetchDepartments();
  }, [searchParams]);

  // Criterion averages, sorted ascending (weakest first)
  const criterionAvgs = SCORE_FIELDS.map(criterion => {
    const key = `score_${criterion}` as keyof Evaluation;
    const avg = evaluations.length > 0
      ? evaluations.reduce((s, e) => s + Number(e[key]), 0) / evaluations.length
      : 0;
    return {
      criterion: CRITERIA_LABELS[criterion],
      criterionKey: criterion,
      avg: Number(avg.toFixed(2)),
    };
  }).sort((a, b) => a.avg - b.avg);

  // Heatmap: hotel x criterion
  const heatmapData = HOTEL_CODES.map(code => {
    const hotelEvals = evaluations.filter(e => e.hotel_code === code);
    if (hotelEvals.length === 0) return null;
    const criteria = Object.fromEntries(
      SCORE_FIELDS.map(f => {
        const key = `score_${f}` as keyof Evaluation;
        const avg = hotelEvals.reduce((s, e) => s + Number(e[key]), 0) / hotelEvals.length;
        return [f, Number(avg.toFixed(2))];
      })
    );
    return { hotel_code: code, ...criteria };
  }).filter(Boolean) as (Record<string, number | string>)[];

  // Score distribution per category
  const getCategoryDistribution = (categoryKey: keyof typeof CATEGORY_CRITERIA) => {
    const criteria = CATEGORY_CRITERIA[categoryKey];
    const counts = [0, 0, 0, 0, 0]; // for scores 1-5
    for (const e of evaluations) {
      for (const c of criteria) {
        const val = Number(e[`score_${c}` as keyof Evaluation]);
        if (val >= 1 && val <= 5) counts[val - 1]++;
      }
    }
    const total = counts.reduce((a, b) => a + b, 0);
    return [
      { name: '1 - Poor', value: counts[0], fill: '#ef4444' },
      { name: '2 - Basic', value: counts[1], fill: '#fb923c' },
      { name: '3 - Good', value: counts[2], fill: '#fde047' },
      { name: '4 - Very Good', value: counts[3], fill: '#86efac' },
      { name: '5 - Excellent', value: counts[4], fill: '#22c55e' },
    ].filter(d => d.value > 0);
  };

  // Bottom performers
  const trainerMap = new Map<string, Evaluation[]>();
  for (const e of evaluations) {
    if (!trainerMap.has(e.trainer_name)) trainerMap.set(e.trainer_name, []);
    trainerMap.get(e.trainer_name)!.push(e);
  }

  const bottomTrainers = Array.from(trainerMap.entries())
    .map(([name, evals]) => {
      const avg = evals.reduce((s, e) => s + Number(e.avg_overall), 0) / evals.length;
      // Find weakest criterion
      let weakest = { criterion: '', score: 5 };
      for (const c of SCORE_FIELDS) {
        const cAvg = evals.reduce((s, e) => s + Number(e[`score_${c}` as keyof Evaluation]), 0) / evals.length;
        if (cAvg < weakest.score) weakest = { criterion: c, score: cAvg };
      }
      return {
        name,
        hotel: evals[0].hotel_code,
        avg_overall: Number(avg.toFixed(2)),
        count: evals.length,
        weakest_criterion: CRITERIA_LABELS[weakest.criterion as ScoreCriterion],
        weakest_score: Number(weakest.score.toFixed(2)),
      };
    })
    .filter(t => t.avg_overall < 3.5)
    .sort((a, b) => a.avg_overall - b.avg_overall);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hilton-blue">Gaps Analysis</h1>
        <p className="text-gray-500 mt-1">Identify strengths and areas for improvement</p>
      </div>

      <FilterBar departments={departments} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          No data available
        </div>
      ) : (
        <>
          {/* Ranked bar chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Criteria Ranked by Average Score (Lowest First)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={criterionAvgs} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="criterion" tick={{ fontSize: 11 }} width={130} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(value) => [Number(value).toFixed(2), 'Avg Score']} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {criterionAvgs.map((entry, index) => (
                    <Cell key={index} fill={getScoreBgHex(entry.avg)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Hotel x Criteria Heatmap</h3>
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
                  {heatmapData.map((h) => (
                    <tr key={h.hotel_code as string} className="border-t border-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">{h.hotel_code as string}</td>
                      {SCORE_FIELDS.map(f => {
                        const score = h[f] as number;
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

          {/* Score distribution doughnuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {(Object.keys(CATEGORY_CRITERIA) as (keyof typeof CATEGORY_CRITERIA)[]).map(cat => (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{CATEGORY_LABELS[cat]} Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getCategoryDistribution(cat)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {getCategoryDistribution(cat).map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {/* Bottom performers */}
          {bottomTrainers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Trainers Needing Attention (Avg Below 3.5)</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Trainer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Hotel</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Evaluations</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Avg Score</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Weakest Area</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomTrainers.map(t => (
                    <tr key={t.name} className="border-b border-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/trainers/${encodeURIComponent(t.name)}`} className="text-hilton-blue hover:underline font-medium">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.hotel}</td>
                      <td className="text-center px-4 py-3 text-gray-600">{t.count}</td>
                      <td className="text-center px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(t.avg_overall)}`}>
                          {t.avg_overall.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {t.weakest_criterion} ({t.weakest_score.toFixed(1)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GapsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" /></div>}>
      <GapsContent />
    </Suspense>
  );
}
