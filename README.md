# Absensi RBIA

Sistem absensi kelas berbasis web untuk guru. Mencatat kehadiran siswa, mengelola mata pelajaran, dan menghasilkan laporan PDF.

## Tech Stack

**Backend:**
- [Hono](https://hono.dev) — Web framework
- [Cloudflare Workers](https://workers.cloudflare.com) — Runtime
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — Database (SQLite)
- [Drizzle ORM](https://orm.drizzle.team) — Database ORM
- [Resend](https://resend.com) — Email notifications

**Frontend:**
- [React](https://react.dev) + TypeScript
- [Vite](https://vitejs.dev) — Build tool
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Lucide React](https://lucide.dev) — Icons

## Features

- ✅ Kelola kelas dan mata pelajaran
- ✅ Tambah/edit/hapus siswa
- ✅ Catat kehadiran per pertemuan (Hadir/Sakit/Izin/Alpa)
- ✅ Jadwal mengajar dengan pengingat email otomatis
- ✅ Rekap absensi + export PDF
- ✅ Autentikasi (register, login, lupa password)
- ✅ Dark/light mode
- ✅ Responsive (desktop & mobile)

## Project Structure

```
absensi-rbia/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Hono entry point
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, error handling
│   │   ├── validators/        # Zod schemas
│   │   └── lib/               # DB, auth, email, PDF
│   ├── drizzle/migrations/    # Database migrations
│   ├── wrangler.toml          # Cloudflare config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── context/           # Auth & Theme context
│   │   ├── lib/               # API client, constants
│   │   └── styles/            # CSS tokens
│   ├── index.html
│   └── package.json
└── .claude/                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- Cloudflare account (for deployment)

### Local Development

**1. Clone & install:**
```bash
git clone https://github.com/YOUR_USERNAME/absensi-rbia.git
cd absensi-rbia

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**2. Setup backend:**
```bash
cd backend

# Create local D1 database
npx wrangler d1 create absensi-rbia --local

# Run migrations
npx wrangler d1 migrations apply absensi-rbia --local

# Create .dev.vars
echo JWT_SECRET=dev-secret-change-in-production > .dev.vars
echo RESEND_API_KEY= >> .dev.vars
echo TIMEZONE_OFFSET=7 >> .dev.vars
echo FRONTEND_URL=http://localhost:5173 >> .dev.vars

# Start dev server (port 8787)
npm run dev
```

**3. Setup frontend:**
```bash
cd frontend

# Create .env
echo VITE_API_URL=http://localhost:8787/api/v1 > .env

# Start dev server (port 5173)
npm run dev
```

**4. Seed sample data (optional):**
```bash
cd backend
npx tsx src/seed.ts
npx wrangler d1 execute absensi-rbia --local --file=seed.sql
```

Test credentials: `guru@rbia.com` / `password123`

## Deployment

### Backend (Cloudflare Workers)

```bash
cd backend

# Create remote D1 database
npx wrangler d1 create absensi-rbia

# Update wrangler.toml with your database_id

# Run migrations
npx wrangler d1 migrations apply absensi-rbia --remote

# Set secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY

# Deploy
npm run deploy
```

### Frontend (Cloudflare Pages)

```bash
cd frontend

# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=absensi-rbia
```

### Environment Variables

**Backend** (set via `wrangler secret`):
| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret for JWT token signing |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `TIMEZONE_OFFSET` | Timezone offset from UTC (7=WIB, 8=WITA, 9=WIT) |
| `FRONTEND_URL` | Frontend URL for password reset links |

**Frontend** (set in `.env` or Cloudflare Pages):
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new teacher |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET/POST | `/api/v1/classes` | List/create classes |
| PUT/DELETE | `/api/v1/classes/:id` | Update/delete class |
| GET/POST | `/api/v1/subjects` | List/create subjects |
| PUT/DELETE | `/api/v1/subjects/:id` | Update/delete subject |
| GET/POST | `/api/v1/students` | List/create students |
| PUT/DELETE | `/api/v1/students/:id` | Update/delete student |
| POST | `/api/v1/sessions/start` | Start new session |
| PUT | `/api/v1/sessions/:id/attendance` | Submit attendance |
| PUT | `/api/v1/sessions/:id/finish` | Complete session |
| GET | `/api/v1/summary` | Attendance summary |
| GET | `/api/v1/summary/export-pdf` | Export PDF |
| GET | `/api/v1/schedules` | Get scheduled subjects |
| GET/PUT | `/api/v1/profile` | Get/update profile |

## License

MIT
