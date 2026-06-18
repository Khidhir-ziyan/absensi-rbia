/**
 * Seed script — populates D1 with sample data for testing.
 *
 * Run with: npx tsx src/seed.ts
 * For remote D1: wrangler d1 execute absensi-rbia --remote --file=seed.sql
 *
 * This script generates a seed.sql file that can be applied to D1.
 */

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function generateSeedSQL() {
  const teacherId = randomUUID();
  const password = await bcrypt.hash("password123", 10);

  const class1Id = randomUUID();
  const class2Id = randomUUID();

  const subject1Id = randomUUID();
  const subject2Id = randomUUID();
  const subject3Id = randomUUID();

  const students = [
    { id: randomUUID(), name: "Ahmad Fauzi", studentId: "2024001", classId: class1Id },
    { id: randomUUID(), name: "Siti Nurhaliza", studentId: "2024002", classId: class1Id },
    { id: randomUUID(), name: "Muhammad Rizki", studentId: "2024003", classId: class1Id },
    { id: randomUUID(), name: "Aisyah Putri", studentId: "2024004", classId: class1Id },
    { id: randomUUID(), name: "Budi Santoso", studentId: "2024005", classId: class2Id },
    { id: randomUUID(), name: "Dewi Lestari", studentId: "2024006", classId: class2Id },
    { id: randomUUID(), name: "Rafi Ahmad", studentId: "2024007", classId: class2Id },
  ];

  // Create 2 completed sessions and 1 in-progress session
  const session1Id = randomUUID();
  const session2Id = randomUUID();
  const session3Id = randomUUID();

  const statuses = ["PRESENT", "SICK", "EXCUSED", "ABSENT"];

  const attendanceRecords: Array<{
    id: string;
    sessionId: string;
    studentId: string;
    status: string;
  }> = [];

  // Session 1 — completed, class1 students
  const class1Students = students.filter((s) => s.classId === class1Id);
  for (const student of class1Students) {
    attendanceRecords.push({
      id: randomUUID(),
      sessionId: session1Id,
      studentId: student.id,
      status: statuses[Math.floor(Math.random() * 2)], // mostly PRESENT or SICK
    });
  }

  // Session 2 — completed, class1 students
  for (const student of class1Students) {
    attendanceRecords.push({
      id: randomUUID(),
      sessionId: session2Id,
      studentId: student.id,
      status: statuses[Math.floor(Math.random() * 3)],
    });
  }

  const sql = `-- Seed data for absensi-rbia
-- Generated on ${new Date().toISOString()}

-- Teacher account (email: guru@rbia.com, password: password123)
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES ('${teacherId}', 'Ustadz Abdullah', 'guru@rbia.com', '${password}', 'TEACHER', unixepoch(), unixepoch());

-- Classes
INSERT INTO classes (id, name, description, teacher_id, created_at, updated_at)
VALUES ('${class1Id}', 'Kelas 4A', 'Kelas 4 semester genap', '${teacherId}', unixepoch(), unixepoch());

INSERT INTO classes (id, name, description, teacher_id, created_at, updated_at)
VALUES ('${class2Id}', 'Kelas 5B', 'Kelas 5 semester genap', '${teacherId}', unixepoch(), unixepoch());

-- Subjects
INSERT INTO subjects (id, name, description, class_id, created_at, updated_at)
VALUES ('${subject1Id}', 'Hafalan Quran', 'Setoran hafalan surah pendek', '${class1Id}', unixepoch(), unixepoch());

INSERT INTO subjects (id, name, description, class_id, created_at, updated_at)
VALUES ('${subject2Id}', 'Matematika', 'Operasi hitung dasar', '${class1Id}', unixepoch(), unixepoch());

INSERT INTO subjects (id, name, description, class_id, created_at, updated_at)
VALUES ('${subject3Id}', 'Bahasa Arab', 'Kosakata dasar', '${class2Id}', unixepoch(), unixepoch());

-- Students
${students
  .map(
    (s) =>
      `INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('${s.id}', '${s.name}', '${s.studentId}', '${s.classId}', unixepoch(), unixepoch());`
  )
  .join("\n")}

-- Sessions (2 completed, 1 in-progress)
INSERT INTO sessions (id, subject_id, topic, date, status, created_at, updated_at)
VALUES ('${session1Id}', '${subject1Id}', 'Surah Al-Fatihah ayat 1-3', unixepoch() - 86400 * 2, 'COMPLETED', unixepoch(), unixepoch());

INSERT INTO sessions (id, subject_id, topic, date, status, created_at, updated_at)
VALUES ('${session2Id}', '${subject1Id}', 'Surah Al-Fatihah ayat 4-7', unixepoch() - 86400, 'COMPLETED', unixepoch(), unixepoch());

INSERT INTO sessions (id, subject_id, topic, date, status, created_at, updated_at)
VALUES ('${session3Id}', '${subject2Id}', 'Penjumlahan dan Pengurangan', unixepoch(), 'IN_PROGRESS', unixepoch(), unixepoch());

-- Attendance records
${attendanceRecords
  .map(
    (r) =>
      `INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('${r.id}', '${r.sessionId}', '${r.studentId}', '${r.status}', unixepoch(), unixepoch());`
  )
  .join("\n")}
`;

  return sql;
}

async function main() {
  const sql = await generateSeedSQL();

  // Write to seed.sql file
  const fs = await import("fs");
  const path = await import("path");

  const outputPath = path.join(__dirname, "..", "seed.sql");
  fs.writeFileSync(outputPath, sql);

  console.log(`Seed SQL generated at: ${outputPath}`);
  console.log("\nTo apply locally:");
  console.log("  npx wrangler d1 execute absensi-rbia --local --file=seed.sql");
  console.log("\nTo apply remotely:");
  console.log("  npx wrangler d1 execute absensi-rbia --remote --file=seed.sql");
  console.log("\nTest credentials:");
  console.log("  Email: guru@rbia.com");
  console.log("  Password: password123");
}

main().catch(console.error);
