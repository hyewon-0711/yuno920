# Harness 100 Adaptation For Yuno920

This document adapts the GitHub `revfactory/harness-100` workflows to this Codex-managed repository.

Source harnesses reviewed:

- `16-fullstack-webapp`
- `19-database-architect`
- `21-code-reviewer`
- `24-test-automation`
- `41-llm-app-builder`

Harness 100 is written for Claude Code and uses `.claude/agents` plus `.claude/skills`. Codex does not consume those files directly, so this repository uses the workflow ideas rather than copying `.claude/` into source control.

## Repository Mapping

Use the existing project structure instead of Harness 100's generic `src/` output.

- Frontend source: `frontend/src`
- Backend source: `backend/app`
- Supabase migrations: `supabase/migrations`
- Product/design context: `docs`
- Temporary planning or review artifacts: `_workspace`

Do not commit generated `_workspace` files unless the user explicitly asks to preserve a plan, review, or design artifact.

## Fullstack Feature Mode

Use this mode for product features that touch user experience, API behavior, Supabase data, or deployment.

Workflow:

1. Clarify the smallest useful behavior from the request.
2. Inspect existing routes, hooks, components, API handlers, migrations, and docs.
3. Summarize implementation impact:
   - frontend pages/components
   - backend endpoints/services
   - Supabase schema/RLS
   - env/deployment impact
   - verification commands
4. Implement in the existing project layout.
5. Verify with the narrowest useful checks, usually:

```powershell
cd frontend
npm run lint
npm run build
```

6. If backend behavior changed, run the smallest relevant FastAPI check available.
7. Report changed files, verification, and any manual deployment or Supabase step.

Default Yuno920 stack assumptions:

- Frontend: Next.js App Router, TypeScript, CSS Modules, npm.
- Backend: FastAPI.
- Database/Auth: Supabase.
- Frontend deploy: Vercel, root directory `frontend`.
- Backend deploy: Render.

## Database Change Mode

Use this mode for table changes, RLS, indexes, seed data, and query performance.

Workflow:

1. Identify affected tables, policies, hooks, pages, and backend services.
2. Design the data model or migration before editing.
3. Add sequential migration SQL under `supabase/migrations`.
4. Include RLS/security review when auth-owned data is involved.
5. Add indexes when a query path clearly needs them.
6. State manual apply instructions because Yuno920 Supabase migrations are applied manually by the project owner.

Migration checklist:

- Sequential filename, e.g. `009_short_description.sql`.
- Idempotent or safe DDL where practical.
- RLS policy changes reviewed against `auth.uid()`.
- No service role key or JWT secret in frontend code.
- Existing manually created production state considered.

## Code Review Mode

Use this mode when the user asks for review, PR review, risk check, or "look over this".

Follow Codex review style:

- Findings first.
- Order by severity.
- Reference concrete files and line numbers.
- Focus on bugs, regressions, security, performance, missing tests, and deployment risk.
- Keep summary secondary.

Review dimensions:

- Style/readability: local conventions, names, duplication, unnecessary abstraction.
- Security: auth boundaries, RLS, secret exposure, input validation, CORS, service-role leakage.
- Performance: unnecessary network calls, slow API startup, N+1 queries, blocking UI states.
- Architecture: route protection, API contracts, state ownership, coupling, deployment assumptions.

## Test Automation Mode

Use this mode when adding tests or improving confidence.

Workflow:

1. Identify risk and blast radius.
2. Choose the smallest useful test layer:
   - unit tests for pure logic and helpers
   - integration tests for API/DB contracts
   - browser/manual checks for critical UI flows
3. Add tests only when the project has or needs the relevant framework.
4. If a framework is absent, either add it deliberately or document a test plan without forcing dependencies.
5. Verify with available commands.

Current project baseline:

- Frontend has lint/build scripts.
- No committed frontend test runner is currently configured.
- Backend has dependency files and utility checks, but no broad committed test suite.

## LLM Feature Mode

Use this mode for AI chat, coaching, summaries, recommendations, prompt changes, and RAG-like features.

Workflow:

1. Define the prompt contract:
   - input fields
   - required output shape
   - refusal/fallback behavior
   - language and tone
2. Keep OpenAI calls behind the FastAPI backend.
3. Require Supabase auth for child-specific or private data.
4. Add guardrails for missing records, missing child profile, expired auth, backend env errors, and rate/cost risk.
5. Include at least a small eval checklist:
   - no data case
   - normal user data case
   - malformed input case
   - auth failure case
   - slow/OpenAI failure case

Production concerns:

- Render cold start can make AI responses feel broken; expose clear loading and fallback states.
- Avoid returning raw backend stack traces to the UI.
- Keep model, token, and cost assumptions documented when changing AI behavior.

## Deployment Mode

Use this mode for Vercel, Render, env vars, redirects, auth callback, and production issues.

Checklist:

- Vercel root directory: `frontend`.
- Production frontend domain: `https://www.yuno920.com`.
- Production backend URL: `https://yuno920-api.onrender.com`.
- Required frontend env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL`
- Required backend env:
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `APP_TIMEZONE`
- Supabase Auth redirect URLs:
  - `https://www.yuno920.com/auth/callback`
  - `http://localhost:3000/auth/callback`

When diagnosing production, check in this order:

1. DNS and redirects.
2. Vercel page/static chunk responses.
3. Supabase project DNS and Auth endpoint.
4. Render `/health`.
5. Backend CORS from `https://www.yuno920.com`.
6. Browser console/network errors.
7. RLS or missing data after login.

## When Not To Use A Full Harness

Use a small direct change instead when:

- The request is a typo, small UI copy change, or one-line config fix.
- The user asks a narrow question and does not want implementation.
- The change is isolated and low-risk.

Even in small mode, keep the standard repo rules: preserve user changes, verify what changed, and do not commit secrets.
