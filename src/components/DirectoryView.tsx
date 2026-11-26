import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronRight, Search, Trash2, X } from 'lucide-react';
import type { AttendanceMark, Course, Student } from '../types';
import { computeStudentStats, formatDisplayDate } from '../utils/attendance';

interface DirectoryViewProps {
  course: Course;
  selectedDate: string;
  onUpdateStudent: (
    studentId: string,
    updates: Pick<Student, 'name' | 'roll' | 'email' | 'section'>
  ) => string | null;
  onDeleteStudent: (studentId: string) => void;
  onMarkForDate: (date: string, studentId: string, mark: AttendanceMark | null) => void;
}

type SortField = 'roll' | 'name' | 'rate';
type SortDir = 'asc' | 'desc';

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  course,
  selectedDate,
  onUpdateStudent,
  onDeleteStudent,
  onMarkForDate,
}) => {
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('roll');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Drawer edit state
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editMessage, setEditMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const activeStudent = useMemo(
    () => course.students.find((s) => s.id === activeStudentId) ?? null,
    [course.students, activeStudentId]
  );

  const openStudentDrawer = (student: Student) => {
    setActiveStudentId(student.id);
    setEditName(student.name);
    setEditRoll(student.roll);
    setEditEmail(student.email);
    setEditSection(student.section);
    setEditMessage(null);
    setConfirmDelete(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'rate' ? 'desc' : 'asc');
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped = course.students
      .map((student) => ({
        student,
        stats: computeStudentStats(student, course.records, selectedDate),
      }))
      .filter(({ student }) => {
        if (!q) return true;
        return (
          student.name.toLowerCase().includes(q) ||
          student.roll.toLowerCase().includes(q) ||
          student.section.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q)
        );
      });

    mapped.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'roll') {
        cmp = a.student.roll.localeCompare(b.student.roll, undefined, { numeric: true });
      } else if (sortField === 'name') {
        cmp = a.student.name.localeCompare(b.student.name);
      } else {
        cmp = a.stats.percentage - b.stats.percentage;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return mapped;
  }, [course, selectedDate, query, sortField, sortDir]);

  const recordedDates = useMemo(
    () => Object.keys(course.records).sort((a, b) => b.localeCompare(a)),
    [course.records]
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    const err = onUpdateStudent(activeStudent.id, {
      name: editName.trim(),
      roll: editRoll.trim(),
      email: editEmail.trim(),
      section: editSection.trim() || 'Section A',
    });
    if (err) {
      setEditMessage({ type: 'err', text: err });
    } else {
      setEditMessage({ type: 'ok', text: 'Student profile updated.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter roster by name, roll, or email..."
            aria-label="Filter roster"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
        <p className="text-xs text-slate-500 tabular-nums">
          Showing {rows.length} of {course.students.length} students · Click any row for session history
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('roll')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                  >
                    <span>Roll No</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                  >
                    <span>Student</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4 text-right">Sessions</th>
                <th className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('rate')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                  >
                    <span>Rate</span>
                    <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-3 px-4">{formatDisplayDate(selectedDate)}</th>
                <th className="py-3 px-4">Academic Standing</th>
                <th className="py-3 px-4 w-10" aria-label="Details" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-sm text-slate-500">
                    No student records match your query.
                  </td>
                </tr>
              ) : (
                rows.map(({ student, stats }) => {
                  const statusLabel =
                    stats.statusForDate === 'P'
                      ? 'Present'
                      : stats.statusForDate === 'A'
                        ? 'Absent'
                        : 'Not Marked';
                  const statusClass =
                    stats.statusForDate === 'P'
                      ? 'text-emerald-700 font-medium'
                      : stats.statusForDate === 'A'
                        ? 'text-rose-700 font-medium'
                        : 'text-slate-500';

                  const standingLabel =
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
                    <tr
                      key={student.id}
                      onClick={() => openStudentDrawer(student)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-xs font-medium text-slate-700">
                        {student.roll}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{student.name}</div>
                        {student.email && (
                          <div className="text-xs text-slate-500">{student.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{student.section}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700">
                        {stats.attended} / {stats.total}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {stats.percentage}%
                      </td>
                      <td className={`py-3 px-4 text-xs ${statusClass}`}>{statusLabel}</td>
                      <td className={`py-3 px-4 text-xs ${standingClass}`}>{standingLabel}</td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        <ChevronRight className="w-4 h-4 inline-block" aria-hidden="true" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeStudent && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
          role="dialog"
          aria-modal="true"
          aria-label={`Profile for ${activeStudent.name}`}
          onClick={() => setActiveStudentId(null)}
        >
          <div
            className="w-full max-w-md bg-white h-full border-l border-slate-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                  Roll #{activeStudent.roll} · {activeStudent.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStudentId(null)}
                aria-label="Close student details"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-500">
                  Student Profile
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={editRoll}
                      onChange={(e) => setEditRoll(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {editMessage && (
                  <p
                    className={`text-xs font-medium ${
                      editMessage.type === 'ok' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {editMessage.text}
                  </p>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </form>

              <div className="pt-6 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-500">
                    Recorded Session History
                  </h4>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Prior baseline: {activeStudent.baseAttended}/{activeStudent.baseTotal}
                  </span>
                </div>

                {recordedDates.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No dated sessions recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                    {recordedDates.map((date) => {
                      const mark = course.records[date]?.[activeStudent.id] ?? null;
                      return (
                        <li
                          key={date}
                          className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                        >
                          <span className="font-mono tabular-nums text-slate-700">
                            {formatDisplayDate(date)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onMarkForDate(date, activeStudent.id, mark === 'P' ? null : 'P')
                              }
                              className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                                mark === 'P'
                                  ? 'bg-emerald-700 border-emerald-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onMarkForDate(date, activeStudent.id, mark === 'A' ? null : 'A')
                              }
                              className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                                mark === 'A'
                                  ? 'bg-rose-700 border-rose-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="pt-6 border-t border-slate-200">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Remove Student from Course</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md space-y-2.5">
                    <p className="text-xs text-rose-900 font-medium">
                      Remove {activeStudent.name} (#{activeStudent.roll}) from {course.code}?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteStudent(activeStudent.id);
                          setActiveStudentId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-rose-700 rounded hover:bg-rose-800 cursor-pointer"
                      >
                        Confirm Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
