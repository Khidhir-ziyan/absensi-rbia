import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { getDB } from "../lib/db";
import { sessions, subjects, classes, students, attendanceRecords } from "../schema";
import { startSessionSchema, submitAttendanceSchema } from "../validators/session.schema";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "../lib/constants";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const sessionRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper: verify subject ownership through class
async function verifySubjectOwnership(db: ReturnType<typeof getDB>, subjectId: string, userId: string) {
  const subject = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), isNull(subjects.deletedAt)))
    .get();

  if (!subject) return null;

  const cls = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, subject.classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  return cls ? subject : null;
}

// POST /sessions/start — start a new session
sessionRoutes.post("/start", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = startSessionSchema.parse(body);
  const db = getDB(c.env.DB);

  const subject = await verifySubjectOwnership(db, data.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  const id = crypto.randomUUID();
  const date = data.date ? new Date(data.date) : new Date();

  await db.insert(sessions).values({
    id,
    subjectId: data.subjectId,
    topic: data.topic,
    date,
    status: SESSION_STATUS.IN_PROGRESS,
  });

  const created = await db.select().from(sessions).where(eq(sessions.id, id)).get();
  return c.json({ success: true, data: created }, 201);
});

// GET /sessions/:id — get session details with attendance
sessionRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("id");
  const db = getDB(c.env.DB);

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  const subject = await verifySubjectOwnership(db, session.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  // Get all students in the class
  const classStudents = await db
    .select()
    .from(students)
    .where(eq(students.classId, subject.classId));

  // Get existing attendance records
  const records = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, sessionId));

  const attendanceMap = new Map(records.map((r) => [r.studentId, r.status]));

  const data = {
    ...session,
    subject,
    students: classStudents.map((s) => ({
      ...s,
      attendanceStatus: attendanceMap.get(s.id) ?? null,
    })),
  };

  return c.json({ success: true, data });
});

// PUT /sessions/:id/attendance — create or update attendance
sessionRoutes.put("/:id/attendance", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("id");
  const body = await c.req.json();
  const data = submitAttendanceSchema.parse(body);
  const db = getDB(c.env.DB);

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  if (session.status === SESSION_STATUS.COMPLETED) {
    return c.json(
      { success: false, message: "Cannot edit attendance of a completed session" },
      400
    );
  }

  const subject = await verifySubjectOwnership(db, session.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  // Verify all students belong to the class
  const classStudentIds = new Set(
    (await db.select().from(students).where(eq(students.classId, subject.classId))).map(
      (s) => s.id
    )
  );

  for (const record of data.records) {
    if (!classStudentIds.has(record.studentId)) {
      return c.json(
        { success: false, message: `Student ${record.studentId} does not belong to this class` },
        400
      );
    }
  }

  // Upsert attendance records
  for (const record of data.records) {
    const existing = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.sessionId, sessionId),
          eq(attendanceRecords.studentId, record.studentId)
        )
      )
      .get();

    if (existing) {
      await db
        .update(attendanceRecords)
        .set({ status: record.status, updatedAt: new Date() })
        .where(eq(attendanceRecords.id, existing.id));
    } else {
      await db.insert(attendanceRecords).values({
        id: crypto.randomUUID(),
        sessionId,
        studentId: record.studentId,
        status: record.status,
      });
    }
  }

  return c.json({ success: true, data: { message: "Attendance saved" } });
});

// PUT /sessions/:id/finish — mark session as completed
sessionRoutes.put("/:id/finish", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("id");
  const db = getDB(c.env.DB);

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  if (session.status === SESSION_STATUS.COMPLETED) {
    return c.json({ success: false, message: "Session is already completed" }, 400);
  }

  const subject = await verifySubjectOwnership(db, session.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  // Get all students in the class
  const classStudents = await db
    .select()
    .from(students)
    .where(eq(students.classId, subject.classId));

  // Get existing attendance
  const records = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, sessionId));

  const attendedIds = new Set(records.map((r) => r.studentId));

  // Auto-assign ABSENT to unfilled students
  const unfilled = classStudents.filter((s) => !attendedIds.has(s.id));
  for (const student of unfilled) {
    await db.insert(attendanceRecords).values({
      id: crypto.randomUUID(),
      sessionId,
      studentId: student.id,
      status: ATTENDANCE_STATUS.ABSENT,
    });
  }

  // Mark session as completed
  await db
    .update(sessions)
    .set({ status: SESSION_STATUS.COMPLETED, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId));

  return c.json({
    success: true,
    data: {
      message: "Session completed",
      autoAssignedAbsent: unfilled.length,
    },
  });
});

// PUT /sessions/:id/unfinish — revert to IN_PROGRESS
sessionRoutes.put("/:id/unfinish", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("id");
  const db = getDB(c.env.DB);

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  if (session.status === SESSION_STATUS.IN_PROGRESS) {
    return c.json({ success: false, message: "Session is already in progress" }, 400);
  }

  const subject = await verifySubjectOwnership(db, session.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Session not found" }, 404);
  }

  await db
    .update(sessions)
    .set({ status: SESSION_STATUS.IN_PROGRESS, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId));

  return c.json({ success: true, data: { message: "Session reverted to in progress" } });
});
