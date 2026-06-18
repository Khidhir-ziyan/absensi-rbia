# AGENT.md — Working Guide for AI Assistant

This document contains the primary rules that the AI assistant (Claude / Claude Code) must follow when helping develop the **Class Attendance System**. The following supporting documents must be read alongside it:

- `prd-absensi.md` — product requirements, workflows, and complete data schema
- `DESIGN.md` — visual design tokens (colors, typography, components) inspired by Linear
- `SKILL.md` — backend technical guidelines (Hono + Drizzle + D1 on Cloudflare Workers)
- `SKILL-FRONTEND.md` — frontend technical guidelines (React + Tailwind)
- `SKILL-SECURITY.md` — mandatory security checklist

---

# 1. AI Assistant Role

The AI assistant acts as a **pair programmer**, not a product decision maker.

If there is any ambiguity in the requirements that is not covered in `prd-absensi.md`, the AI **must ask the user first** instead of making assumptions — especially regarding data structures, entity relationships, or authentication/role behavior.

---

# 2. General Principles

- **Consistency comes before speed.**
  It is better to write less code that remains consistent with existing project patterns than to write a lot of code with inconsistent styles across files.

- **Do not over-engineer.**
  This project has a small-to-medium scope (single role: Teacher). Do not introduce abstractions or libraries that are not requested in the PRD (e.g., Redis, microservices, GraphQL, etc.) unless explicitly requested.

- **Scalability should follow the PRD, not assumptions.**
  The PRD already specifies which parts should be prepared for scalability (for example, the `Role` enum despite having only one value, soft-delete support). Follow those requirements and do not add additional scalability layers unless requested.

- **Always check the Drizzle schema in `prd-absensi.md` §7 before creating new models.**
  Do not create tables or relationships that deviate from the agreed schema unless the user explicitly requests schema changes.

---

# 3. Roles & Responsibility Distribution

| Role / Area | Responsibilities | Reference Documents |
|--------------|-----------------|---------------------|
| **Backend Engineer (AI when working in `backend/`)** | API routes, authentication middleware, input validation, Drizzle queries, PDF generation | `SKILL.md` |
| **Frontend Engineer (AI when working in `frontend/`)** | React components, styling according to `DESIGN.md`, state management, API calls | `SKILL-FRONTEND.md`, `DESIGN.md` |
| **Security Reviewer (AI when reviewing or before deployment)** | Verify the checklist in `SKILL-SECURITY.md` before considering the code complete | `SKILL-SECURITY.md` |

The AI **must not mix responsibilities**. For example, do not place heavy business logic inside React components or HTML/styling inside backend controllers.

---

# 4. Clean Code — Mandatory Rules

- Use consistent English naming conventions:
  - `camelCase` for variables and functions.
  - `PascalCase` for React components.
  - `snake_case` for database table and column names (Drizzle convention).
  - Comments and documentation may be written in Indonesian.

- One function/component = one clear responsibility.
  If a controller or component file exceeds approximately 150 lines, the AI should propose splitting it into smaller files/functions.

- Avoid magic strings for statuses (`"PRESENT"`, `"COMPLETED"`, etc.).
  Define status constants in `lib/constants.ts` (backend) and `lib/constants.ts` (frontend), validated via Zod enums. Both sides must stay in sync.

- Every API endpoint must include explicit error handling (`try-catch` and proper HTTP status responses). Raw errors must never leak to the client.

- Do not leave commented-out code (`// commented out`) in the final commit. Remove unused code before considering the feature complete.

---

# 5. Recommended Workflow

1. The AI reads `prd-absensi.md` and `DESIGN.md` before implementing a new feature.

2. The AI implements the backend first (models, endpoints, validation) before the frontend so that the frontend has a clear API contract.

3. For every new endpoint, the AI should briefly describe:
   - HTTP method
   - Path
   - Request body
   - Response shape

   This allows the user to cross-check with the PRD requirements.

4. Before declaring a feature "complete", the AI must review the relevant checklist in `SKILL-SECURITY.md`.

---

# 6. Actions the AI Must NOT Perform Without User Confirmation

- Modify the Drizzle schema that has already been agreed upon in the PRD.

- Perform hard deletes on `Class` or `Subject` entities (the PRD requires soft deletes).

- Store passwords in plain text.

- Add large dependencies or libraries (such as state management libraries, major UI kits, etc.) without first explaining the reason to the user.
