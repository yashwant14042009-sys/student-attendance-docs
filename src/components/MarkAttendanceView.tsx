import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  List,
  RotateCcw,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import type { AttendanceMark, Course, FilterStatus } from '../types';
import { computeStudentStats, formatDisplayDate } from '../utils/attendance';

interface MarkAttendanceViewProps {
  course: Course;
  selectedDate: string;
  onMarkStudent: (studentId: string, mark: AttendanceMark | null) => void;
  onMarkAllPresent: () => void;
  onClearDate: () => void;
  onNavigateToEnroll: () => void;
}

const AVATAR_TONES = [
  'bg-slate-800 text-white',
  'bg-blue-900 text-white',
  'bg-emerald-900 text-white',
  'bg-amber-900 text-white',
  'bg-indigo-900 text-white',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getToneClass(roll: string): string {
  let hash = 0;
  for (let i = 0; i < roll.length; i++) {
    hash = (hash * 31 + roll.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export const MarkAttendanceView: React.FC<MarkAttendanceViewProps> = ({
  course,
  selectedDate,
  onMarkStudent,
  onMarkAllPresent,
  onClearDate,
  onNavigateToEnroll,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'focus'>('list');
  const [focusIndex, setFocusIndex] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return course.students
      .map((student) => ({
        student,
        stats: computeStudentStats(student, course.records, selectedDate),
      }))
      .filter(({ student, stats }) => {
        if (filter === 'P' && stats.statusForDate !== 'P') return false;
        if (filter === 'A' && stats.statusForDate !== 'A') return false;
        if (filter === 'pending' && stats.statusForDate !== null) return false;

        if (!q) return true;
        return (
          student.name.toLowerCase().includes(q) ||
          student.roll.toLowerCase().includes(q) ||
          student.section.toLowerCase().includes(q)
        );
      });
  }, [course, selectedDate, query, filter]);

  const safeFocusIndex = rows.length > 0 ? Math.min(focusIndex, rows.length - 1) : 0;
  const focusEntry = rows[safeFocusIndex] ?? null;

  useEffect(() => {
    if (viewMode !== 'focus' || !focusEntry) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onMarkStudent(focusEntry.student.id, 'P');
        setFocusIndex((i) => Math.min(i + 1, rows.length - 1));
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onMarkStudent(focusEntry.student.id, 'A');
        setFocusIndex((i) => Math.min(i + 1, rows.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, rows.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Escape') {
        setViewMode('list');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, focusEntry, rows.length, onMarkStudent]);

  const hasPending = course.students.some(
    (s) => !course.records[selectedDate]?.[s.id]
  );
  const hasAnyMarked = course.students.some(
    (s) => Boolean(course.records[selectedDate]?.[s.id])
  );

  const markedInView = rows.filter((r) => r.stats.statusForDate !== null).length;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusIndex(0);
              }}
              placeholder="Search name or roll..."
              aria-label="Search students"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto"
            role="tablist"
            aria-label="Filter by attendance status"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'P', label: 'Present' },
                { id: 'A', label: 'Absent' },
                { id: 'pending', label: 'Pending' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => {
                  setFilter(tab.id);
                  setFocusIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto"
            role="group"
            aria-label="Roll call view mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Roster List</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('focus');
                const firstPending = rows.findIndex(
                  (r) => r.stats.statusForDate === null
                );
                setFocusIndex(firstPending >= 0 ? firstPending : 0);
              }}
              aria-pressed={viewMode === 'focus'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'focus'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Rapid Roll Call</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onMarkAllPresent}
            disabled={!hasPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mark Remaining Present</span>
          </button>
          <button
            type="button"
            onClick={onClearDate}
            disabled={!hasAnyMarked}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Session</span>
          </button>
        </div>
      </div>

      {course.students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <h3 className="text-base font-semibold text-slate-900">
            No students enrolled in {course.code}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
            Add students individually or import a class roster to begin recording daily attendance.
          </p>
          <button
            type="button"
            onClick={onNavigateToEnroll}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Register First Student</span>
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            No students match the current search or filter
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Showing roll call for {formatDisplayDate(selectedDate)}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'focus' && focusEntry ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono tabular-nums">
                Student {safeFocusIndex + 1} of {rows.length} · {markedInView} marked
              </span>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
              >
                Return to List
              </button>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 rounded-full transition-all duration-200"
                style={{
                  width: `${Math.round(((safeFocusIndex + 1) / rows.length) * 100)}%`,
                }}
              />
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-y border-slate-200">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-display text-lg font-semibold shrink-0 ${getToneClass(
                    focusEntry.student.roll
                  )}`}
                >
                  {getInitials(focusEntry.student.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-mono tabular-nums text-slate-500">
                    Roll #{focusEntry.student.roll} · {focusEntry.student.section}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 truncate mt-0.5">
                    {focusEntry.student.name}
                  </h3>
                  {focusEntry.student.email && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {focusEntry.student.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke={
                      focusEntry.stats.percentage >= 85
                        ? '#15803d'
                        : focusEntry.stats.percentage >= 75
                          ? '#d97706'
                          : '#be123c'
                    }
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={
                      2 * Math.PI * 20 * (1 - focusEntry.stats.percentage / 100)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                    {focusEntry.stats.percentage}%
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-500">
                    {focusEntry.stats.attended}/{focusEntry.stats.total} sessions
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onMarkStudent(
                    focusEntry.student.id,
                    focusEntry.stats.statusForDate === 'P' ? null : 'P'
                  );
                  if (safeFocusIndex < rows.length - 1) {
                    setFocusIndex(safeFocusIndex + 1);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                  focusEntry.stats.statusForDate === 'P'
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Present</span>
                <kbd className="ml-1 px-1.5 py-0.5 text-[11px] font-mono bg-black/10 rounded">
                  P
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onMarkStudent(
                    focusEntry.student.id,
                    focusEntry.stats.statusForDate === 'A' ? null : 'A'
                  );
                  if (safeFocusIndex < rows.length - 1) {
                    setFocusIndex(safeFocusIndex + 1);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                  focusEntry.stats.statusForDate === 'A'
                    ? 'bg-rose-700 border-rose-700 text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-rose-400 hover:bg-rose-50/50'
                }`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Absent</span>
                <kbd className="ml-1 px-1.5 py-0.5 text-[11px] font-mono bg-black/10 rounded">
                  A
                </kbd>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={safeFocusIndex === 0}
                onClick={() => setFocusIndex((i) => Math.max(i - 1, 0))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Use keys P, A, or arrow keys to move rapidly
              </span>

              <button
                type="button"
                disabled={safeFocusIndex >= rows.length - 1}
                onClick={() => setFocusIndex((i) => Math.min(i + 1, rows.length - 1))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
            <div className="col-span-2">Roll Number</div>
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Cumulative Attendance</div>
            <div className="col-span-3 text-right">Session Status</div>
          </div>

          <ul className="divide-y divide-slate-200">
            {rows.map(({ student, stats }) => {
              const isPresent = stats.statusForDate === 'P';
              const isAbsent = stats.statusForDate === 'A';
              const barColor =
                stats.percentage >= 85
                  ? 'bg-emerald-600'
                  : stats.percentage >= 75
                    ? 'bg-amber-500'
                    : 'bg-rose-600';

              return (
                <li
                  key={student.id}
                  className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center hover:bg-slate-50/70 transition-colors"
                >
                  <div className="md:col-span-2 flex items-center justify-between md:justify-start">
                    <span className="font-mono tabular-nums text-sm font-medium text-slate-700">
                      #{student.roll}
                    </span>
                    <span className="md:hidden text-xs text-slate-500 tabular-nums">
                      {stats.percentage}% overall
                    </span>
                  </div>

                  <div className="md:col-span-4 min-w-0 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${getToneClass(
                        student.roll
                      )}`}
                      aria-hidden="true"
                    >
                      {getInitials(student.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        <span>{student.section}</span>
                        {student.email && (
                          <>
                            <span className="mx-1.5" aria-hidden="true">
                              ·
                            </span>
                            <span>{student.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono tabular-nums text-slate-600">
                        {stats.attended}/{stats.total} sessions
                      </span>
                      <span
                        className={`font-mono tabular-nums font-medium ${
                          stats.percentage < 75 && stats.total > 0
                            ? 'text-rose-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {stats.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-opacity ${barColor}`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3 flex items-center md:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onMarkStudent(student.id, isPresent ? null : 'P')
                      }
                      aria-pressed={isPresent}
                      className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                        isPresent
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onMarkStudent(student.id, isAbsent ? null : 'A')
                      }
                      aria-pressed={isAbsent}
                      className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                        isAbsent
                          ? 'bg-rose-700 border-rose-700 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-800'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Absent</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
