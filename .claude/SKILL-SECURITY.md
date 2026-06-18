# SKILL-SECURITY.md — Mandatory Security Checklist

This document contains the items that the AI assistant **must verify** before considering a feature complete. It should be read together with `AGENT.md`, `SKILL.md` (backend — Hono + Drizzle + D1), and `SKILL-FRONTEND.md`.

---

# 1. Authentication & Passwords

* [ ] User passwords are **never** stored in plain text. Always hash passwords using `bcryptjs` (minimum salt rounds: 10) before saving them to the database. Use the pure-JS `bcryptjs` package (not `bcrypt`) for Cloudflare Workers compatibility.
* [ ] `JWT_SECRET` is stored in `.env`, **never** hardcoded in source code, and **never** committed to Git.
* [ ] JWT tokens must have an expiration time (`expiresIn`, e.g. 7 days). Tokens without expiration are not allowed.
* [ ] The login endpoint must not reveal whether the email or password is incorrect. Use a generic error message such as:

```text
Invalid email or password
```

to prevent user enumeration attacks.

---

# 2. Authorization

* [ ] Every endpoint that reads or modifies data (`Class`, `Subject`, `Student`, `Session`, `AttendanceRecord`) **must** filter data using `teacherId` obtained from the verified JWT token—not from `req.body` or `req.params`, which can be manipulated by clients.

* [ ] No endpoint should be accessible without passing through JWT verification middleware, except:

  * `/auth/login`
  * `/auth/register`

* [ ] JWT middleware must validate both the token signature and expiration time, not simply decode the token without verification.

---

# 3. Input Validation

* [ ] All request bodies must be validated (using `zod` or a similar library) before processing, including:

  * data types
  * string lengths
  * formats (e.g. session date format)

* [ ] IDs received from URL parameters (`req.params.id`) must be validated before being used in Prisma queries to prevent unexpected errors or parameter injection.

* [ ] Attendance endpoints that accept arrays of students must verify that every `studentId` actually belongs to the class associated with the Session. This prevents malicious users from inserting attendance records for students outside their ownership.

---

# 4. Database & Queries

* [ ] All database access must go through Drizzle ORM (which parameterizes queries automatically). Avoid raw SQL strings that concatenate user input.

* [ ] Raw SQL via `db.all(sql`...`)` should be avoided unless absolutely necessary and only after sanitizing input.

* [ ] Listing queries must always include:

```js
deletedAt: null
```

for entities using soft delete, ensuring deleted records do not reappear.

* [ ] The Drizzle unique constraint on `attendance_records`:

```ts
unique("attendance_session_student").on(table.sessionId, table.studentId)
```

must not be removed or modified without explicit confirmation, since it prevents duplicate attendance records.

---

# 5. Configuration & Secrets

* [ ] `.dev.vars` (Cloudflare Workers local secrets) must be included in `.gitignore` from the beginning and never committed.

* [ ] `.env.example` must be provided without actual secret values so collaborators know which environment variables are required (e.g., `JWT_SECRET`).

* [ ] CORS configuration should specify the frontend origin explicitly instead of:

```ts
app.use("*", cors({ origin: "*" }))
```

especially when approaching production deployment. Use:

```ts
app.use("*", cors({ origin: "https://your-frontend.pages.dev" }))
```

---

# 6. Frontend

* [ ] JWT tokens stored in `localStorage` must be automatically removed when the backend returns a `401 Unauthorized` response (expired or invalid token).

* [ ] Sensitive data (passwords, JWT secrets, etc.) must never be logged to the browser console in production.

* [ ] Input forms (especially fields that may later include parent contact numbers or student IDs) must never display students from classes that do not belong to the currently authenticated teacher.

  Although this validation primarily belongs to the backend, the frontend should not assume or fetch cross-teacher data.

---

# 7. Before a Feature Is Considered "Complete"

Whenever the AI assistant finishes implementing a new backend feature, it **must explicitly inform the user**:

1. Which items from this checklist have already been satisfied.
2. Which items are still missing or require attention.

For example:

> "This endpoint already filters data by `teacherId`, but I haven't added Zod validation yet. Would you like me to add it now?"

This transparency ensures that incomplete security measures are clearly communicated and prevents features from being incorrectly assumed to be production-ready.
