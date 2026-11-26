import type { AttendanceMark, Course, Student, StudentStats } from '../types';

export function computeStudentStats(
  student: Student,
  records: Course['records'],
  selectedDate: string
): StudentStats {
  let recordedAttended = 0;
  let recordedTotal = 0;

  for (const dateKey of Object.keys(records)) {
    const mark = records[dateKey]?.[student.id];
    if (mark === 'P') {
      recordedAttended += 1;
      recordedTotal += 1;
    } else if (mark === 'A') {
      recordedTotal += 1;
    }
  }

  const attended = student.baseAttended + recordedAttended;
  const total = student.baseTotal + recordedTotal;
  const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);
  const statusForDate = records[selectedDate]?.[student.id] ?? null;

  // Solve (attended + x) / (total + x) >= 0.75 => x >= 3 * total - 4 * attended
  const rawNeeded = total === 0 ? 0 : 3 * total - 4 * attended;
  const classesNeededFor75 = rawNeeded > 0 ? rawNeeded : 0;

  return {
    attended,
    total,
    percentage,
    statusForDate,
    classesNeededFor75,
  };
}

export function computeDateSummary(course: Course, selectedDate: string) {
  const dayRecords = course.records[selectedDate] ?? {};
  let present = 0;
  let absent = 0;

  for (const student of course.students) {
    const mark = dayRecords[student.id];
    if (mark === 'P') present += 1;
    else if (mark === 'A') absent += 1;
  }

  const total = course.students.length;
  const pending = total - present - absent;
  const markedCount = present + absent;
  const sessionRate = markedCount === 0 ? null : Math.round((present / markedCount) * 100);

  return { total, present, absent, pending, sessionRate };
}

export function computeDailyHistory(course: Course) {
  const dates = Object.keys(course.records).sort();
  return dates.map((date) => {
    const dayRecords = course.records[date] ?? {};
    let present = 0;
    let absent = 0;
    for (const student of course.students) {
      const m = dayRecords[student.id];
      if (m === 'P') present += 1;
      else if (m === 'A') absent += 1;
    }
    const marked = present + absent;
    const rate = marked === 0 ? 0 : Math.round((present / marked) * 100);
    return { date, present, absent, marked, rate };
  });
}

export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function exportCourseCsv(course: Course, selectedDate: string): string {
  const header = [
    'Course Code',
    'Roll Number',
    'Student Name',
    'Email',
    'Section',
    `Status (${selectedDate})`,
    'Sessions Attended',
    'Total Sessions',
    'Attendance %',
    'Academic Standing',
  ];

  const statusLabel = (mark: AttendanceMark | null) => {
    if (mark === 'P') return 'Present';
    if (mark === 'A') return 'Absent';
    return 'Not Marked';
  };

  const escapeCsv = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = course.students.map((student) => {
    const stats = computeStudentStats(student, course.records, selectedDate);
    const standing =
      stats.total === 0
        ? 'No Sessions'
        : stats.percentage >= 85
          ? 'Good Standing'
          : stats.percentage >= 75
            ? 'Satisfactory'
            : 'Below 75% Threshold';

    return [
      course.code,
      student.roll,
      student.name,
      student.email || '-',
      student.section,
      statusLabel(stats.statusForDate),
      stats.attended,
      stats.total,
      `${stats.percentage}%`,
      standing,
    ]
      .map(escapeCsv)
      .join(',');
  });

  return [header.map(escapeCsv).join(','), ...rows].join('\n');
}
