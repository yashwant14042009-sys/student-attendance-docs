import type { Course } from '../types';

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function offsetDateISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createInitialCourses(): Course[] {
  const d1 = offsetDateISO(6);
  const d2 = offsetDateISO(5);
  const d3 = offsetDateISO(4);
  const d4 = offsetDateISO(3);
  const d5 = offsetDateISO(2);
  const d6 = offsetDateISO(1);

  return [
    {
      id: 'cs-301',
      code: 'CS-301',
      name: 'Data Structures & Algorithms',
      instructor: 'Dr. Ananya Rao',
      term: 'Fall 2026',
      schedule: 'Mon / Wed / Fri · 09:30 AM',
      students: [
        { id: 's-101', roll: '101', name: 'Arun Kumar', email: 'arun.101@university.edu', section: 'Section A', baseAttended: 41, baseTotal: 44 },
        { id: 's-102', roll: '102', name: 'Priya Sharma', email: 'priya.102@university.edu', section: 'Section A', baseAttended: 43, baseTotal: 44 },
        { id: 's-103', roll: '103', name: 'Karthik Reddy', email: 'karthik.103@university.edu', section: 'Section A', baseAttended: 32, baseTotal: 44 },
        { id: 's-104', roll: '104', name: 'Meera Nair', email: 'meera.104@university.edu', section: 'Section A', baseAttended: 40, baseTotal: 44 },
        { id: 's-105', roll: '105', name: 'Rohan Verma', email: 'rohan.105@university.edu', section: 'Section A', baseAttended: 30, baseTotal: 44 },
        { id: 's-106', roll: '106', name: 'Divya Krishnan', email: 'divya.106@university.edu', section: 'Section B', baseAttended: 42, baseTotal: 44 },
        { id: 's-107', roll: '107', name: 'Siddharth Menon', email: 'siddharth.107@university.edu', section: 'Section B', baseAttended: 36, baseTotal: 44 },
        { id: 's-108', roll: '108', name: 'Nandini Patel', email: 'nandini.108@university.edu', section: 'Section B', baseAttended: 39, baseTotal: 44 },
        { id: 's-109', roll: '109', name: 'Vikram Joshi', email: 'vikram.109@university.edu', section: 'Section B', baseAttended: 28, baseTotal: 44 },
        { id: 's-110', roll: '110', name: 'Anjali Deshmukh', email: 'anjali.110@university.edu', section: 'Section B', baseAttended: 41, baseTotal: 44 },
      ],
      records: {
        [d1]: { 's-101': 'P', 's-102': 'P', 's-103': 'A', 's-104': 'P', 's-105': 'P', 's-106': 'P', 's-107': 'P', 's-108': 'P', 's-109': 'A', 's-110': 'P' },
        [d2]: { 's-101': 'P', 's-102': 'P', 's-103': 'P', 's-104': 'P', 's-105': 'A', 's-106': 'P', 's-107': 'A', 's-108': 'P', 's-109': 'A', 's-110': 'P' },
        [d3]: { 's-101': 'A', 's-102': 'P', 's-103': 'P', 's-104': 'P', 's-105': 'A', 's-106': 'P', 's-107': 'P', 's-108': 'P', 's-109': 'P', 's-110': 'P' },
        [d4]: { 's-101': 'P', 's-102': 'P', 's-103': 'A', 's-104': 'A', 's-105': 'P', 's-106': 'P', 's-107': 'P', 's-108': 'A', 's-109': 'A', 's-110': 'P' },
        [d5]: { 's-101': 'P', 's-102': 'P', 's-103': 'P', 's-104': 'P', 's-105': 'A', 's-106': 'P', 's-107': 'P', 's-108': 'P', 's-109': 'P', 's-110': 'P' },
        [d6]: { 's-101': 'P', 's-102': 'P', 's-103': 'P', 's-104': 'P', 's-105': 'P', 's-106': 'A', 's-107': 'P', 's-108': 'P', 's-109': 'A', 's-110': 'P' },
      },
    },
    {
      id: 'cs-304',
      code: 'CS-304',
      name: 'Operating Systems',
      instructor: 'Dr. Ananya Rao',
      term: 'Fall 2026',
      schedule: 'Tue / Thu · 11:15 AM',
      students: [
        { id: 'os-201', roll: '201', name: 'Aditya Kulkarni', email: 'aditya.201@university.edu', section: 'Section A', baseAttended: 29, baseTotal: 32 },
        { id: 'os-202', roll: '202', name: 'Sneha Iyer', email: 'sneha.202@university.edu', section: 'Section A', baseAttended: 31, baseTotal: 32 },
        { id: 'os-203', roll: '203', name: 'Kabir Malhotra', email: 'kabir.203@university.edu', section: 'Section A', baseAttended: 22, baseTotal: 32 },
        { id: 'os-204', roll: '204', name: 'Ishita Chatterjee', email: 'ishita.204@university.edu', section: 'Section A', baseAttended: 27, baseTotal: 32 },
        { id: 'os-205', roll: '205', name: 'Pranav Gupta', email: 'pranav.205@university.edu', section: 'Section A', baseAttended: 25, baseTotal: 32 },
      ],
      records: {
        [d2]: { 'os-201': 'P', 'os-202': 'P', 'os-203': 'A', 'os-204': 'P', 'os-205': 'P' },
        [d4]: { 'os-201': 'P', 'os-202': 'P', 'os-203': 'P', 'os-204': 'A', 'os-205': 'P' },
        [d6]: { 'os-201': 'A', 'os-202': 'P', 'os-203': 'A', 'os-204': 'P', 'os-205': 'P' },
      },
    },
    {
      id: 'ec-202',
      code: 'EC-202',
      name: 'Digital Logic & Systems',
      instructor: 'Dr. Ananya Rao',
      term: 'Fall 2026',
      schedule: 'Mon / Thu · 02:00 PM',
      students: [
        { id: 'ec-301', roll: '301', name: 'Harshvardhan Rao', email: 'harsh.301@university.edu', section: 'Lab Batch 1', baseAttended: 24, baseTotal: 26 },
        { id: 'ec-302', roll: '302', name: 'Kavya Subramanian', email: 'kavya.302@university.edu', section: 'Lab Batch 1', baseAttended: 25, baseTotal: 26 },
        { id: 'ec-303', roll: '303', name: 'Nikhil Bansal', email: 'nikhil.303@university.edu', section: 'Lab Batch 1', baseAttended: 18, baseTotal: 26 },
        { id: 'ec-304', roll: '304', name: 'Tanya Kapoor', email: 'tanya.304@university.edu', section: 'Lab Batch 1', baseAttended: 23, baseTotal: 26 },
      ],
      records: {
        [d3]: { 'ec-301': 'P', 'ec-302': 'P', 'ec-303': 'A', 'ec-304': 'P' },
        [d5]: { 'ec-301': 'P', 'ec-302': 'P', 'ec-303': 'P', 'ec-304': 'P' },
      },
    },
  ];
}
