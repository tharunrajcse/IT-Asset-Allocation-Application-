# IT Asset Procurement & Management System

A full-stack IT asset procurement and management platform for requesting, approving, procuring, allocating, tracking, and returning IT assets.

## Overview

This project is a monorepo containing a backend API and a frontend web application.

- `backend/` - Express API, Prisma ORM, database schema, authentication, export generation
- `frontend/` - React + Vite application with role-based dashboards and workflows

## Features

- Secure authentication with JWT
- Role-based dashboards for Employees, Managers, Procurement, and Finance
- Asset request creation and tracking
- Manager approval/rejection workflows
- Procurement purchase order management with status updates
- PDF receipt generation for purchase orders
- Excel export support
- Asset allocation and return workflows
- Responsive UI and clean dashboard experience

## Roles and functionality

### Employee

- Submit asset requests
- Review request status
- View assigned assets and return items

### Manager

- Review employee requests
- Approve or reject requests
- Route approved requests to procurement

### Procurement

- Create purchase orders from approved requests
- Update purchase order status to Ordered, Shipped, Delivered
- Download PDF receipts for purchase orders

### Finance

- Review purchase data and invoices
- Mark invoices as Paid
- Track payment statuses

## Tech stack

### Backend

- Node.js
- Express
- Prisma
- SQLite
- JSON Web Tokens (JWT)
- Zod validation
- PDF generation with `pdfkit`
- Excel export with `exceljs`
- Password hashing with `bcryptjs`
- Environment management with `dotenv`
- CORS support with `cors`

### Frontend

- React
- Vite
- React Router
- TypeScript

## Modules used

### Backend dependencies

- `@prisma/client`
- `bcryptjs`
- `cors`
- `dotenv`
- `exceljs`
- `express`
- `jsonwebtoken`
- `pdfkit`
- `zod`

### Backend devDependencies

- `prisma`
- `tsx`
- `typescript`
- `@types/cors`
- `@types/express`
- `@types/jsonwebtoken`
- `@types/node`

### Frontend dependencies

- `react`
- `react-dom`
- `react-router-dom`

### Frontend devDependencies

- `@vitejs/plugin-react`
- `typescript`
- `vite`
- `@types/react`
- `@types/react-dom`

## Prerequisites

- Node.js 18+ (recommended 20+)

## Setup and development

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.




