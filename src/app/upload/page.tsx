'use client';

import DropZone from '@/components/upload/DropZone';
import { Download } from 'lucide-react';

export default function UploadPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-hilton-blue">Upload Scorecard</h1>
          <p className="text-gray-500 mt-1">Upload a completed evaluation scorecard (CSV, Excel, or PDF)</p>
        </div>
        <a
          href="/templates/scorecard-template.pdf"
          download
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Download Template
        </a>
      </div>

      <DropZone />

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-3">Required Columns</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">trainer_name</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">trainer_department</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">hotel_code</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">manager_name</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">manager_department</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">evaluation_date</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_work_area</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_appearance</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_body_language</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_voice</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_attention</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_preparation</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_demonstration</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_practice</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_follow_through</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">score_question_techniques</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">strengths</span>
          <span className="font-mono bg-gray-50 px-2 py-1 rounded">development_areas</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Optional: notes_work_area, notes_appearance, notes_body_language, notes_voice, notes_attention, notes_preparation, notes_demonstration, notes_practice, notes_follow_through, notes_question_techniques
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Hotel codes: AMSCS, AMSAP, AMSHI, AMSWA, AMSHH, RTMHI, SPLSO, ANRHI. Scores must be 1-5.
        </p>
      </div>
    </div>
  );
}
