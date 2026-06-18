import { Context } from "hono";
import { ZodError } from "zod";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        message: "Validation error",
        errors: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400
    );
  }

  console.error("Unhandled error:", err);
  return c.json({ success: false, message: "Internal server error" }, 500);
}
