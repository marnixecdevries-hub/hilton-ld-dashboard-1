'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseFile } from '@/lib/parseUpload';
import { submitMultipleEvaluations } from '@/lib/actions';
import { ParsedEvaluation, ValidationError } from '@/types';
import { CRITERIA_LABELS, HOTELS } from '@/lib/constants';
import { HotelCode, ScoreCriterion } from '@/types';

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedEvaluation[] | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setErrors([]);
    setParsed(null);
    setSubmitStatus('idle');

    const result = await parseFile(file);
    setLoading(false);

    if (result.success && result.data) {
      setParsed(result.data);
    } else {
      setErrors(result.errors || []);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!parsed) return;
    setSubmitStatus('submitting');

    const result = await submitMultipleEvaluations(parsed);
    if (result.success) {
      setSubmitStatus('success');
      setSubmitMessage(`Successfully uploaded ${result.count} evaluation(s)`);
      setParsed(null);
    } else {
      setSubmitStatus('error');
      setSubmitMessage(result.error || 'Upload failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-hilton-blue bg-hilton-blue/5' : 'border-gray-300 bg-white hover:border-hilton-blue/50'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.xlsx,.xls';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        {loading ? (
          <Loader2 size={48} className="mx-auto text-hilton-blue animate-spin" />
        ) : (
          <Upload size={48} className="mx-auto text-gray-400" />
        )}
        <p className="mt-4 text-gray-600 font-medium">
          {loading ? 'Parsing file...' : 'Drag your scorecard file here or click to browse'}
        </p>
        <p className="text-sm text-gray-400 mt-2">Accepts .csv and .xlsx files</p>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-red-500" />
            <h3 className="font-semibold text-red-700">Validation Errors</h3>
          </div>
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-600">
                <span className="font-mono text-xs bg-red-100 px-1 rounded">{err.field}</span>{' '}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {parsed && parsed.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={20} />
            Preview ({parsed.length} evaluation{parsed.length > 1 ? 's' : ''})
          </h3>
          <div className="space-y-4">
            {parsed.map((ev, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-gray-400">Trainer</span>
                    <p className="font-medium text-sm">{ev.trainer_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Hotel</span>
                    <p className="font-medium text-sm">{ev.hotel_code} — {HOTELS[ev.hotel_code as HotelCode] || ev.hotel_code}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Date</span>
                    <p className="font-medium text-sm">{ev.evaluation_date}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Department</span>
                    <p className="font-medium text-sm">{ev.trainer_department}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Manager</span>
                    <p className="font-medium text-sm">{ev.manager_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                    <div key={key} className="text-center">
                      <p className="text-xs text-gray-400 truncate" title={label}>{label}</p>
                      <p className="text-lg font-bold text-hilton-blue">
                        {ev[`score_${key}` as keyof ParsedEvaluation] as number}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-xs text-gray-400">Strengths</span>
                    <p className="text-sm text-gray-700 mt-1">{ev.strengths}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Development Areas</span>
                    <p className="text-sm text-gray-700 mt-1">{ev.development_areas}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitStatus === 'submitting'}
            className="mt-6 w-full bg-hilton-blue text-white py-3 rounded-lg font-medium hover:bg-hilton-blue-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitStatus === 'submitting' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit {parsed.length} Evaluation{parsed.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Submit status */}
      {submitStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-500" />
          <p className="text-green-700 font-medium">{submitMessage}</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <p className="text-red-700">{submitMessage}</p>
        </div>
      )}
    </div>
  );
}
