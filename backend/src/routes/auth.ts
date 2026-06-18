import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDB } from "../lib/db";
import { signToken } from "../lib/auth";
import { users, passwordResets } from "../schema";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.schema";
import { sendEmail, resetPasswordEmail } from "../lib/email";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  FRONTEND_URL: string;
};

export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const data = registerSchema.parse(body);
  const db = getDB(c.env.DB);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .get();

  if (existing) {
    return c.json(
      { success: false, message: "Email sudah terdaftar" },
      400
    );
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  const token = await signToken(
    { sub: id, email: data.email, role: "TEACHER" },
    c.env.JWT_SECRET
  );

  return c.json({ success: true, data: { token } }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const data = loginSchema.parse(body);
  const db = getDB(c.env.DB);

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .get();

  if (!user) {
    return c.json(
      { success: false, message: "Email atau password salah" },
      401
    );
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    return c.json(
      { success: false, message: "Email atau password salah" },
      401
    );
  }

  const token = await signToken(
    { sub: user.id, email: user.email, role: user.role },
    c.env.JWT_SECRET
  );

  return c.json({
    success: true,
    data: { token, user: { id: user.id, name: user.name, email: user.email } },
  });
});

// POST /auth/forgot-password — send reset link via email
authRoutes.post("/forgot-password", async (c) => {
  const body = await c.req.json();
  const data = forgotPasswordSchema.parse(body);
  const db = getDB(c.env.DB);

  // Always return success to prevent email enumeration
  const successResponse = {
    success: true,
    message: "Jika email terdaftar, link reset password akan dikirim",
  };

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .get();

  if (!user) {
    return c.json(successResponse);
  }

  // Generate secure token
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token
  await db.insert(passwordResets).values({
    id: crypto.randomUUID(),
    userId: user.id,
    token,
    expiresAt,
  });

  // Send email if API key is configured
  const apiKey = c.env.RESEND_API_KEY;
  if (apiKey) {
    const frontendUrl = c.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const html = resetPasswordEmail({
      name: user.name,
      resetLink,
    });

    await sendEmail(apiKey, {
      to: user.email,
      subject: "Reset Password - Absensi RBIA",
      html,
    });
  }

  return c.json(successResponse);
});

// POST /auth/reset-password — reset password with token
authRoutes.post("/reset-password", async (c) => {
  const body = await c.req.json();
  const data = resetPasswordSchema.parse(body);
  const db = getDB(c.env.DB);

  // Find valid reset token
  const reset = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.token, data.token),
        eq(passwordResets.used, false)
      )
    )
    .get();

  if (!reset) {
    return c.json(
      { success: false, message: "Token tidak valid atau sudah digunakan" },
      400
    );
  }

  // Check expiration
  if (new Date() > reset.expiresAt) {
    return c.json(
      { success: false, message: "Token sudah kadaluarsa. Silakan minta link baru." },
      400
    );
  }

  // Update password
  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, reset.userId));

  // Mark token as used
  await db
    .update(passwordResets)
    .set({ used: true })
    .where(eq(passwordResets.id, reset.id));

  return c.json({
    success: true,
    message: "Password berhasil diubah. Silakan login dengan password baru.",
  });
});
