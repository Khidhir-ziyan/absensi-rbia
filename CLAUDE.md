# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**absesnsi-rbia** — A class attendance system for RBIA. Teachers manage classes, subjects, and students, then record attendance per session (Present/Sick/Excused/Absent) with topic tracking. Attendance summaries exportable as PDF.

## Tech Stack

- **Backend:** Hono (lightweight web framework, edge-native)
- **Runtime:** Cloudflare Workers (deploy), Wrangler (local dev)
- **Database:** Cloudflare D1 (SQLite at the edge)
- **ORM:** Drizzle ORM (type-safe, D1-compatible)
- **Auth:** JWT (jsonwebtoken or jose for edge compatibility)
- **Validation:** Zod
- **PDF:** pdfkit
- **Frontend:** React + Vite + Tailwind CSS

## Commands

### Backend (from `backend/`)
```
npm run dev              # Start local dev server (wrangler dev)
npm run deploy           # Deploy to Cloudflare Workers
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Apply migrations to local D1
npm run seed             # Generate seed.sql from src/seed.ts
npm run typecheck        # TypeScript type checking
```

### Frontend (from `frontend/`)
```
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run typecheck        # TypeScript type checking
```

### Seed Data
```bash
cd backend
npx tsx src/seed.ts                              # Generate seed.sql
npx wrangler d1 execute absensi-rbia --local --file=seed.sql  # Apply to local D1
```
Test credentials: `guru@rbia.com` / `password123`

## Architecture

### Backend (`backend/`)

```
backend/
├── src/
│   ├── index.ts           # Hono app entry, mounts all routes
│   ├── routes/            # Route handlers grouped by domain
│   │   ├── auth.ts        # POST /api/v1/auth/login, /register
│   │   ├── classes.ts     # CRUD classes (soft delete)
│   │   ├── subjects.ts    # CRUD subjects (soft delete, bound to class)
│   │   ├── students.ts    # CRUD students (bound to class)
│   │   ├── sessions.ts    # Start/finish/unfinish sessions + attendance
│   │   └── summary.ts     # Attendance summary + PDF export
│   ├── middleware/         # JWT verification, error handler
│   ├── validators/        # Zod schemas per entity
│   └── lib/
│       ├── db.ts          # Drizzle D1 client setup
│       ├── auth.ts        # JWT helpers (jose)
│       ├── pdf.ts         # PDF generation with pdfkit
│       └── constants.ts   # Status enums
├── drizzle/               # Migration files
├── drizzle.config.ts
├── wrangler.toml          # D1 binding, Worker config
└── package.json
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── pages/             # LoginPage, KelasListPage, KelasDetailPage, etc.
│   ├── components/
│   │   ├── ui/            # Button, Card, Badge, Input (per DESIGN.md)
│   │   └── absensi/       # Attendance-specific components
│   ├── lib/
│   │   ├── api.ts         # Fetch wrapper + JWT interceptor
│   │   └── constants.ts   # Status enums synced with backend
│   ├── context/           # AuthContext
│   └── styles/            # tokens.css from DESIGN.md
├── tailwind.config.js
└── vite.config.ts
```

### API Conventions

- All endpoints: `/api/v1/...`
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "message": "..." }`
- Status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server)
- All routes except `/auth/login` and `/auth/register` require JWT

### Data Model (Drizzle)

Core tables: `users`, `classes`, `subjects`, `students`, `sessions`, `attendance_records`

- `classes` and `subjects` use soft delete (`deletedAt` column)
- Students auto-participate in all subjects of their class (no per-subject enrollment)
- Unique constraint: `(sessionId, studentId)` prevents duplicate attendance
- Authorization: every query filters by `teacherId` from JWT, never from request body

### Design System

See `.claude/DESIGN.md` — Perplexity-inspired dark/light theme with teal accent (`#20B2AA`). System font stack, 720px max content width. Frontend components must follow these tokens strictly.

## Key Rules

- **Read `.claude/AGENT.md` before implementing any feature** — it defines the AI pair-programmer contract
- **Read `.claude/SKILL-SECURITY.md` before declaring any feature complete** — mandatory security checklist
- Backend first, then frontend — frontend needs a clear API contract
- Do not mix business logic into React components or styling into route handlers
- Every new endpoint must be briefly documented: method, path, request body, response shape
- Never hard-delete `Class` or `Subject` — use soft delete
- Never store passwords in plain text — always bcrypt
- JWT `teacherId` is the source of truth for authorization, never trust client-supplied IDs
- Do not over-engineer — no Redis, microservices, GraphQL unless explicitly requested

## Documents

All project docs live in `.claude/`:

- `prd-absensi.md` — Full PRD, user flows, data schema
- `AGENT.md` — AI assistant working rules and responsibilities
- `DESIGN.md` — Visual design tokens (Perplexity-inspired theme)
- `SKILL.md` — Backend technical guidelines (Hono + Drizzle + D1)
- `SKILL-FRONTEND.md` — Frontend technical guidelines (React + Tailwind)
- `SKILL-SECURITY.md` — Mandatory security checklist
