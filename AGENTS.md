# AGENTS.md

## Sanctuary Quick Guide

- Stack: React Router 8, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, PostgreSQL.
- App code lives in `app/`.
- Route files are in `app/routes/**`.
- Server/business logic is in `app/modules/services/**`.
- `docs/CODING_STANDARDS.md` is the source of truth for coding, architecture, security, UI, testing, and completion standards. Read it before changing code.

## Common Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Start prod build: `npm run start`
- Test: `npm test` (or `npm run test:watch`)
- Typecheck: `npm run typecheck`

## Project Skills

- Use `skills/sanctuary-expenses/SKILL.md` for work on the recurring Expenses and paycheck planning domain.
- Use `skills/sanctuary-release/SKILL.md` for Sanctuary production releases and rollback checks.
- Use `skills/sanctuary-local-testing/SKILL.md` when starting the app locally, staging its isolated Docker database, or signing in with the local review account for browser testing.

## Architecture Notes

- Access control is enforced via `pageAccessLoader` / `pageAccessAction`.
- Keep route components focused on UI/state orchestration.
- Put DB and business rules in service modules (`app/modules/services/*`).
- Drizzle schema is in `app/db/schema.ts`; SQL migrations are in `migrations/`.

## UI Conventions

- Tailwind CSS v4 styling, neutral zinc/gray palette + dark mode support.
- Reuse shared component/style helpers when possible (avoid class duplication).
- Prefer keyboard-accessible controls (`button`, `a`) over clickable `div`s.
- Sanity-check responsive behavior across mobile and desktop breakpoints.

## Key Modules

- **Notes:** `app/routes/notes/notes.tsx` with components in `app/components/notes/` and logic in `app/modules/services/NoteService.ts`.
- **Tasks:** `app/routes/tasks/tasks.tsx` and `app/modules/services/TaskService.ts`.
- **Day Planner:** `app/routes/day-planner.tsx` with components in `app/components/day-planner/` and logic in `app/modules/services/DayPlannerService.ts`.
- **Finance & Expenses:** `app/routes/finance/**` with `ExpenseService.ts`, `IncomeService.ts`, and `SharedBudgetService.ts`.

## Before Finishing Changes

1. Follow the Definition of Done in `docs/CODING_STANDARDS.md`.
2. At minimum, run `npm test` and `npm run typecheck`.
3. If UI changed, sanity-check desktop and mobile behavior, keyboard use, and relevant dark-mode states.
4. Avoid destructive git commands unless explicitly requested.
