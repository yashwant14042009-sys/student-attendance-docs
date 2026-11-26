import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Menu,
  Plus,
  RotateCcw,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { AttendanceMark, Course, NavSection, Student } from './types';
import { createInitialCourses, getTodayISO } from './data/seedData';
import { computeDateSummary, exportCourseCsv } from './utils/attendance';
import { SummaryStrip } from './components/SummaryStrip';
import { MarkAttendanceView } from './components/MarkAttendanceView';
import { DirectoryView } from './components/DirectoryView';
import { EnrollStudentView } from './components/EnrollStudentView';
import { ReportView } from './components/ReportView';

const STORAGE_KEY = 'classledger_courses_v1';

function loadInitialCourses(): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialCourses();
    const parsed = JSON.parse(raw) as Course[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Ignore corrupted storage and fall back to seed data
  }
  return createInitialCourses();
}

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'mark', label: 'Mark Attendance', icon: CheckSquare },
  { id: 'directory', label: 'Attendance Register', icon: Users },
  { id: 'enroll', label: 'Register Student', icon: UserPlus },
  { id: 'report', label: 'Reports & Analytics', icon: BarChart3 },
];

export const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(loadInitialCourses);
  const [activeCourseId, setActiveCourseId] = useState<string>(() => courses[0]?.id ?? '');
  const [activeSection, setActiveSection] = useState<NavSection>('mark');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // New Course Modal state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSchedule, setNewCourseSchedule] = useState('');
  const [courseFormError, setCourseFormError] = useState<string | null>(null);

  // Reset confirmation
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // Storage quota fallback ignored
    }
  }, [courses]);

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === activeCourseId) ?? courses[0],
    [courses, activeCourseId]
  );

  const summary = useMemo(
    () => computeDateSummary(activeCourse, selectedDate),
    [activeCourse, selectedDate]
  );

  const updateActiveCourse = (updater: (course: Course) => Course) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourse.id ? updater(c) : c))
    );
  };

  const handleMarkStudent = (studentId: string, mark: AttendanceMark | null) => {
    handleMarkForDate(selectedDate, studentId, mark);
  };

  const handleMarkForDate = (
    date: string,
    studentId: string,
    mark: AttendanceMark | null
  ) => {
    updateActiveCourse((course) => {
      const existingDay = { ...(course.records[date] ?? {}) };
      if (mark === null) {
        delete existingDay[studentId];
      } else {
        existingDay[studentId] = mark;
      }
      const nextRecords = { ...course.records };
      if (Object.keys(existingDay).length === 0) {
        delete nextRecords[date];
      } else {
        nextRecords[date] = existingDay;
      }
      return { ...course, records: nextRecords };
    });
  };

  const handleMarkAllPresent = () => {
    updateActiveCourse((course) => {
      const existingDay = { ...(course.records[selectedDate] ?? {}) };
      for (const student of course.students) {
        if (!existingDay[student.id]) {
          existingDay[student.id] = 'P';
        }
      }
      return {
        ...course,
        records: {
          ...course.records,
          [selectedDate]: existingDay,
        },
      };
    });
  };

  const handleClearDate = () => {
    updateActiveCourse((course) => {
      const nextRecords = { ...course.records };
      delete nextRecords[selectedDate];
      return { ...course, records: nextRecords };
    });
  };

  const handleAddStudent = (input: {
    name: string;
    roll: string;
    email: string;
    section: string;
  }): string | null => {
    if (!input.name || !input.roll) {
      return 'Enter both the student name and roll number.';
    }
    const duplicate = activeCourse.students.some(
      (s) => s.roll.toLowerCase() === input.roll.toLowerCase()
    );
    if (duplicate) {
      return `Roll number ${input.roll} is already registered in ${activeCourse.code}.`;
    }

    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      roll: input.roll,
      email: input.email,
      section: input.section || 'Section A',
      baseAttended: 0,
      baseTotal: 0,
    };

    updateActiveCourse((course) => ({
      ...course,
      students: [...course.students, newStudent],
    }));
    return null;
  };

  const handleBulkAddStudents = (
    entries: Array<{ name: string; roll: string; email: string; section: string }>
  ) => {
    const existingRolls = new Set(
      activeCourse.students.map((s) => s.roll.toLowerCase())
    );
    const toAdd: Student[] = [];
    let skipped = 0;

    for (const entry of entries) {
      const key = entry.roll.toLowerCase();
      if (existingRolls.has(key)) {
        skipped += 1;
        continue;
      }
      existingRolls.add(key);
      toAdd.push({
        id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: entry.name,
        roll: entry.roll,
        email: entry.email,
        section: entry.section || 'Section A',
        baseAttended: 0,
        baseTotal: 0,
      });
    }

    if (toAdd.length > 0) {
      updateActiveCourse((course) => ({
        ...course,
        students: [...course.students, ...toAdd],
      }));
    }

    return { added: toAdd.length, skipped };
  };

  const handleUpdateStudent = (
    studentId: string,
    updates: Pick<Student, 'name' | 'roll' | 'email' | 'section'>
  ): string | null => {
    if (!updates.name || !updates.roll) {
      return 'Student name and roll number cannot be empty.';
    }
    const conflict = activeCourse.students.some(
      (s) => s.id !== studentId && s.roll.toLowerCase() === updates.roll.toLowerCase()
    );
    if (conflict) {
      return `Roll number ${updates.roll} belongs to another student in ${activeCourse.code}.`;
    }

    updateActiveCourse((course) => ({
      ...course,
      students: course.students.map((s) =>
        s.id === studentId ? { ...s, ...updates } : s
      ),
    }));
    return null;
  };

  const handleDeleteStudent = (studentId: string) => {
    updateActiveCourse((course) => {
      const nextRecords: Course['records'] = {};
      for (const [dateKey, dayMap] of Object.entries(course.records)) {
        const copy = { ...dayMap };
        delete copy[studentId];
        if (Object.keys(copy).length > 0) {
          nextRecords[dateKey] = copy;
        }
      }
      return {
        ...course,
        students: course.students.filter((s) => s.id !== studentId),
        records: nextRecords,
      };
    });
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCourseCode.trim().toUpperCase();
    const name = newCourseName.trim();
    if (!code || !name) {
      setCourseFormError('Course code and title are required.');
      return;
    }
    if (courses.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
      setCourseFormError(`Course ${code} already exists.`);
      return;
    }

    const created: Course = {
      id: `course-${Date.now()}`,
      code,
      name,
      instructor: 'Dr. Ananya Rao',
      term: 'Fall 2026',
      schedule: newCourseSchedule.trim() || 'Schedule TBD',
      students: [],
      records: {},
    };

    setCourses((prev) => [...prev, created]);
    setActiveCourseId(created.id);
    setActiveSection('enroll');
    setShowCourseForm(false);
    setNewCourseCode('');
    setNewCourseName('');
    setNewCourseSchedule('');
    setCourseFormError(null);
  };

  const handleExportCsv = () => {
    const csv = exportCourseCsv(activeCourse, selectedDate);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeCourse.code.toLowerCase()}-attendance-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetDemo = () => {
    const fresh = createInitialCourses();
    setCourses(fresh);
    setActiveCourseId(fresh[0].id);
    setSelectedDate(getTodayISO());
    setConfirmReset(false);
  };

  const todayISO = getTodayISO();

  const stepDate = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const currentNavLabel =
    NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? 'Mark Attendance';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          ClassLedger
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-medium text-slate-500">Courses</span>
            <button
              type="button"
              onClick={() => {
                setShowCourseForm(true);
                setCourseFormError(null);
              }}
              aria-label="Create new course"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New</span>
            </button>
          </div>
          <div className="space-y-1">
            {courses.map((course) => {
              const isSelected = course.id === activeCourse.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setActiveCourseId(course.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold truncate">
                      {course.code}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {course.students.length}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate mt-0.5">
                    {course.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <nav aria-label="Primary workspace navigation">
          <div className="px-2 mb-2 text-xs font-medium text-slate-500">
            Workspace
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            AR
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">
              {activeCourse.instructor}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {activeCourse.term}
            </p>
          </div>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Sample Data</span>
          </button>
        ) : (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <p className="text-[11px] text-slate-700 font-medium">
              Restore original demo courses?
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetDemo}
                className="flex-1 py-1 text-[11px] font-medium text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-900/30 no-print"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="w-64 h-full bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" aria-hidden="true" />
              <span className="font-medium text-slate-500 truncate">
                {activeCourse.code} · {activeCourse.name}
              </span>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 whitespace-nowrap shrink-0">
                {currentNavLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center border border-slate-200 rounded-md bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => stepDate(-1)}
                aria-label="Previous day"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-r border-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <label className="relative inline-flex items-center">
                <Calendar
                  className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  aria-label="Session date"
                  className="pl-8 pr-2 py-1.5 text-xs font-mono bg-white text-slate-700 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => stepDate(1)}
                aria-label="Next day"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l border-slate-200 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedDate !== todayISO && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayISO)}
                className="hidden md:inline-flex px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 no-print">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {currentNavLabel}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {activeCourse.code} · {activeCourse.name} · {activeCourse.schedule}
              </p>
            </div>
          </div>

          <div className="no-print">
            <SummaryStrip
              total={summary.total}
              present={summary.present}
              absent={summary.absent}
              pending={summary.pending}
              sessionRate={summary.sessionRate}
              selectedDate={selectedDate}
            />
          </div>

          {activeSection === 'mark' && (
            <MarkAttendanceView
              course={activeCourse}
              selectedDate={selectedDate}
              onMarkStudent={handleMarkStudent}
              onMarkAllPresent={handleMarkAllPresent}
              onClearDate={handleClearDate}
              onNavigateToEnroll={() => setActiveSection('enroll')}
            />
          )}

          {activeSection === 'directory' && (
            <DirectoryView
              course={activeCourse}
              selectedDate={selectedDate}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onMarkForDate={handleMarkForDate}
            />
          )}

          {activeSection === 'enroll' && (
            <EnrollStudentView
              course={activeCourse}
              onAddStudent={handleAddStudent}
              onBulkAddStudents={handleBulkAddStudents}
            />
          )}

          {activeSection === 'report' && (
            <ReportView
              course={activeCourse}
              selectedDate={selectedDate}
              onExportCsv={handleExportCsv}
            />
          )}
        </main>
      </div>

      {/* New Course Modal */}
      {showCourseForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Create new course"
          onClick={() => setShowCourseForm(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Create New Course
              </h2>
              <button
                type="button"
                onClick={() => setShowCourseForm(false)}
                aria-label="Close modal"
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="e.g., CS-410"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g., Database Management Systems"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Schedule <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newCourseSchedule}
                  onChange={(e) => setNewCourseSchedule(e.target.value)}
                  placeholder="e.g., Tue / Thu · 10:00 AM"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              {courseFormError && (
                <p className="text-xs font-medium text-rose-700">
                  {courseFormError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCourseForm(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 cursor-pointer"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
