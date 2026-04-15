'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import EvaluationTable from '@/components/tables/EvaluationTable';
import { getSupabase } from '@/lib/supabase';
import { Evaluation, ScoreCriterion } from '@/types';
import { SCORE_FIELDS, CRITERIA_LABELS, HOTELS, COLORS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { HotelCode } from '@/types';

export default function TrainerDrilldown({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const trainerName = decodeURIComponent(name);
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [hotelEvaluations, setHotelEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await getSupabase()
        .from('evaluations')
        .select('*')
        .eq('trainer_name', trainerName)
        .order('evaluation_date', { ascending: false });

      const evals = data || [];
      setEvaluations(evals);

      // Fetch hotel peers for comparison
      if (evals.length > 0) {
        const hotelCode = evals[0].hotel_code;
        const { data: hotelData } = await getSupabase()
          .from('evaluations')
          .select('*')
          .eq('hotel_code', hotelCode);
        setHotelEvaluations(hotelData || []);
      }

      setLoading(false);
    }
    fetchData();
  }, [trainerName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hilton-blue" />
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-lg">No evaluations found for {trainerName}</p>
        <button onClick={() => router.back()} className="mt-4 text-hilton-blue hover:underline text-sm">Go back</button>
      </div>
    );
  }

  const latest = evaluations[0];
  const hotelCode = latest.hotel_code as HotelCode;

  // Radar data: latest vs avg vs hotel avg
  const radarData = SCORE_FIELDS.map(criterion => {
    const key = `score_${criterion}` as keyof Evaluation;
    const latestScore = Number(latest[key]);
    const trainerAvg = evaluations.reduce((s, e) => s + Number(e[key]), 0) / evaluations.length;
    const hotelAvg = hotelEvaluations.length > 0
      ? hotelEvaluations.reduce((s, e) => s + Number(e[key]), 0) / hotelEvaluations.length
      : 0;

    return {
      criterion: CRITERIA_LABELS[criterion],
      'Latest Score': Number(latestScore.toFixed(2)),
      'Your Average': Number(trainerAvg.toFixed(2)),
      'Hotel Average': Number(hotelAvg.toFixed(2)),
    };
  });

  // Trend over time
  const sorted = [...evaluations].sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime());
  const trendData = sorted.map(e => ({
    date: e.evaluation_date,
    overall: Number(e.avg_overall),
  }));

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-hilton-blue mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Trainers
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hilton-blue">{trainerName}</h1>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
          <span>{latest.trainer_department}</span>
          <span className="text-gray-300">|</span>
          <span>{hotelCode} — {HOTELS[hotelCode]}</span>
          <span className="text-gray-300">|</span>
          <span>{evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}</span>
          <span className="text-gray-300">|</span>
          <span>{formatDate(evaluations[evaluations.length - 1].evaluation_date)} — {formatDate(latest.evaluation_date)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Skills Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend />
              <Radar name="Latest Score" dataKey="Latest Score" stroke="#002F61" fill="#002F61" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Your Average" dataKey="Your Average" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
              <Radar name="Hotel Average" dataKey="Hotel Average" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.05} strokeWidth={1} strokeDasharray="3 3" />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend line */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData} margin={{ left: 10, right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="overall" name="Overall Score" stroke="#002F61" strokeWidth={3} dot={{ r: 5, fill: '#002F61' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strengths & Development */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-green-700 mb-3">Strengths</h3>
          <div className="space-y-3">
            {evaluations.map(e => (
              <div key={e.id} className="border-l-2 border-green-300 pl-3">
                <p className="text-sm text-gray-700">{e.strengths}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(e.evaluation_date)} — by {e.manager_name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-orange-700 mb-3">Development Areas</h3>
          <div className="space-y-3">
            {evaluations.map(e => (
              <div key={e.id} className="border-l-2 border-orange-300 pl-3">
                <p className="text-sm text-gray-700">{e.development_areas}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(e.evaluation_date)} — by {e.manager_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation history */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Evaluation History</h2>
      <EvaluationTable evaluations={evaluations} showHotel={false} />
    </div>
  );
}
