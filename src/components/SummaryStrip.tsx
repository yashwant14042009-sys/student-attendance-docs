import React from 'react';
import { formatDisplayDate } from '../utils/attendance';

interface SummaryStripProps {
  total: number;
  present: number;
  absent: number;
  pending: number;
  sessionRate: number | null;
  selectedDate: string;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  total,
  present,
  absent,
  pending,
  sessionRate,
  selectedDate,
}) => {
  const marked = present + absent;

  return (
    <section
      aria-label="Session summary"
      className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200"
    >
      <div className="px-5 py-4">
        <p className="text-xs font-medium text-slate-500">Enrolled Students</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
          {total}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatDisplayDate(selectedDate)}
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-medium text-slate-500">Present</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-emerald-700 font-mono tabular-nums">
          {present}
        </p>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {sessionRate !== null ? `${sessionRate}% of marked` : 'No marks recorded'}
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-medium text-slate-500">Absent</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-rose-700 font-mono tabular-nums">
          {absent}
        </p>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {total > 0 ? `${Math.round((absent / total) * 100)}% of roster` : '0% of roster'}
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-medium text-slate-500">Pending Roll Call</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
          {pending}
        </p>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {marked} of {total} recorded
        </p>
      </div>
    </section>
  );
};
