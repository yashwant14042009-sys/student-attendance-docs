export type AttendanceMark = 'P' | 'A';

export type NavSection = 'mark' | 'directory' | 'enroll' | 'report';

export type FilterStatus = 'all' | 'P' | 'A' | 'pending';

export interface Student {
  id: string;
  roll: string;
  name: string;
  email: string;
  section: string;
  baseAttended: number;
  baseTotal: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  term: string;
  schedule: string;
  students: Student[];
  /** Map of YYYY-MM-DD -> { [studentId]: 'P' | 'A' } */
  records: Record<string, Record<string, AttendanceMark>>;
}

export interface StudentStats {
  attended: number;
  total: number;
  percentage: number;
  statusForDate: AttendanceMark | null;
  classesNeededFor75: number;
}
