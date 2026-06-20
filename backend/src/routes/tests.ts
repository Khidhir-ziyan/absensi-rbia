import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDB } from "../lib/db";
import { tests, testGrades, subjects, students, classes } from "../schema";
import { createTestSchema, updateTestSchema, submitGradesSchema } from "../validators/test.schema";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const testRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper: verify subject ownership
async function verifySubjectOwnership(db: any, subjectId: string, userId: string) {
  const subject = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .get();

  if (!subject) return null;

  const cls = await db
    .select()
    .from(classes)
    .where(eq(classes.id, subject.classId))
    .get();

  if (!cls || cls.teacherId !== userId) return null;

  return subject;
}

// GET /subjects/:subjectId/tests — list all tests for a subject
testRoutes.get("/subjects/:subjectId/tests", async (c) => {
  const userId = c.get("userId");
  const subjectId = c.req.param("subjectId");
  const db = getDB(c.env.DB);

  const subject = await verifySubjectOwnership(db, subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Mata pelajaran tidak ditemukan" }, 404);
  }

  const subjectTests = await db
    .select()
    .from(tests)
    .where(eq(tests.subjectId, subjectId))
    .orderBy(tests.createdAt);

  // Get grade counts for each test
  const testsWithCounts = [];
  for (const test of subjectTests) {
    const grades = await db
      .select()
      .from(testGrades)
      .where(eq(testGrades.testId, test.id));

    const subjectStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, subject.classId));

    testsWithCounts.push({
      ...test,
      gradeCount: grades.length,
      totalStudents: subjectStudents.length,
    });
  }

  return c.json({ success: true, data: testsWithCounts });
});

// GET /tests/:testId — get test detail with all grades
testRoutes.get("/tests/:testId", async (c) => {
  const userId = c.get("userId");
  const testId = c.req.param("testId");
  const db = getDB(c.env.DB);

  const test = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .get();

  if (!test) {
    return c.json({ success: false, message: "Tes tidak ditemukan" }, 404);
  }

  const subject = await verifySubjectOwnership(db, test.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Tidak memiliki akses" }, 403);
  }

  // Get all students in this class
  const classStudents = await db
    .select()
    .from(students)
    .where(eq(students.classId, subject.classId));

  // Get existing grades
  const grades = await db
    .select()
    .from(testGrades)
    .where(eq(testGrades.testId, testId));

  const gradeMap = new Map(grades.map((g) => [g.studentId, g]));

  const studentsWithGrades = classStudents.map((s) => {
    const grade = gradeMap.get(s.id);
    return {
      id: s.id,
      name: s.name,
      studentId: s.studentId,
      score: grade?.score ?? null,
      gradeId: grade?.id ?? null,
    };
  });

  return c.json({
    success: true,
    data: {
      ...test,
      students: studentsWithGrades,
    },
  });
});

// POST /subjects/:subjectId/tests — create a new test
testRoutes.post("/subjects/:subjectId/tests", async (c) => {
  const userId = c.get("userId");
  const subjectId = c.req.param("subjectId");
  const db = getDB(c.env.DB);

  const subject = await verifySubjectOwnership(db, subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Mata pelajaran tidak ditemukan" }, 404);
  }

  const body = await c.req.json();
  const data = createTestSchema.parse(body);

  const id = crypto.randomUUID();
  await db.insert(tests).values({
    id,
    subjectId,
    name: data.name,
  });

  const newTest = await db
    .select()
    .from(tests)
    .where(eq(tests.id, id))
    .get();

  return c.json({ success: true, data: newTest }, 201);
});

// PUT /tests/:testId — update test name
testRoutes.put("/tests/:testId", async (c) => {
  const userId = c.get("userId");
  const testId = c.req.param("testId");
  const db = getDB(c.env.DB);

  const test = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .get();

  if (!test) {
    return c.json({ success: false, message: "Tes tidak ditemukan" }, 404);
  }

  const subject = await verifySubjectOwnership(db, test.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Tidak memiliki akses" }, 403);
  }

  const body = await c.req.json();
  const data = updateTestSchema.parse(body);

  await db
    .update(tests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tests.id, testId));

  const updated = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .get();

  return c.json({ success: true, data: updated });
});

// PUT /tests/:testId/grades — submit/update grades
testRoutes.put("/tests/:testId/grades", async (c) => {
  const userId = c.get("userId");
  const testId = c.req.param("testId");
  const db = getDB(c.env.DB);

  const test = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .get();

  if (!test) {
    return c.json({ success: false, message: "Tes tidak ditemukan" }, 404);
  }

  const subject = await verifySubjectOwnership(db, test.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Tidak memiliki akses" }, 403);
  }

  const body = await c.req.json();
  const data = submitGradesSchema.parse(body);

  for (const grade of data.grades) {
    const existing = await db
      .select()
      .from(testGrades)
      .where(
        and(
          eq(testGrades.testId, testId),
          eq(testGrades.studentId, grade.studentId)
        )
      )
      .get();

    if (existing) {
      await db
        .update(testGrades)
        .set({ score: grade.score, updatedAt: new Date() })
        .where(eq(testGrades.id, existing.id));
    } else {
      await db.insert(testGrades).values({
        id: crypto.randomUUID(),
        testId,
        studentId: grade.studentId,
        score: grade.score,
      });
    }
  }

  return c.json({ success: true, message: "Nilai berhasil disimpan" });
});

// DELETE /tests/:testId — delete test and all grades
testRoutes.delete("/tests/:testId", async (c) => {
  const userId = c.get("userId");
  const testId = c.req.param("testId");
  const db = getDB(c.env.DB);

  const test = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .get();

  if (!test) {
    return c.json({ success: false, message: "Tes tidak ditemukan" }, 404);
  }

  const subject = await verifySubjectOwnership(db, test.subjectId, userId);
  if (!subject) {
    return c.json({ success: false, message: "Tidak memiliki akses" }, 403);
  }

  // Delete all grades first
  await db.delete(testGrades).where(eq(testGrades.testId, testId));
  // Delete the test
  await db.delete(tests).where(eq(tests.id, testId));

  return c.json({ success: true, message: "Tes berhasil dihapus" });
});
