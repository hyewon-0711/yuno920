# Yuno920 Agent Guide

This file gives Codex the project context and operating rules for this repository.

## Project Overview

Yuno920 is a child growth and parenting support app.

- Frontend: Next.js App Router, TypeScript, CSS Modules, Tailwind CSS setup
- Backend: FastAPI, Python
- Database/Auth: Supabase
- AI: OpenAI API through the backend
- Frontend deployment: Vercel
- Backend deployment: Render, based on `backend/render.yaml`

## Repository Layout

- `frontend/`: Next.js application
- `backend/`: FastAPI application
- `supabase/migrations/`: SQL migrations for Supabase
- `docs/`: product specs, design notes, API notes, and sprint records

## Working Rules

- Check `git status --short --branch` before making changes.
- Do not overwrite or revert user changes unless explicitly asked.
- Keep changes scoped to the requested task.
- Prefer existing local patterns over introducing new abstractions.
- Use `rg` or `rg --files` for code search.
- Use `apply_patch` for manual file edits.
- Do not commit secrets or real environment values.

## Frontend

Work from `frontend/`.

Common commands:

```powershell
npm install
npm run dev
npm run lint
npm run build
```

Notes:

- Package manager: npm, with `frontend/package-lock.json`.
- Main source path: `frontend/src`.
- App routes live under `frontend/src/app`.
- Shared UI components live under `frontend/src/components`.
- Shared browser/client helpers live under `frontend/src/lib`.
- Supabase browser client is configured in `frontend/src/lib/supabase.ts`.
- Backend API base URL is configured in `frontend/src/lib/api.ts`.

Required frontend environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## Backend

Work from `backend/`.

Common commands:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Required backend environment variables:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `APP_TIMEZONE` defaults to `Asia/Seoul` when configured for deployment

Backend deployment is described in `backend/render.yaml`.

## Supabase

- Put schema changes in `supabase/migrations/`.
- Keep migration names sequential and descriptive.
- Review row-level security changes carefully.
- Do not place Supabase service role keys in frontend code.

## Deployment

Frontend deployment uses Vercel.

Expected Vercel settings:

- Root directory: `frontend`
- Install command: `npm install`
- Build command: `npm run build`
- Framework preset: Next.js

Backend deployment appears to use Render from `backend/render.yaml`.

Confirmed production settings:

- Production frontend domain: `https://www.yuno920.com`
- Production backend URL: `https://yuno920-api.onrender.com`
- Supabase migrations are applied manually by the project owner.

## Verification

Before handing off frontend changes, run:

```powershell
cd frontend
npm run lint
npm run build
```

Before handing off backend changes, run the smallest relevant backend check available. If no automated test exists for the touched area, state that clearly.

## Deployment-Sensitive Changes

Before changing production URLs, deployment settings, auth redirects, or Supabase migration behavior, confirm the change with the project owner.
