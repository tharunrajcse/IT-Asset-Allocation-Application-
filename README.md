# IT Asset Procurement & Management System

Full-stack system to request, approve, procure, track, allocate, maintain, and return IT assets.

## Tech stack

- Backend: Node.js + Express + Prisma (SQLite) + JWT auth
- Frontend: React (Vite) + React Router
- Exports: PDF (pdfkit) and Excel (exceljs)

## Monorepo structure

- `backend/` API + DB
- `frontend/` Web app

## Prerequisites

- Node.js 18+ (recommended 20+)

## Quick start (dev)

### 1) Backend

```bash
cd backend
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.


