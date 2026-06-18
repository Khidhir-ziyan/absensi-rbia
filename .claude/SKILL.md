# SKILL.md — Backend (Hono + Drizzle + D1 on Cloudflare Workers)

Technical guidelines for the backend of the Class Attendance System. This document should be read together with `AGENT.md` (general rules) and `SKILL-SECURITY.md` (security checklist).

---

# 1. Stack & Versions

* Cloudflare Workers — serverless edge runtime
* Hono — lightweight web framework built for the edge
* Drizzle ORM — type-safe SQL ORM, D1-compatible
* Cloudflare D1 — serverless SQLite database
* jose — JWT handling (edge-compatible, replaces jsonwebtoken)
* zod — request body validation
* bcryptjs — password hashing (pure JS, Workers-compatible)
* pdfkit — PDF generation

---

# 2. Required Folder Structure

```text
backend/
├── drizzle/
│   └── migrations/              # Generated SQL migration files
├── src/
│   ├── index.ts                 # Hono app entry, mounts all routes
│   ├── routes/
│   │   ├── auth.ts              # POST /api/v1/auth/login, /register
│   │   ├── classes.ts           # CRUD classes (soft delete)
│   │   ├── subjects.ts          # CRUD subjects (soft delete, bound to class)
│   │   ├── students.ts          # CRUD students (bound to class)
│   │   ├── sessions.ts          # Start/finish/unfinish sessions + attendance
│   │   └── summary.ts           # Attendance summary + PDF export
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification middleware
│   │   └── error.ts             # Global error handler
│   ├── validators/
│   │   └── *.schema.ts          # Zod schemas per entity
│   └── lib/
│       ├── db.ts                # Drizzle D1 client setup
│       └── auth.ts              # JWT sign/verify helpers using jose
├── drizzle.config.ts
├── wrangler.toml                # D1 binding, Worker config
├── .dev.vars                    # Local secrets (JWT_SECRET, etc.) — not committed
├── .env.example                 # Template for required env vars
├── package.json
└── tsconfig.json
```

Do not put all business logic inside `index.ts`. Each layer (route → validator → Drizzle query) must be clearly separated.

---

# 3. Hono App Setup

```ts
// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { authRoutes } from "./routes/auth";
import { classRoutes } from "./routes/classes";
// ... other routes

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors({ origin: "https://your-frontend.pages.dev" }));
app.onError(errorHandler);

app.route("/api/v1/auth", authRoutes);

// Protected routes — JWT middleware applied per group
const api = new Hono<{ Bindings: Bindings }>();
api.use("*", authMiddleware);
api.route("/classes", classRoutes);
api.route("/subjects", subjectRoutes);
api.route("/students", studentRoutes);
api.route("/sessions", sessionRoutes);
api.route("/summary", summaryRoutes);

app.route("/api/v1", api);

export default app;
```

---

# 4. Drizzle + D1 Setup

```ts
// src/lib/db.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../schema";

export function getDB(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema });
}
```

Usage in routes:

```ts
// Access D1 binding from Hono context
const db = getDB(c.env);
const result = await db.select().from(classes).where(eq(classes.teacherId, userId));
```

---

# 5. API Conventions

* All endpoints must begin with `/api/v1/...` for future versioning.
* Successful response:

```json
{
  "success": true,
  "data": ...
}
```

* Error response:

```json
{
  "success": false,
  "message": "..."
}
```

Use appropriate HTTP status codes:

* `400` → validation error
* `401` → authentication failure
* `403` → forbidden
* `404` → resource not found
* `500` → server error

All endpoints except:

* `/api/v1/auth/login`
* `/api/v1/auth/register`

must be protected by JWT middleware.

---

## Core Endpoints (Derived from the PRD)

| Method                    | Path                            | Description                                                                     |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| POST                      | /api/v1/auth/register           | Register teacher account                                                        |
| POST                      | /api/v1/auth/login              | Login and return JWT                                                            |
| GET / POST / PUT / DELETE | /api/v1/classes                 | CRUD Class (DELETE = soft delete)                                               |
| GET / POST / PUT / DELETE | /api/v1/subjects                | CRUD Subject (bound to classId, DELETE = soft delete)                           |
| GET / POST / PUT / DELETE | /api/v1/students                | CRUD Student (bound to classId)                                                 |
| POST                      | /api/v1/sessions/start          | Start a new session (subjectId, topic, date)                                    |
| PUT                       | /api/v1/sessions/:id/finish     | Mark session as COMPLETED, validate and auto-assign ABSENT to unfilled students |
| PUT                       | /api/v1/sessions/:id/unfinish   | Revert session back to IN_PROGRESS                                              |
| PUT / POST                | /api/v1/sessions/:id/attendance | Create/update attendance checklist                                              |
| GET                       | /api/v1/summary/export-pdf      | Generate PDF report for all classes and subjects owned by the logged-in teacher |

---

# 6. Authorization Rules (Important)

Every query that retrieves or modifies Classes, Subjects, Students, or Sessions **must be filtered using the `teacherId` obtained from the JWT token**, not from request parameters that can be manipulated by clients.

Correct pattern:

```ts
// userId comes from JWT middleware, NOT from c.req.param() or body
const classData = await db.select().from(classes).where(
  and(
    eq(classes.id, classId),
    eq(classes.teacherId, userId),
    isNull(classes.deletedAt)
  )
).get();

if (!classData) {
  return c.json({ success: false, message: "Class not found" }, 404);
}
```

---

# 7. Soft Delete Pattern

According to the PRD, `classes` and `subjects` use soft delete via the `deletedAt` column.

Soft delete:

```ts
await db.update(classes)
  .set({ deletedAt: new Date() })
  .where(eq(classes.id, classId));
```

All listing queries must exclude deleted records:

```ts
await db.select().from(classes).where(
  and(
    eq(classes.teacherId, userId),
    isNull(classes.deletedAt)
  )
);
```

---

# 8. Input Validation

Use `zod` inside the `validators/` layer and invoke validation as middleware before route handlers.

```ts
// validators/class.schema.ts
import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});
```

Route handlers must never receive raw request data without validation, especially attendance endpoints that process large arrays of students.

---

# 9. PDF Report Generation

Use `pdfkit` (lighter and suitable for simple tables).

Follow the aggregation flow defined in PRD §7:

```text
Classes
    ↓
Subjects
    ↓
Completed Sessions
    ↓
Attendance Records
    ↓
Aggregate by Student
    ↓
Group by Class → Subject
    ↓
Generate a single PDF document
```

Note: `pdfkit` runs on Workers but generates the PDF in memory. For large reports, consider streaming the response:

```ts
return new Response(pdfBuffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=attendance-report.pdf",
  },
});
```

---

# 10. Seed Data

Create a seed script (e.g., `src/seed.ts` or a separate script that uses the D1 API) that populates:

* 1 teacher account (password hashed using bcryptjs)
* 2 classes
* Several subjects for each class
* Several students for each class
* At least 1 sample session with attendance records

This allows the application flow to be tested immediately without requiring manual data entry.

---

# 11. Wrangler Configuration

```toml
# wrangler.toml
name = "absensi-rbia-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "absensi-rbia"
database_id = "<your-d1-database-id>"
```

Local secrets in `.dev.vars` (not committed):

```
JWT_SECRET=your-secret-here
```
