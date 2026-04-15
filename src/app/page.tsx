'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import KpiCard from '@/components/cards/KpiCard';
import HotelBarChart from '@/components/charts/HotelBarChart';
import CriteriaRadarChart from '@/components/charts/CriteriaRadarChart';
import EvaluationTable from '@/components/tables/EvaluationTable';
import FilterBar from '@/components/layout/FilterBar';
import { getSupabase } from '@/lib/supabase';
import { Evaluation } from '@/types';
import { HOTEL_CODES } from '@/lib/constants';

function OverviewContent() {
  const searchParams = useSearchParams();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let query = getSupabase().from('evaluations').select('*').order('evaluation_date', { ascending: false });

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
      const { data } = await getSupabase().from('evaluations').select('trainer_department');
      if (data) {
        setDepartments([...new Set(data.map(d => d.trainer_department))].sort());
      }
    }

    fetchData();
    fetchDepartments();
  }, [searchParams]);

  const totalEvaluations = evaluations.length;
  const avgOverall = totalEvaluations > 0
    ? (evaluations.reduce((sum, e) => sum + Number(e.avg_overall), 0) / totalEvaluations)
    : 0;
  const uniqueTrainers = new Set(evaluations.map(e => e.trainer_name)).size;

  const hotelData = HOTEL_CODES.map(code => {
    const hotelEvals = evaluations.filter(e => e.hotel_code === code);
    return {
      hotel_code: code,
      avg_overall: hotelEvals.length > 0
        ? hotelEvals.reduce((sum, e) => sum + Number(e.avg_overall), 0) / hotelEvals.length
        : 0,
      count: hotelEvals.length,
    };
  }).filter(h => h.count > 0);

  const topHotel = hotelData.length > 0
    ? hotelData.reduce((a, b) => a.avg_overall > b.avg_overall ? a : b)
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hilton-blue">Overview</h1>
        <p className="text-gray-500 mt-1">Train the Trainer evaluation performance at a glance</p>
      </div>

      <FilterBar departments={departments} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" />
        </div>
      ) : totalEvaluations === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-lg">No evaluations found</p>
          <p className="text-gray-300 text-sm mt-2">Upload scorecards to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Total Evaluations" value={totalEvaluations} />
            <KpiCard title="Overall Average" value={avgOverall.toFixed(2)} subtitle="out of 5.00" />
            <KpiCard title="Top Hotel" value={topHotel?.hotel_code || '—'} subtitle={topHotel ? `${topHotel.avg_overall.toFixed(2)} avg` : ''} />
            <KpiCard title="Active Trainers" value={uniqueTrainers} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <HotelBarChart data={hotelData} />
            <CriteriaRadarChart evaluations={evaluations} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Evaluations</h2>
            <EvaluationTable evaluations={evaluations.slice(0, 10)} />
          </div>
        </>
      )}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" /></div>}>
      <OverviewContent />
    </Suspense>
  );
}
