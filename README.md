# Student Attendance Management System

## Introduction

A colorful, easy-to-understand web application built to help teachers and students manage daily classroom attendance without paper registers.

## Features

- **Today at a Glance**: Bright color-coded cards showing Total Students, Present, Absent, and Not Marked counts.
- **Mark Attendance**: One-click green **Present** and red **Absent** buttons, plus a **Rapid Roll Call** mode with keyboard keys (`P`, `A`, `←`, `→`).
- **Register Student**: Simple form to add new students by Name and Roll Number, plus a quick list importer.
- **View Attendance**: Search, sort, and click any student row to edit details or view their session history.
- **Attendance Report**: Class Average, Best Attendance, colorful attendance bar chart, Below 75% Alert list, CSV export, Print Report, and **Download PPT (.pptx)**.

## Technologies Used

- HTML5, CSS3 & Tailwind CSS
- React & TypeScript
- Node.js & Express
- `pptxgenjs` for live PowerPoint (`.pptx`) export

## Photos & Presentation

- `photos/1_mark_attendance.jpg` — Mark Attendance screen with colorful stat cards
- `photos/2_register_and_view.jpg` — Register Student form and attendance table
- `photos/3_attendance_report.jpg` — Attendance Report with colorful bar charts
- `docs/Student_Attendance_Presentation.pptx` — Matching project presentation deck

## How to Run

```bash
npm install
npm run dev
```