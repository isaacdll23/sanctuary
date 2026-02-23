# AGENTS.md

## Sanctuary Quick Guide

- Stack: React Router 7, React 19, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL.
- App code lives in `app/`.
- Route files are in `app/routes/**`.
- Server/business logic is in `app/modules/services/**`.

## Common Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Start prod build: `npm run start`
- Typecheck (main quality gate): `npm run typecheck`

## Architecture Notes

- Access control is enforced via `pageAccessLoader` / `pageAccessAction`.
- Keep route components focused on UI/state orchestration.
- Put DB and business rules in service modules (`app/modules/services/*`).
- Drizzle schema is in `app/db/schema.ts`; SQL migrations are in `migrations/`.

## UI Conventions

- Tailwind-first styling, neutral gray palette + dark mode support.
- Reuse shared component/style helpers when possible (avoid class duplication).
- Prefer keyboard-accessible controls (`button`, `a`) over clickable `div`s.

## Notes Module (recently overhauled)

- Main route: `app/routes/notes/notes.tsx` (responsive workspace + navigator).
- Editor: `app/components/notes/NoteEditor.tsx`.
- Split view: `app/components/notes/SplitViewContainer.tsx`.
- Editor settings: `app/components/notes/EditorSettings.tsx`.
- Keep note actions compatible with `handleNoteAction` in `app/modules/services/NoteService.ts`.

## Before Finishing Changes

1. Run `npm run typecheck`.
2. If UI changed, sanity-check desktop + mobile behavior.
3. Avoid destructive git commands unless explicitly requested.
