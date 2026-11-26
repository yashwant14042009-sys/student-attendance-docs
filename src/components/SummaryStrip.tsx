import React from 'react';
import { CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
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
      aria-label="Today at a glance"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
    >
      <div className="bg-indigo-600 text-white rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-indigo-100">Total Students</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight font-mono tabular-nums">
            {total}
          </p>
          <p className="mt-1 text-xs text-indigo-100">
            {formatDisplayDate(selectedDate)}
          </p>
        </div>
        <Users className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" aria-hidden="true" />
      </div>

      <div className="bg-emerald-600 text-white rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-emerald-100">Present</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight font-mono tabular-nums">
            {present}
          </p>
          <p className="mt-1 text-xs text-emerald-100 tabular-nums">
            {sessionRate !== null ? `${sessionRate}% of marked` : 'Ready to mark'}
          </p>
        </div>
        <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" aria-hidden="true" />
      </div>

      <div className="bg-rose-600 text-white rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-rose-100">Absent</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight font-mono tabular-nums">
            {absent}
          </p>
          <p className="mt-1 text-xs text-rose-100 tabular-nums">
            {total > 0 ? `${Math.round((absent / total) * 100)}% of class` : '0% of class'}
          </p>
        </div>
        <XCircle className="w-5 h-5 text-rose-200 shrink-0 mt-0.5" aria-hidden="true" />
      </div>

      <div className="bg-amber-600 text-white rounded-xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-amber-100">Not Marked</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight font-mono tabular-nums">
            {pending}
          </p>
          <p className="mt-1 text-xs text-amber-100 tabular-nums">
            {marked} of {total} done
          </p>
        </div>
        <Clock className="w-5 h-5 text-amber-100 shrink-0 mt-0.5" aria-hidden="true" />
      </div>
    </section>
  );
};
