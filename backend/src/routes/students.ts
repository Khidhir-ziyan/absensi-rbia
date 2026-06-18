import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { getDB } from "../lib/db";
import { students, classes } from "../schema";
import { createStudentSchema, updateStudentSchema } from "../validators/student.schema";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const studentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /students?classId=xxx — list students for a class
studentRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const classId = c.req.query("classId");
  const db = getDB(c.env.DB);

  if (!classId) {
    return c.json({ success: false, message: "classId is required" }, 400);
  }

  const cls = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  if (!cls) {
    return c.json({ success: false, message: "Class not found" }, 404);
  }

  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, classId));

  return c.json({ success: true, data: rows });
});

// POST /students — add a student
studentRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = createStudentSchema.parse(body);
  const db = getDB(c.env.DB);

  const cls = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, data.classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  if (!cls) {
    return c.json({ success: false, message: "Class not found" }, 404);
  }

  const id = crypto.randomUUID();
  await db.insert(students).values({
    id,
    name: data.name,
    studentId: data.studentId ?? null,
    parentContact: data.parentContact ?? null,
    classId: data.classId,
  });

  const created = await db.select().from(students).where(eq(students.id, id)).get();
  return c.json({ success: true, data: created }, 201);
});

// PUT /students/:id — update a student
studentRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const studentId = c.req.param("id");
  const body = await c.req.json();
  const data = updateStudentSchema.parse(body);
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .get();

  if (!existing) {
    return c.json({ success: false, message: "Student not found" }, 404);
  }

  const cls = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, existing.classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  if (!cls) {
    return c.json({ success: false, message: "Student not found" }, 404);
  }

  await db
    .update(students)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(students.id, studentId));

  const updated = await db.select().from(students).where(eq(students.id, studentId)).get();
  return c.json({ success: true, data: updated });
});

// DELETE /students/:id — hard delete (students don't use soft delete per PRD)
studentRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const studentId = c.req.param("id");
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .get();

  if (!existing) {
    return c.json({ success: false, message: "Student not found" }, 404);
  }

  const cls = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, existing.classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  if (!cls) {
    return c.json({ success: false, message: "Student not found" }, 404);
  }

  await db.delete(students).where(eq(students.id, studentId));
  return c.json({ success: true, data: { message: "Student deleted" } });
});
