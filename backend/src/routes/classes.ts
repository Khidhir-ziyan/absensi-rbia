import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { getDB } from "../lib/db";
import { classes } from "../schema";
import { createClassSchema, updateClassSchema } from "../validators/class.schema";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const classRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /classes — list all classes for the teacher
classRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDB(c.env.DB);

  const rows = await db
    .select()
    .from(classes)
    .where(and(eq(classes.teacherId, userId), isNull(classes.deletedAt)));

  return c.json({ success: true, data: rows });
});

// POST /classes — create a class
classRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = createClassSchema.parse(body);
  const db = getDB(c.env.DB);

  const id = crypto.randomUUID();
  await db.insert(classes).values({
    id,
    name: data.name,
    description: data.description ?? null,
    teacherId: userId,
  });

  const created = await db.select().from(classes).where(eq(classes.id, id)).get();
  return c.json({ success: true, data: created }, 201);
});

// PUT /classes/:id — update a class
classRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const classId = c.req.param("id");
  const body = await c.req.json();
  const data = updateClassSchema.parse(body);
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  if (!existing) {
    return c.json({ success: false, message: "Class not found" }, 404);
  }

  await db
    .update(classes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(classes.id, classId));

  const updated = await db.select().from(classes).where(eq(classes.id, classId)).get();
  return c.json({ success: true, data: updated });
});

// DELETE /classes/:id — soft delete
classRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const classId = c.req.param("id");
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, userId), isNull(classes.deletedAt)))
    .get();

  if (!existing) {
    return c.json({ success: false, message: "Class not found" }, 404);
  }

  await db
    .update(classes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(classes.id, classId));

  return c.json({ success: true, data: { message: "Class deleted" } });
});
