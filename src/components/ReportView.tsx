import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, Printer } from 'lucide-react';
import type { Course } from '../types';
import {
  computeDailyHistory,
  computeStudentStats,
  formatDisplayDate,
  formatShortDate,
} from '../utils/attendance';

interface ReportViewProps {
  course: Course;
  selectedDate: string;
  onExportCsv: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  course,
  selectedDate,
  onExportCsv,
}) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const report = useMemo(() => {
    const entries = course.students.map((student) => ({
      student,
      stats: computeStudentStats(student, course.records, selectedDate),
    }));

    if (entries.length === 0) {
      return {
        entries: [],
        average: 0,
        best: null,
        shortage: [],
      };
    }

    let sum = 0;
    let best = entries[0];
    const shortage = [];

    for (const entry of entries) {
      sum += entry.stats.percentage;
      if (entry.stats.percentage > best.stats.percentage) {
        best = entry;
      }
      if (entry.stats.total > 0 && entry.stats.percentage < 75) {
        shortage.push(entry);
      }
    }

    shortage.sort((a, b) => a.stats.percentage - b.stats.percentage);

    return {
      entries,
      average: Math.round(sum / entries.length),
      best,
      shortage,
    };
  }, [course, selectedDate]);

  const history = useMemo(() => computeDailyHistory(course), [course]);
  const recentHistory = history.slice(-10);
  const matrixDates = history.slice(-7).map((h) => h.date);
  const activeBar =
    recentHistory.find((h) => h.date === hoveredDate) ??
    recentHistory[recentHistory.length - 1] ??
    null;

  const handleCopySummary = async () => {
    const absentToday = report.entries
      .filter((e) => e.stats.statusForDate === 'A')
      .map((e) => `${e.student.name} (#${e.student.roll})`);
    const watchlist = report.shortage.map(
      (e) => `${e.student.name} (#${e.student.roll}) — ${e.stats.percentage}%`
    );

    const lines = [
      `${course.code} ${course.name} — Attendance Summary (${formatDisplayDate(selectedDate)})`,
      `Class Average: ${report.average}% (${course.students.length} enrolled)`,
      `Absent on ${formatShortDate(selectedDate)}: ${absentToday.length ? absentToday.join(', ') : 'None'}`,
      `Below 75% Watchlist: ${watchlist.length ? watchlist.join('; ') : 'None'}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  if (course.students.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <h3 className="text-base font-semibold text-slate-900">
          No attendance data available
        </h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Register students and mark at least one session to generate analytics and reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print-full">
      <div className="hidden print:block pb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold text-slate-900">
          {course.code} — {course.name}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Instructor: {course.instructor} · Term: {course.term} · Report Date:{' '}
          {formatDisplayDate(selectedDate)}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Class Average</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {report.average}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across {course.students.length} enrolled students
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Highest Attendance</p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-700 font-mono tabular-nums">
            {report.best ? `${report.best.stats.percentage}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {report.best
              ? `${report.best.student.name} (#${report.best.student.roll})`
              : 'No data'}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Below 75% Threshold</p>
          <p
            className={`mt-1.5 text-2xl font-semibold font-mono tabular-nums ${
              report.shortage.length > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {report.shortage.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {report.shortage.length === 0
              ? 'All students meet minimum threshold'
              : 'Requires attendance advisory notice'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Session Attendance Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily attendance rate across recorded sessions
              </p>
            </div>
            {activeBar && (
              <div className="text-xs text-slate-600 font-mono tabular-nums">
                {formatShortDate(activeBar.date)}: {activeBar.rate}% ({activeBar.present}P /{' '}
                {activeBar.absent}A)
              </div>
            )}
          </div>

          {recentHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No dated sessions recorded yet.
            </div>
          ) : (
            <div className="mt-5">
              <div className="grid grid-cols-10 gap-2 items-end h-44 pt-4 border-b border-slate-200">
                {recentHistory.map((item) => {
                  const isHovered = activeBar?.date === item.date;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      onMouseEnter={() => setHoveredDate(item.date)}
                      onFocus={() => setHoveredDate(item.date)}
                      aria-label={`${formatDisplayDate(item.date)}: ${item.rate}% attendance`}
                      className="flex flex-col items-center justify-end h-full group cursor-pointer focus:outline-none"
                    >
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 mb-1">
                        {item.rate}%
                      </span>
                      <div className="w-full max-w-[28px] bg-slate-100 rounded-t h-32 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t transition-colors ${
                            isHovered ? 'bg-blue-700' : 'bg-slate-700 group-hover:bg-blue-700'
                          }`}
                          style={{ height: `${Math.max(item.rate, 4)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-10 gap-2 mt-2">
                {recentHistory.map((item) => (
                  <div
                    key={item.date}
                    className="text-[10px] font-mono tabular-nums text-slate-500 text-center truncate"
                  >
                    {formatShortDate(item.date)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col">
          <div className="pb-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Threshold Watchlist (&lt; 75%)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Minimum consecutive sessions needed to restore 75% standing
            </p>
          </div>

          {report.shortage.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10 text-center">
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Full Compliance
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Every enrolled student is at or above 75% attendance.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 mt-1">
              {report.shortage.map(({ student, stats }) => (
                <li
                  key={student.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {student.name}
                    </p>
                    <p className="text-slate-500 font-mono tabular-nums mt-0.5">
                      Roll #{student.roll} · {stats.attended}/{stats.total} sessions
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono tabular-nums font-semibold text-rose-700">
                      {stats.percentage}%
                    </p>
                    <p className="text-slate-500 tabular-nums mt-0.5">
                      Needs {stats.classesNeededFor75} consecutive
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {matrixDates.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Session Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                At-a-glance attendance grid for the last {matrixDates.length} recorded sessions
              </p>
            </div>
            <div className="text-xs text-slate-500">
              <span>P = Present</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>A = Absent</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>— = Unmarked</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-4">Student</th>
                  {matrixDates.map((d) => (
                    <th key={d} className="py-2.5 px-3 text-center font-mono tabular-nums whitespace-nowrap">
                      {formatShortDate(d)}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right font-mono">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.entries.map(({ student, stats }) => (
                  <tr key={student.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-slate-500 mr-2">#{student.roll}</span>
                      <span className="font-medium text-slate-900">{student.name}</span>
                    </td>
                    {matrixDates.map((d) => {
                      const mark = course.records[d]?.[student.id];
                      return (
                        <td key={d} className="py-2.5 px-3 text-center font-mono">
                          {mark === 'P' ? (
                            <span className="inline-block w-6 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                              P
                            </span>
                          ) : mark === 'A' ? (
                            <span className="inline-block w-6 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                              A
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {stats.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Official Attendance Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative summary for {course.code} as of {formatDisplayDate(selectedDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-700">Copied Summary</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4 text-right">Attended</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.entries.map(({ student, stats }) => {
                const standing =
                  stats.total === 0
                    ? 'No Sessions'
                    : stats.percentage >= 85
                      ? 'Good Standing'
                      : stats.percentage >= 75
                        ? 'Satisfactory'
                        : 'Below 75%';
                const standingClass =
                  stats.total === 0
                    ? 'text-slate-500'
                    : stats.percentage >= 85
                      ? 'text-emerald-700'
                      : stats.percentage >= 75
                        ? 'text-amber-700'
                        : 'text-rose-700 font-medium';

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-700">
                      {student.roll}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{student.section}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs text-slate-700">
                      {stats.attended}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs text-slate-700">
                      {stats.total}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                      {stats.percentage}%
                    </td>
                    <td className={`py-2.5 px-4 text-xs ${standingClass}`}>{standing}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
