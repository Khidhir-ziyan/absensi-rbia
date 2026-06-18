# PRD: Class Attendance Application (Standalone)

**Version:** 2.0
**Status:** Draft
**Date:** June 18, 2026

---

# 1. Overview & Background

A simple attendance application that allows Teachers to manage classes, subjects, and students, then record attendance for each session using attendance statuses (Present, Sick, Excused, Absent). Whenever a new session is started for a subject, the teacher must enter the topic/lesson for that day as part of the learning history. Attendance records can be exported into PDF reports summarizing each student's attendance frequency against the total number of completed sessions.

This project is standalone, but its data structure is designed to be **scalable** — making it easy to extend to multiple roles (Admin, Parent, Co-Teacher), support students moving between classes, or integrate with other systems in the future without requiring major database migrations.

---

## 1.1 Objectives

- Simplify attendance recording without paper.
- Store the topic/discussion of each session as subject learning history.
- Provide attendance summaries per class that can be printed or downloaded as PDF.
- Build a clean and extensible data foundation for future features (additional roles, reports, etc.).

---

## 1.2 Out of Scope (Current Version)

- WhatsApp/Email notifications to parents.
- Separate Admin and Parent roles (the schema prepares for them, but they are not implemented in UI or permissions).
- Co-teacher support or separate subject ownership (all subjects inside a class are automatically owned by the class owner).
- Subject enrollment per student (all students in a class automatically participate in all subjects — see §4.3).
- Multi-tenancy (multiple institutions in a single instance).
- Advanced analytics (trend charts, etc.). Only numerical summaries in PDF are required.

---

# 2. Target Users

| Role | Description |
|--------|-------------|
| **Teacher** | The only active role in this version. One teacher account can manage multiple classes. Teachers create classes, add subjects, manage students, start class sessions, record attendance, and export attendance summaries to PDF. |

> **Schema note:** The `User` table still includes a `role` enum even though it currently only contains `TEACHER`, so future roles (`ADMIN`, `PARENT`) can be added without structural migrations—only enum values and authorization middleware need to be extended.

---

# 3. Main User Flow

1. **Login** — Teacher logs into the system.
2. **Add Class** — Teacher creates a class (e.g., "Class 4A"). One class contains multiple subjects.
3. **Add Students** — Students are added to the class. They automatically participate in all current and future subjects in that class.
4. **Add Subject** — Teacher adds subjects to the class (e.g., "Quran Memorization", "Mathematics"). A subject belongs to only one class.
5. **Start Session** — Teacher selects a subject, clicks "Start Session", enters the day's topic (required), and the system creates a session with status `IN_PROGRESS`.
6. **Attendance** — Teacher sees the student list and assigns one status to each student: **Present / Sick / Excused / Absent**.
7. **Finish** — The session status changes to `COMPLETED`, and attendance becomes part of the history. The subject itself remains active and can be used for future sessions.
8. **Export Summary** — Teacher can export a PDF containing all classes and subjects they manage, with attendance statistics grouped by subject.

---

# 4. Functional Requirements

## 4.1 Class Management

- **FR-1.1:** Teachers can create classes (name and optional description).
- **FR-1.2:** Teachers can edit and delete their classes. Deletion uses **soft delete**, preserving all historical records.
- **FR-1.3:** One teacher can own many classes, and each class belongs to one teacher (for now).

---

## 4.2 Subject Management

- **FR-2.1:** Teachers can add subjects to classes.
- **FR-2.2:** One class can have many subjects, but one subject belongs to exactly one class.
- **FR-2.3:** Subjects support **soft deletion**, preserving session and attendance history.
- **FR-2.4:** Subjects are permanent entities and do not have their own "completed" status.

---

## 4.3 Student Management

- **FR-3.1:** Teachers can add students (name and optional fields such as student ID or parent contact).
- **FR-3.2:** Teachers can edit and delete students.
- **FR-3.3:** A student belongs to one class at a time.
- **FR-3.4:** Students do not require manual enrollment per subject; they automatically participate in all subjects of their class.

---

## 4.4 Session (Start / Finish)

- **FR-4.1:** Teachers start a session by entering a required topic and selecting a date (default: today).
- **FR-4.2:** Session statuses:
  - `IN_PROGRESS`
  - `COMPLETED`
- **FR-4.3:** Only the class owner can manage sessions and attendance.
- **FR-4.4:** One subject can have many sessions over time.
- **FR-4.5:** Teachers can view session history, including topics and dates.

---

## 4.5 Attendance Recording

- **FR-5.1:** During an `IN_PROGRESS` session, teachers see all students in checklist form.
- **FR-5.2:** Each student has exactly one attendance status:
  - Present
  - Sick
  - Excused
  - Absent

