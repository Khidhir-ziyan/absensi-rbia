import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { getDB } from "../lib/db";
import { classes, subjects, sessions, students, attendanceRecords, users } from "../schema";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "../lib/constants";
import { generateAttendancePDF } from "../lib/pdf";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const summaryRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /summary — get attendance summary for all classes
summaryRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDB(c.env.DB);

  const teacherClasses = await db
    .select()
    .from(classes)
    .where(and(eq(classes.teacherId, userId), isNull(classes.deletedAt)));

  const result = [];

  for (const cls of teacherClasses) {
    const classSubjects = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.classId, cls.id), isNull(subjects.deletedAt)));

    const classStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, cls.id));

    const subjectSummaries = [];

    for (const subject of classSubjects) {
      const completedSessions = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.subjectId, subject.id),
            eq(sessions.status, SESSION_STATUS.COMPLETED)
          )
        );

      const totalSessions = completedSessions.length;

      const studentSummaries = [];

      for (const student of classStudents) {
        const records = await db
          .select()
          .from(attendanceRecords)
          .where(eq(attendanceRecords.studentId, student.id));

        // Filter to only records from completed sessions of this subject
        const sessionIds = new Set(completedSessions.map((s) => s.id));
        const relevantRecords = records.filter((r) => sessionIds.has(r.sessionId));

        const summary = {
          present: 0,
          sick: 0,
          excused: 0,
          absent: 0,
        };

        for (const record of relevantRecords) {
          switch (record.status) {
            case ATTENDANCE_STATUS.PRESENT:
              summary.present++;
              break;
            case ATTENDANCE_STATUS.SICK:
              summary.sick++;
              break;
            case ATTENDANCE_STATUS.EXCUSED:
              summary.excused++;
              break;
            case ATTENDANCE_STATUS.ABSENT:
              summary.absent++;
              break;
          }
        }

        studentSummaries.push({
          studentId: student.id,
          studentName: student.name,
          ...summary,
          totalSessions,
        });
      }

      subjectSummaries.push({
        subjectId: subject.id,
        subjectName: subject.name,
        totalSessions,
        students: studentSummaries,
      });
    }

    result.push({
      classId: cls.id,
      className: cls.name,
      subjects: subjectSummaries,
    });
  }

  return c.json({ success: true, data: result });
});

// GET /summary/export-pdf — generate PDF report
summaryRoutes.get("/export-pdf", async (c) => {
  const userId = c.get("userId");
  const db = getDB(c.env.DB);

  // Get teacher name
  const teacher = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!teacher) {
    return c.json({ success: false, message: "User not found" }, 404);
  }

  // Reuse the summary logic
  const teacherClasses = await db
    .select()
    .from(classes)
    .where(and(eq(classes.teacherId, userId), isNull(classes.deletedAt)));

  const classSummaries = [];

  for (const cls of teacherClasses) {
    const classSubjects = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.classId, cls.id), isNull(subjects.deletedAt)));

    const classStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, cls.id));

    const subjectSummaries = [];

    for (const subject of classSubjects) {
      const completedSessions = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.subjectId, subject.id),
            eq(sessions.status, SESSION_STATUS.COMPLETED)
          )
        );

      const totalSessions = completedSessions.length;
      const sessionIds = new Set(completedSessions.map((s) => s.id));

      const studentSummaries = [];

      for (const student of classStudents) {
        const records = await db
          .select()
          .from(attendanceRecords)
          .where(eq(attendanceRecords.studentId, student.id));

        const relevantRecords = records.filter((r) => sessionIds.has(r.sessionId));

        const summary = { present: 0, sick: 0, excused: 0, absent: 0 };

        for (const record of relevantRecords) {
          switch (record.status) {
            case ATTENDANCE_STATUS.PRESENT: summary.present++; break;
            case ATTENDANCE_STATUS.SICK: summary.sick++; break;
            case ATTENDANCE_STATUS.EXCUSED: summary.excused++; break;
            case ATTENDANCE_STATUS.ABSENT: summary.absent++; break;
          }
        }

        studentSummaries.push({
          studentId: student.id,
          studentName: student.name,
          ...summary,
          totalSessions,
        });
      }

      subjectSummaries.push({
        subjectId: subject.id,
        subjectName: subject.name,
        totalSessions,
        students: studentSummaries,
      });
    }

    classSummaries.push({
      classId: cls.id,
      className: cls.name,
      subjects: subjectSummaries,
    });
  }

  const pdfBuffer = await generateAttendancePDF({
    teacherName: teacher.name,
    classes: classSummaries,
  });

  // Debug: log PDF buffer info
  console.log("PDF buffer type:", pdfBuffer.constructor.name);
  console.log("PDF buffer length:", pdfBuffer.byteLength);
  console.log("PDF first bytes:", Array.from(pdfBuffer.slice(0, 5)));

  // Use Hono's c.body() for proper binary response handling
  return c.body(pdfBuffer, 200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="laporan-absensi.pdf"',
    "Content-Length": pdfBuffer.byteLength.toString(),
  });
});
