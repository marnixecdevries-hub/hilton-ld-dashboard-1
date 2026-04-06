'use client';

import { Evaluation } from '@/types';
import { formatDate, getScoreColor } from '@/lib/utils';
import Link from 'next/link';

interface EvaluationTableProps {
  evaluations: Evaluation[];
  showHotel?: boolean;
}

export default function EvaluationTable({ evaluations, showHotel = true }: EvaluationTableProps) {
  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
        No evaluations found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Trainer</th>
              {showHotel && <th className="text-left px-4 py-3 font-medium text-gray-500">Hotel</th>}
              <th className="text-left px-4 py-3 font-medium text-gray-500">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Presentation</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Delivery</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Coaching</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Overall</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/trainers/${encodeURIComponent(e.trainer_name)}`} className="text-hilton-blue hover:underline font-medium">
                    {e.trainer_name}
                  </Link>
                </td>
                {showHotel && <td className="px-4 py-3 text-gray-600">{e.hotel_code}</td>}
                <td className="px-4 py-3 text-gray-600">{e.trainer_department}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(e.evaluation_date)}</td>
                <td className="text-center px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(e.avg_presentation)}`}>
                    {e.avg_presentation.toFixed(2)}
                  </span>
                </td>
                <td className="text-center px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(e.avg_delivery)}`}>
                    {e.avg_delivery.toFixed(2)}
                  </span>
                </td>
                <td className="text-center px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(e.avg_coaching)}`}>
                    {e.avg_coaching.toFixed(2)}
                  </span>
                </td>
                <td className="text-center px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${getScoreColor(e.avg_overall)}`}>
                    {e.avg_overall.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