- **FR-5.3:** Unfilled attendance entries are automatically marked as **Absent** when finishing the session. Before finishing, the system must display a confirmation listing students whose attendance has not been filled.

- **FR-5.4:** After completion, attendance can still be edited. Teachers may explicitly revert a session from `COMPLETED` back to `IN_PROGRESS` for major corrections.

---

## 4.6 Summary & PDF Export

### FR-6.1

Teachers can view attendance summaries grouped by:

```
Class → Subject → Student
```

Each subject displays:

- Present count
- Sick count
- Excused count
- Absent count
- Total completed sessions

### FR-6.2

Teachers can export a **single PDF file** containing:

- Institution logo and header
- Teacher information
- For each class:
  - Subject summaries
  - Student attendance tables
  - Attendance percentage

- Reporting period:
  - Overall first–last session dates, or
  - A selected date range

### FR-6.3 (Optional v1)

Teachers may filter exports by:

- Date range
- Specific classes
- Specific subjects

---

# 5. Non-Functional Requirements

### Scalability

The schema and API structure should support:

- Additional roles (Admin, Parent)
- Many-to-many Teacher ↔ Class relationships
- Subject-specific enrollment
- Student transfers between classes

without requiring major rewrites.

### Performance

Attendance and summary pages should remain responsive with:

- ~40 students per class
- Multiple subjects
- Hundreds of historical sessions

### Usability

Attendance for a full class should ideally be completed in under one minute.

### Data Integrity

Duplicate attendance records for the same student and session must be prevented using unique constraints.

---

# 6. Tech Stack

- **Backend:** Hono (edge-native web framework)
- **Runtime:** Cloudflare Workers (deploy), Wrangler (local dev)
- **ORM:** Drizzle ORM (type-safe, D1-compatible)
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Frontend:** React (Vite + Tailwind CSS)
- **PDF Generation:** `pdfkit` (lightweight, suitable for table-based reports)

---

# 7. Data Schema (Drizzle + D1)

```ts
import { sqliteTable, text, integer, unique, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Enums stored as text — validated at the application layer via Zod
// Role: "TEACHER" (future: "ADMIN", "PARENT")
// SessionStatus: "IN_PROGRESS" | "COMPLETED"
// AttendanceStatus: "PRESENT" | "SICK" | "EXCUSED" | "ABSENT"

export const users = sqliteTable("users", {
  id:        text("id").primaryKey(),       // cuid
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(),
  password:  text("password").notNull(),
  role:      text("role").notNull().default("TEACHER"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const classes = sqliteTable("classes", {
  id:          text("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  teacherId:   text("teacher_id").notNull().references(() => users.id),
  deletedAt:   integer("deleted_at", { mode: "timestamp" }),
  createdAt:   integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:   integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const subjects = sqliteTable("subjects", {
  id:          text("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  classId:     text("class_id").notNull().references(() => classes.id),
  deletedAt:   integer("deleted_at", { mode: "timestamp" }),
  createdAt:   integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:   integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const students = sqliteTable("students", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  studentId:     text("student_id"),
  parentContact: text("parent_contact"),
  classId:       text("class_id").notNull().references(() => classes.id),
  createdAt:     integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt:     integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id:        text("id").primaryKey(),
  subjectId: text("subject_id").notNull().references(() => subjects.id),
  topic:     text("topic").notNull(),
  date:      integer("date", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  status:    text("status").notNull().default("IN_PROGRESS"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("sessions_subject_date").on(table.subjectId, table.date),
]);

export const attendanceRecords = sqliteTable("attendance_records", {
  id:        text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  studentId: text("student_id").notNull().references(() => students.id),
  status:    text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  unique("attendance_session_student").on(table.sessionId, table.studentId),
]);
```

## Scalability Notes

- `classes` and `subjects` use soft deletes via `deletedAt`.
- Students do not directly relate to Subjects. Enrollment is derived from:

```ts
student.classId === subject.classId
```

- Future manual enrollment can be implemented using an `enrollment_subjects` table:

```ts
export const enrollmentSubjects = sqliteTable("enrollment_subjects", {
  id:        text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => students.id),
  subjectId: text("subject_id").notNull().references(() => subjects.id),
});
```

without changing core tables.

- Sessions belong to Subjects rather than Classes because topics are session-specific.
- Future co-teacher support can be added using a `class_teachers` pivot table.
- The unique constraint `(sessionId, studentId)` prevents duplicate attendance records.
- PDF export aggregates data in the following hierarchy:

```
Teacher
└── Class
    └── Subject
        └── Completed Sessions
            └── Attendance Records grouped by Student
```
