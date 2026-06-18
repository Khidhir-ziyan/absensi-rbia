# SKILL-FRONTEND.md — Frontend (React + Tailwind)

Technical guidelines for the frontend of the Class Attendance System. Read in conjunction with `AGENT.md`, `DESIGN.md` (visual tokens must be strictly followed), and `SKILL-SECURITY.md`.

## 1. Stack & Versions

- React (Vite as build tool)
- Tailwind CSS — token-based styling from `DESIGN.md`
- React Router — navigation between pages
- Axios (or fetch wrapper) — communication with the backend
- Context API or Zustand (lightweight) for auth state — **do not** add Redux unless absolutely necessary; this is a small project.

## 2. Required Folder Structure

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── KelasListPage.jsx
│   │   ├── KelasDetailPage.jsx       # list of Subjects & Students in 1 class
│   │   ├── MapelDetailPage.jsx       # Meeting history per Subject
│   │   ├── AbsensiPage.jsx           # daily checklist form when Meeting is ONGOING
│   │   └── RekapPage.jsx             # recap page + PDF export button
│   ├── components/
│   │   ├── ui/                       # Button, Card, Badge, Input, etc. (per DESIGN.md)
│   │   └── absensi/                  # attendance feature-specific components
│   ├── lib/
│   │   ├── api.js                    # axios instance + JWT interceptor
│   │   └── constants.js              # status enums (PRESENT, SICK, LEAVE, ABSENT) synced with backend
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── styles/
│   │   └── tokens.css                # derived CSS variables from DESIGN.md
│   └── App.jsx
├── tailwind.config.js
├── .env (VITE_API_URL)
└── DESIGN.md
