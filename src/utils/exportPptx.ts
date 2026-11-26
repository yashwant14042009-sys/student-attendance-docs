import PptxGenJS from 'pptxgenjs';
import type { Course } from '../types';
import {
  computeDailyHistory,
  computeDateSummary,
  computeStudentStats,
  formatDisplayDate,
  formatShortDate,
} from './attendance';
import rollcallImg from '../assets/images/student_ui_attendance_1795672724705.jpg';
import registerImg from '../assets/images/student_ui_register_1795672724364.jpg';
import reportImg from '../assets/images/student_ui_report_1795672724379.jpg';

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadCoursePresentation(
  course: Course,
  selectedDate: string
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = course.instructor;
  pptx.company = 'Student Attendance Project';
  pptx.subject = `${course.code} — ${course.name} Student Attendance Presentation`;
  pptx.title = `Student Attendance System — ${course.code}`;

  const BG = 'F5F7FF';
  const INDIGO_DARK = '312E81';
  const INDIGO = '4F46E5';
  const EMERALD = '059669';
  const ROSE = 'E11D48';
  const AMBER = 'D97706';
  const DARK = '1E293B';
  const MUTED = '64748B';
  const BORDER = 'E2E8F0';
  const WHITE = 'FFFFFF';

  const summary = computeDateSummary(course, selectedDate);
  const studentRows = course.students.map((student) => ({
    student,
    stats: computeStudentStats(student, course.records, selectedDate),
  }));
  const avg =
    studentRows.length > 0
      ? Math.round(
          studentRows.reduce((acc, r) => acc + r.stats.percentage, 0) /
            studentRows.length
        )
      : 0;
  const watchlist = studentRows
    .filter((r) => r.stats.total > 0 && r.stats.percentage < 75)
    .sort((a, b) => a.stats.percentage - b.stats.percentage);
  const history = computeDailyHistory(course).slice(-7);

  // Slide 1: Colorful College Project Cover Slide
  const s1 = pptx.addSlide();
  s1.background = { color: INDIGO_DARK };
  s1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.35,
    w: 1.1,
    h: 0.1,
    fill: { color: '10B981' },
  });
  s1.addText('Student Attendance System', {
    x: 0.8,
    y: 1.65,
    w: 11.5,
    h: 0.85,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 40,
    bold: true,
    color: WHITE,
  });
  s1.addText(
    'A Simple, Colorful & Easy-to-Use Web Application for Classroom Attendance',
    {
      x: 0.8,
      y: 2.55,
      w: 11.5,
      h: 0.55,
      fontFace: 'DM Sans',
      fontSize: 19,
      color: 'C7D2FE',
    }
  );
  s1.addText(
    `Subject: ${course.code} — ${course.name}\nFaculty: ${course.instructor}  |  Term: ${course.term}  |  Date: ${formatDisplayDate(selectedDate)}`,
    {
      x: 0.8,
      y: 4.6,
      w: 11.5,
      h: 1.0,
      fontFace: 'DM Sans',
      fontSize: 13.5,
      color: 'A5B4FC',
      lineSpacingMultiple: 1.4,
    }
  );

  // Slide 2: Introduction & Main Features
  const s2 = pptx.addSlide();
  s2.background = { color: BG };
  s2.addText('1. Introduction & Main Features', {
    x: 0.7,
    y: 0.5,
    w: 11.9,
    h: 0.55,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 24,
    bold: true,
    color: INDIGO_DARK,
  });
  s2.addText(
    'Built to replace paper attendance registers with a fast, color-coded web dashboard.',
    {
      x: 0.7,
      y: 1.05,
      w: 11.9,
      h: 0.38,
      fontFace: 'DM Sans',
      fontSize: 13,
      color: MUTED,
    }
  );

  const pillars = [
    {
      title: '1. Mark Attendance',
      color: EMERALD,
      body: 'Click Present (green) or Absent (red) for each student, or use Rapid Roll Call mode with keyboard keys P and A.',
    },
    {
      title: '2. Register Students',
      color: INDIGO,
      body: 'Add new students with Name and Roll Number, prevent duplicate roll numbers, or paste a list to add many at once.',
    },
    {
      title: '3. View Attendance',
      color: AMBER,
      body: 'Search and sort all students cleanly, check their overall percentage, and edit student details anytime.',
    },
    {
      title: '4. Attendance Report',
      color: ROSE,
      body: 'See the Class Average, colorful attendance bar chart, <75% alert list, CSV download, and printable report.',
    },
  ];

  pillars.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.7 + col * 6.1;
    const y = 1.7 + row * 2.35;

    s2.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 5.8,
      h: 2.05,
      fill: { color: WHITE },
      line: { color: BORDER, width: 1 },
    });
    s2.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 5.8,
      h: 0.1,
      fill: { color: p.color },
    });
    s2.addText(p.title, {
      x: x + 0.3,
      y: y + 0.3,
      w: 5.2,
      h: 0.4,
      fontFace: 'Plus Jakarta Sans',
      fontSize: 16,
      bold: true,
      color: p.color,
    });
    s2.addText(p.body, {
      x: x + 0.3,
      y: y + 0.82,
      w: 5.2,
      h: 1.0,
      fontFace: 'DM Sans',
      fontSize: 12.5,
      color: DARK,
      lineSpacingMultiple: 1.35,
    });
  });

  // Slide 3: Today at a Glance (Colorful Cards)
  const s3 = pptx.addSlide();
  s3.background = { color: BG };
  s3.addText(`2. Today at a Glance — ${course.code}`, {
    x: 0.7,
    y: 0.5,
    w: 11.9,
    h: 0.55,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 24,
    bold: true,
    color: INDIGO_DARK,
  });

  const kpis = [
    { label: 'Total Students', value: String(summary.total), bg: INDIGO },
    { label: 'Present Today', value: String(summary.present), bg: EMERALD },
    { label: 'Absent Today', value: String(summary.absent), bg: ROSE },
    { label: 'Class Average', value: `${avg}%`, bg: AMBER },
  ];

  kpis.forEach((k, idx) => {
    const x = 0.7 + idx * 3.05;
    s3.addShape(pptx.ShapeType.rect, {
      x,
      y: 1.35,
      w: 2.85,
      h: 1.35,
      fill: { color: k.bg },
    });
    s3.addText(k.label, {
      x: x + 0.22,
      y: 1.52,
      w: 2.4,
      h: 0.3,
      fontFace: 'DM Sans',
      fontSize: 11.5,
      color: WHITE,
    });
    s3.addText(k.value, {
      x: x + 0.22,
      y: 1.9,
      w: 2.4,
      h: 0.55,
      fontFace: 'JetBrains Mono',
      fontSize: 28,
      bold: true,
      color: WHITE,
    });
  });

  s3.addText('Recent Class Sessions', {
    x: 0.7,
    y: 3.05,
    w: 5.8,
    h: 0.4,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 15,
    bold: true,
    color: DARK,
  });

  const sessionTableRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Date', options: { bold: true, fill: { color: INDIGO }, color: WHITE } },
      { text: 'Present', options: { bold: true, fill: { color: INDIGO }, color: WHITE, align: 'right' } },
      { text: 'Absent', options: { bold: true, fill: { color: INDIGO }, color: WHITE, align: 'right' } },
      { text: 'Rate', options: { bold: true, fill: { color: INDIGO }, color: WHITE, align: 'right' } },
    ],
    ...history.map((h) => [
      { text: formatShortDate(h.date) },
      { text: String(h.present), options: { align: 'right' as const, color: EMERALD, bold: true } },
      { text: String(h.absent), options: { align: 'right' as const, color: ROSE, bold: true } },
      { text: `${h.rate}%`, options: { align: 'right' as const, bold: true } },
    ]),
  ];

  if (history.length === 0) {
    sessionTableRows.push([{ text: 'No dated sessions yet', options: { colspan: 4 } }]);
  }

  s3.addTable(sessionTableRows, {
    x: 0.7,
    y: 3.5,
    w: 5.7,
    fontFace: 'DM Sans',
    fontSize: 11,
    color: DARK,
    border: { type: 'solid', color: BORDER, pt: 1 },
    rowH: 0.36,
  });

  s3.addText('Students Below 75% (Need Attention)', {
    x: 6.75,
    y: 3.05,
    w: 5.8,
    h: 0.4,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 15,
    bold: true,
    color: DARK,
  });

  const watchlistRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Roll', options: { bold: true, fill: { color: ROSE }, color: WHITE } },
      { text: 'Student', options: { bold: true, fill: { color: ROSE }, color: WHITE } },
      { text: 'Rate', options: { bold: true, fill: { color: ROSE }, color: WHITE, align: 'right' } },
      { text: 'Extra Classes', options: { bold: true, fill: { color: ROSE }, color: WHITE, align: 'right' } },
    ],
    ...(watchlist.length > 0
      ? watchlist.slice(0, 7).map((w) => [
          { text: `#${w.student.roll}` },
          { text: w.student.name },
          { text: `${w.stats.percentage}%`, options: { align: 'right' as const, color: ROSE, bold: true } },
          { text: `${w.stats.classesNeededFor75} cls`, options: { align: 'right' as const } },
        ])
      : [[{ text: 'All students are above 75% attendance!', options: { colspan: 4, color: EMERALD } }]]),
  ];

  s3.addTable(watchlistRows, {
    x: 6.75,
    y: 3.5,
    w: 5.85,
    fontFace: 'DM Sans',
    fontSize: 11,
    color: DARK,
    border: { type: 'solid', color: BORDER, pt: 1 },
    rowH: 0.36,
  });

  // Slide 4: Website Screenshots
  const [rollData, regData, repData] = await Promise.all([
    toDataUrl(rollcallImg),
    toDataUrl(registerImg),
    toDataUrl(reportImg),
  ]);

  const s4 = pptx.addSlide();
  s4.background = { color: BG };
  s4.addText('3. Application Screens', {
    x: 0.7,
    y: 0.5,
    w: 11.9,
    h: 0.55,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 24,
    bold: true,
    color: INDIGO_DARK,
  });

  const showcaseItems = [
    { data: rollData, title: 'Mark Attendance Screen', x: 0.7, color: EMERALD },
    { data: regData, title: 'Register & View Students', x: 4.8, color: INDIGO },
    { data: repData, title: 'Reports & Bar Charts', x: 8.9, color: AMBER },
  ];

  showcaseItems.forEach((item) => {
    s4.addShape(pptx.ShapeType.rect, {
      x: item.x,
      y: 1.35,
      w: 3.7,
      h: 2.95,
      fill: { color: WHITE },
      line: { color: BORDER, width: 1 },
    });
    if (item.data) {
      s4.addImage({
        data: item.data,
        x: item.x + 0.1,
        y: 1.45,
        w: 3.5,
        h: 1.97,
      });
    }
    s4.addText(item.title, {
      x: item.x + 0.15,
      y: 3.62,
      w: 3.4,
      h: 0.45,
      fontFace: 'Plus Jakarta Sans',
      fontSize: 12.5,
      bold: true,
      color: item.color,
      align: 'center',
    });
  });

  // Slide 5: Technologies Used & Future Scope
  const s5 = pptx.addSlide();
  s5.background = { color: BG };
  s5.addText('4. Technologies Used & Future Scope', {
    x: 0.7,
    y: 0.5,
    w: 11.9,
    h: 0.55,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 24,
    bold: true,
    color: INDIGO_DARK,
  });

  s5.addShape(pptx.ShapeType.rect, {
    x: 0.7,
    y: 1.4,
    w: 5.75,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: BORDER, width: 1 },
  });
  s5.addText('Technologies Used', {
    x: 1.0,
    y: 1.7,
    w: 5.1,
    h: 0.4,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 17,
    bold: true,
    color: INDIGO,
  });
  s5.addText(
    '• HTML5, CSS3 & Tailwind CSS for colorful styling\n• React & TypeScript for interactive buttons and tables\n• LocalStorage to save student records in the browser\n• Node.js & Express server to run the website\n• CSV, Print & PowerPoint (.pptx) report downloads',
    {
      x: 1.0,
      y: 2.25,
      w: 5.1,
      h: 3.5,
      fontFace: 'DM Sans',
      fontSize: 13,
      color: DARK,
      lineSpacingMultiple: 1.6,
    }
  );

  s5.addShape(pptx.ShapeType.rect, {
    x: 6.85,
    y: 1.4,
    w: 5.75,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: BORDER, width: 1 },
  });
  s5.addText('Future Enhancements', {
    x: 7.15,
    y: 1.7,
    w: 5.1,
    h: 0.4,
    fontFace: 'Plus Jakarta Sans',
    fontSize: 17,
    bold: true,
    color: EMERALD,
  });
  s5.addText(
    '• Teacher & student login accounts\n• Cloud database (Firebase / SQL) to sync across devices\n• Automatic SMS / email alerts for low attendance\n• QR code scan for fast classroom attendance\n• Mobile app version for teachers',
    {
      x: 7.15,
      y: 2.25,
      w: 5.1,
      h: 3.5,
      fontFace: 'DM Sans',
      fontSize: 13,
      color: DARK,
      lineSpacingMultiple: 1.6,
    }
  );

  await pptx.writeFile({
    fileName: `${course.code.toLowerCase()}-student-attendance-ppt.pptx`,
  });
}
