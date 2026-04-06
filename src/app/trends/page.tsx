'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import FilterBar from '@/components/layout/FilterBar';
import { supabase } from '@/lib/supabase';
import { Evaluation, HotelCode } from '@/types';
import { HOTEL_CODES, HOTELS, COLORS, CATEGORY_LABELS, SCORE_FIELDS, CRITERIA_LABELS } from '@/lib/constants';
import { ScoreCategory, ScoreCriterion } from '@/types';

function TrendsContent() {
  const searchParams = useSearchParams();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelCode | 'all'>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase.from('evaluations').select('*').order('evaluation_date', { ascending: true });

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
      const { data } = await supabase.from('evaluations').select('trainer_department');
      if (data) setDepartments([...new Set(data.map(d => d.trainer_department))].sort());
    }

    fetchData();
    fetchDepartments();
  }, [searchParams]);

  // Group evaluations by month
  const getMonth = (dateStr: string) => dateStr.substring(0, 7); // YYYY-MM

  // Monthly trend per hotel
  const monthlyByHotel = () => {
    const months = [...new Set(evaluations.map(e => getMonth(e.evaluation_date)))].sort();
    return months.map(month => {
      const monthData: Record<string, number | string> = { month };
      for (const code of HOTEL_CODES) {
        const hotelMonthEvals = evaluations.filter(e => e.hotel_code === code && getMonth(e.evaluation_date) === month);
        if (hotelMonthEvals.length > 0) {
          monthData[code] = Number((hotelMonthEvals.reduce((s, e) => s + Number(e.avg_overall), 0) / hotelMonthEvals.length).toFixed(2));
        }
      }
      return monthData;
    });
  };

  // Monthly trend by category for selected hotel
  const monthlyByCategory = () => {
    const filtered = selectedHotel === 'all' ? evaluations : evaluations.filter(e => e.hotel_code === selectedHotel);
    const months = [...new Set(filtered.map(e => getMonth(e.evaluation_date)))].sort();
    return months.map(month => {
      const monthEvals = filtered.filter(e => getMonth(e.evaluation_date) === month);
      return {
        month,
        Presentation: Number((monthEvals.reduce((s, e) => s + Number(e.avg_presentation), 0) / monthEvals.length).toFixed(2)),
        Delivery: Number((monthEvals.reduce((s, e) => s + Number(e.avg_delivery), 0) / monthEvals.length).toFixed(2)),
        Coaching: Number((monthEvals.reduce((s, e) => s + Number(e.avg_coaching), 0) / monthEvals.length).toFixed(2)),
      };
    });
  };

  // Small multiples by criterion
  const monthlyCriterion = (criterion: string) => {
    const filtered = selectedHotel === 'all' ? evaluations : evaluations.filter(e => e.hotel_code === selectedHotel);
    const months = [...new Set(filtered.map(e => getMonth(e.evaluation_date)))].sort();
    return months.map(month => {
      const monthEvals = filtered.filter(e => getMonth(e.evaluation_date) === month);
      const scoreKey = `score_${criterion}` as keyof Evaluation;
      return {
        month,
        score: Number((monthEvals.reduce((s, e) => s + Number(e[scoreKey]), 0) / monthEvals.length).toFixed(2)),
      };
    });
  };

  const activeHotels = HOTEL_CODES.filter(code => evaluations.some(e => e.hotel_code === code));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hilton-blue">Trend Analysis</h1>
        <p className="text-gray-500 mt-1">Track performance changes over time</p>
      </div>

      <FilterBar departments={departments} />

      {/* Hotel selector for category/criterion views */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-500">Focus on:</label>
        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value as HotelCode | 'all')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-hilton-blue focus:ring-1 focus:ring-hilton-blue outline-none"
        >
          <option value="all">All Hotels</option>
          {activeHotels.map(code => (
            <option key={code} value={code}>{code} — {HOTELS[code]}</option>
          ))}
        </select>
      </div>

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
          {/* Multi-line: overall per hotel per month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Overall Score Trend by Hotel</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyByHotel()} margin={{ left: 10, right: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Legend />
                {activeHotels.map((code, i) => (
                  <Line key={code} type="monotone" dataKey={code} stroke={COLORS.chartColors[i % COLORS.chartColors.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Category Trend {selectedHotel !== 'all' ? `— ${selectedHotel}` : '— All Hotels'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyByCategory()} margin={{ left: 10, right: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Legend />
                <Line type="monotone" dataKey="Presentation" stroke="#002F61" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Delivery" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Coaching" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Small multiples - per criterion */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Individual Criteria Trends {selectedHotel !== 'all' ? `— ${selectedHotel}` : '— All Hotels'}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {SCORE_FIELDS.map(criterion => (
                <div key={criterion} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 truncate" title={CRITERIA_LABELS[criterion]}>
                    {CRITERIA_LABELS[criterion]}
                  </p>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={monthlyCriterion(criterion)}>
                      <YAxis domain={[0, 5]} hide />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="score" stroke="#002F61" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" /></div>}>
      <TrendsContent />
    </Suspense>
  );
}
