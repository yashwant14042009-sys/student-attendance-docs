import React, { useMemo, useState } from 'react';
import { Upload, UserPlus } from 'lucide-react';
import type { Course } from '../types';

interface EnrollStudentViewProps {
  course: Course;
  onAddStudent: (input: {
    name: string;
    roll: string;
    email: string;
    section: string;
  }) => string | null;
  onBulkAddStudents: (
    entries: Array<{ name: string; roll: string; email: string; section: string }>
  ) => { added: number; skipped: number };
}

export const EnrollStudentView: React.FC<EnrollStudentViewProps> = ({
  course,
  onAddStudent,
  onBulkAddStudents,
}) => {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [email, setEmail] = useState('');
  const [section, setSection] = useState('Section A');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const parsedBulk = useMemo(() => {
    return bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        const [rawRoll = '', rawName = '', rawEmail = '', rawSection = 'Section A'] = parts;
        return {
          roll: rawRoll,
          name: rawName,
          email: rawEmail,
          section: rawSection || 'Section A',
        };
      })
      .filter((item) => item.roll.length > 0 && item.name.length > 0);
  }, [bulkText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = onAddStudent({
      name: name.trim(),
      roll: roll.trim(),
      email: email.trim(),
      section: section.trim() || 'Section A',
    });

    if (err) {
      setFeedback({ type: 'err', text: err });
    } else {
      setFeedback({
        type: 'ok',
        text: `${name.trim()} (Roll #${roll.trim()}) was added to ${course.code}!`,
      });
      setName('');
      setRoll('');
      setEmail('');
    }
  };

  const handleBulkImport = () => {
    if (parsedBulk.length === 0) return;
    const { added, skipped } = onBulkAddStudents(parsedBulk);
    setBulkResult(
      `Added ${added} student${added === 1 ? '' : 's'}${
        skipped > 0 ? ` (${skipped} duplicate roll number${skipped === 1 ? '' : 's'} skipped)` : ''
      }.`
    );
    if (added > 0) {
      setBulkText('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-white border border-indigo-100 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Register New Student
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Fill in the student details below to add them to {course.code} ({course.name}).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="student-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Student Name
              </label>
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aadhya Nair"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600"
              />
            </div>

            <div>
              <label
                htmlFor="student-roll"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Roll Number
              </label>
              <input
                id="student-roll"
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="e.g., 111"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600"
              />
            </div>

            <div>
              <label
                htmlFor="student-section"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Section
              </label>
              <input
                id="student-section"
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section A"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="student-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                College Email <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aadhya.111@college.edu"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600"
              />
            </div>
          </div>

          {feedback && (
            <div
              role="status"
              className={`px-3.5 py-2.5 rounded-lg border text-xs font-medium ${
                feedback.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 tabular-nums">
              Total in class: {course.students.length} students
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Add Student</span>
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-5 bg-white border border-indigo-100 rounded-xl p-6 space-y-4">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Quick List Import
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Add multiple students at once: <code className="font-mono text-indigo-700">Roll, Name, Email, Section</code>
          </p>
        </div>

        <textarea
          rows={6}
          value={bulkText}
          onChange={(e) => {
            setBulkText(e.target.value);
            setBulkResult(null);
          }}
          aria-label="Bulk roster CSV input"
          placeholder={`112, Devika Iyer, devika@college.edu, Section A\n113, Tarun Sinha, tarun@college.edu, Section B`}
          className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600"
        />

        {bulkResult && (
          <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {bulkResult}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 tabular-nums">
            {parsedBulk.length} student{parsedBulk.length === 1 ? '' : 's'} ready
          </span>
          <button
            type="button"
            onClick={handleBulkImport}
            disabled={parsedBulk.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Import List</span>
          </button>
        </div>
      </div>
    </div>
  );
};
