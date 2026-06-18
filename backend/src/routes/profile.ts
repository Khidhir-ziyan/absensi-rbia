import { Hono } from "hono";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDB } from "../lib/db";
import { users } from "../schema";
import { updateProfileSchema, changePasswordSchema } from "../validators/profile.schema";

type Bindings = { DB: D1Database; JWT_SECRET: string };
type Variables = { userId: string };

export const profileRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /profile — get current user profile
profileRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDB(c.env.DB);

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ success: false, message: "User not found" }, 404);
  }

  return c.json({ success: true, data: user });
});

// PUT /profile — update profile (name, email)
profileRoutes.put("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = updateProfileSchema.parse(body);
  const db = getDB(c.env.DB);

  if (data.email) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (existing && existing.id !== userId) {
      return c.json({ success: false, message: "Email sudah digunakan" }, 400);
    }
  }

  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const updated = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return c.json({ success: true, data: updated });
});

// PUT /profile/password — change password
profileRoutes.put("/password", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = changePasswordSchema.parse(body);
  const db = getDB(c.env.DB);

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ success: false, message: "User not found" }, 404);
  }

  const valid = await bcrypt.compare(data.currentPassword, user.password);
  if (!valid) {
    return c.json({ success: false, message: "Password saat ini salah" }, 400);
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return c.json({ success: true, data: { message: "Password berhasil diubah" } });
});
