'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { HOTELS, HOTEL_CODES } from '@/lib/constants';
import { HotelCode } from '@/types';
import { RotateCcw } from 'lucide-react';

interface FilterBarProps {
  departments?: string[];
}

export default function FilterBar({ departments = [] }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedHotels = searchParams.get('hotels')?.split(',').filter(Boolean) as HotelCode[] || [];
  const department = searchParams.get('department') || '';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const resetFilters = () => {
    router.push(window.location.pathname);
  };

  const hasFilters = selectedHotels.length > 0 || department || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Hotel</label>
          <select
            value={selectedHotels.length === 1 ? selectedHotels[0] : ''}
            onChange={(e) => updateParams({ hotels: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-hilton-blue focus:ring-1 focus:ring-hilton-blue outline-none"
          >
            <option value="">All Hotels</option>
            {HOTEL_CODES.map(code => (
              <option key={code} value={code}>{code} — {HOTELS[code]}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => updateParams({ department: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-hilton-blue focus:ring-1 focus:ring-hilton-blue outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateParams({ from: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-hilton-blue focus:ring-1 focus:ring-hilton-blue outline-none"
          />
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateParams({ to: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-hilton-blue focus:ring-1 focus:ring-hilton-blue outline-none"
          />
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-hilton-blue hover:bg-hilton-beige rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
