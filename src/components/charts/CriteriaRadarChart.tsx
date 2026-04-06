'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CRITERIA_LABELS, COLORS } from '@/lib/constants';
import { Evaluation, ScoreCriterion } from '@/types';
import { SCORE_FIELDS } from '@/lib/constants';

interface CriteriaRadarChartProps {
  evaluations: Evaluation[];
  title?: string;
}

export default function CriteriaRadarChart({ evaluations, title = 'Skills Profile' }: CriteriaRadarChartProps) {
  if (evaluations.length === 0) return null;

  const data = SCORE_FIELDS.map(criterion => {
    const scores = evaluations.map(e => e[`score_${criterion}` as keyof Evaluation] as number);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      criterion: CRITERIA_LABELS[criterion as ScoreCriterion],
      score: Number(avg.toFixed(2)),
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Radar
            name="Average Score"
            dataKey="score"
            stroke={COLORS.hiltonBlue}
            fill={COLORS.hiltonBlue}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
