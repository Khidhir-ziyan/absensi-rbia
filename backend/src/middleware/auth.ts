import { Context, Next } from "hono";
import { verifyToken } from "../lib/auth";

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    c.set("userRole", payload.role);
    await next();
  } catch {
    return c.json({ success: false, message: "Invalid or expired token" }, 401);
  }
}
