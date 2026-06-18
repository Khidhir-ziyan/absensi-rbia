import { Hono } from "hono";
import { eq, and, isNull, desc } from "drizzle-orm";
import { getDB } from "../lib/db";
import { subjects, classes, sessions } from "../schema";
import { createSubjectSchema, updateSubjectSchema } from "../validators/subject.schema";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const subjectRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper: verify class ownership
async function verifyClassOwnership(db: ReturnType<typeof getDB>, classId: string, userId: string) {
  return db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();
}

// GET /subjects?classId=xxx — list subjects for a class
subjectRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const classId = c.req.query("classId");
  const db = getDB(c.env.DB);

  if (!classId) {
    return c.json({ success: false, message: "classId is required" }, 400);
  }

  const cls = await verifyClassOwnership(db, classId, userId);
  if (!cls) {
    return c.json({ success: false, message: "Class not found" }, 404);
  }

  const rows = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.classId, classId), isNull(subjects.deletedAt)));

  return c.json({ success: true, data: rows });
});

// GET /subjects/:id — get subject details with sessions
subjectRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const subjectId = c.req.param("id");
  const db = getDB(c.env.DB);

  const subject = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), isNull(subjects.deletedAt)))
    .get();

  if (!subject) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  const cls = await verifyClassOwnership(db, subject.classId, userId);
  if (!cls) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  // Get sessions for this subject
  const subjectSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.subjectId, subjectId))
    .orderBy(desc(sessions.date));

  return c.json({
    success: true,
    data: {
      ...subject,
      sessions: subjectSessions,
    },
  });
});

// POST /subjects — create a subject
subjectRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = createSubjectSchema.parse(body);
  const db = getDB(c.env.DB);

  const cls = await verifyClassOwnership(db, data.classId, userId);
  if (!cls) {
    return c.json({ success: false, message: "Class not found" }, 404);
  }

  const id = crypto.randomUUID();
  await db.insert(subjects).values({
    id,
    name: data.name,
    description: data.description ?? null,
    classId: data.classId,
    scheduleDay: data.scheduleDay ?? null,
    scheduleTime: data.scheduleTime ?? null,
    reminderMinutes: data.reminderMinutes ?? 10,
    reminderEnabled: data.reminderEnabled ?? false,
  });

  const created = await db.select().from(subjects).where(eq(subjects.id, id)).get();
  return c.json({ success: true, data: created }, 201);
});

// PUT /subjects/:id — update a subject
subjectRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const subjectId = c.req.param("id");
  const body = await c.req.json();
  const data = updateSubjectSchema.parse(body);
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), isNull(subjects.deletedAt)))
    .get();

  if (!existing) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  const cls = await verifyClassOwnership(db, existing.classId, userId);
  if (!cls) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  await db
    .update(subjects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subjects.id, subjectId));

  const updated = await db.select().from(subjects).where(eq(subjects.id, subjectId)).get();
  return c.json({ success: true, data: updated });
});

// DELETE /subjects/:id — soft delete
subjectRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const subjectId = c.req.param("id");
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), isNull(subjects.deletedAt)))
    .get();

  if (!existing) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  const cls = await verifyClassOwnership(db, existing.classId, userId);
  if (!cls) {
    return c.json({ success: false, message: "Subject not found" }, 404);
  }

  await db
    .update(subjects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(subjects.id, subjectId));

  return c.json({ success: true, data: { message: "Subject deleted" } });
});
