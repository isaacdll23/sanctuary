# Sanctuary — AI SDK Migration + Day Planner → AI "Today List"

**Dispatch target:** `build-fast` agent (global opencode agent routing through the fast CoreWeave OpenRouter provider).
**Repo:** `/Users/idelalama/workspaces/sanctuary` · Stack: React Router 8, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, PostgreSQL.
**Ground rules:** Read `docs/CODING_STANDARDS.md` before changing code (source of truth). Run `npm test` and `npm run typecheck` before finishing each session; run `npm run build` where routes/server boundaries change. No secrets in code or commits. Never attribute/credit AI in commits or PRs.

## Background & decisions (settled — do not re-litigate)

The Day Planner forces time-blocking (every task requires start time + duration, behind a "create plan" gate), which the user found too much friction. Goal: **replace the calendar with an AI-assisted "Today List"** — a free-form dump of the day's items that AI organizes into a **rough sequence** (Morning / Midday / Afternoon / Evening / Any) with **no exact clock times**. AI also powers saved reusable **routine templates**. The existing Azure-based AI integration has been **rewritten to use the Vercel AI SDK** (`ai` + `@ai-sdk/openai`). The app targets the **OpenAI platform today**, with **OpenRouter as the planned future provider**.

Locked decisions:
- **Vercel AI SDK is the AI layer**; providers are swapped behind it rather than called directly.
- **OpenAI platform first, OpenRouter later** via `@openrouter/ai-sdk-provider`; no fallback to Azure.
- **Configurable default + per-feature model** via env vars.
- **`generateObject` + strict zod schemas** for structured AI output (provider-agnostic; no manual prompt-for-JSON parsing).
- **Config lives in env vars**, not the DB.
- **New lightweight tables** for the today-list; old calendar tables stay dormant (not deleted).
- **Google Calendar sync deferred** (left dormant; no new push logic).
- **Remove the legacy calendar UI components** (tables/data stay).
- **Keep the `/day-planner` route and URL**, swap its content.

## Key files / current state (for context)

- `app/modules/ai.server.ts` — the only AI module. Uses the Vercel AI SDK (`createOpenAI` + `generateObject`, gpt-6-luna) with a zod schema; exports `isAiConfigured(env?)`, `resolveModel(feature, env?)`, `generateNoteTitle(content)`.
- AI consumers: `app/modules/services/NoteService.ts` (`generateNoteTitle` intent), `app/routes/notes/notes.tsx` (`aiEnabled: isAiConfigured()`), `app/components/notes/NoteEditor.tsx`.
- Day Planner: `app/routes/day-planner/day-planner.tsx`, `app/modules/services/DayPlannerService.ts`, `app/modules/services/GoogleCalendarService.ts` (dormant after this work), components in `app/components/day-planner/`, state util `app/utils/dayPlannerStateManagement.ts`.
- Schema: `app/db/schema.ts` (day planner tables ~lines 236–325). Migrations in `migrations/`. `.env.example` now documents the env contract.
- Test convention: `node:test` + `node:assert/strict`, colocated `*.test.ts`. Service tests isolate external systems and never use production data.

---

## Session 1 — Vercel AI SDK migration (DONE)

**Objective:** Replace the Azure OpenAI client with the Vercel AI SDK while keeping the notes consumer working.

**Completed:**
1. `app/modules/ai.server.ts` now uses `createOpenAI` (`@ai-sdk/openai`) + `generateObject` (`ai`) with a zod schema.
   - `isAiConfigured(env?)` returns true when `OPENAI_API_KEY` is set.
   - Model selection fallback: `OPENAI_MODEL_<FEATURE>` → `OPENAI_MODEL` → `gpt-6-luna`.
   - `OPENAI_BASE_URL` is optional and defaults to the OpenAI platform; it is the seam for the future OpenRouter move.
   - `generateNoteTitle(content)` preserves its exported signature; provider errors are logged server-side and replaced with a user-safe message.
2. Added `.env.example` documenting all app env vars, including the `OPENAI_*` AI contract.
3. Consumers (`NoteService`, `notes.tsx`, `NoteEditor`) are unchanged.

**Deferred to the OpenRouter move:** swap `createOpenAI` for `@openrouter/ai-sdk-provider` and add `OPENROUTER_*` env vars. Add `suggestDayRoutine` / `adaptRoutineTemplate` here when Session 2 begins.

**Standards to respect:** no `any`; typed domain results for expected failures; throw only for unexpected conditions; `import type` for type-only imports; `~/*` alias.

**Acceptance (Session 1):**
- `npm test`, `npm run typecheck`, and `npm run build` pass.
- Unit tests cover `isAiConfigured`, model-selection fallback, and the `generateNoteTitle` guard paths.
- No Azure code remains in the AI module; no secrets/credentials in code or commits.

---

## Session 2 — Today-list backend (schema + service; no UI)

**Objective:** Add the persistence and service layer for the today-list and routines, wired to Session 1's AI functions.

**Tasks:**
1. Schema in `app/db/schema.ts` + Drizzle migration in `migrations/`:
   - `day_items` — `(id uuid pk defaultRandom, userId fk→usersTable notNull, date date notNull, text varchar(255) notNull, completedAt timestamp null, sortOrder int notNull default 0, createdAt/updatedAt)`.
   - `day_item_buckets` — `(id uuid pk, itemId fk→day_items notNull, period enum('morning','midday','afternoon','evening','any') notNull, sortOrder int notNull default 0, createdAt/updatedAt)`.
   - `routine_templates` — `(id uuid pk, userId fk notNull, name varchar(255) notNull, structure jsonb notNull, createdAt/updatedAt)`.
   - Keep the old `day_plans`/`day_plan_sections`/Google sync tables intact (dormant).
2. New `app/modules/services/DayRoutineService.ts`:
   - `handleDayRoutineAction(request)` routing intents; user authorized via the existing access-control pattern.
   - Intents: `addItem`, `updateItem`, `deleteItem`, `toggleComplete`, `suggestDay` (calls `suggestDayRoutine`, persists buckets, returns sequence), `reorderItem` / `moveItemToBucket` (manual adjustments), `regenerate`, `saveTemplate`, `listTemplates`, `applyTemplate` (AI adapts saved structure to today's list), `deleteTemplate`.
   - All user-owned queries scoped by `userId`; validate `period`, `date`, and text lengths; normalize once, pass typed values to service.
   - The `suggestDayRoutine` prompt encodes the philosophy: *short priorities, rough sequence, no exact times, don't pad the schedule*.
3. Tests (isolated DB, `node:test` pattern): add/suggest/move/save-template flows; validation and ownership.

**Standards to respect:** transactions for multi-write logical operations; no `any`; typed discriminated results; never serialize secrets/raw provider responses.

**Acceptance (Session 2):**
- `npm test` and `npm run typecheck` pass.
- Service tests cover the core flows and ownership/validation.
- Old tables remain untouched (no data loss).

---

## Session 3 — Day Planner UI rework + legacy cleanup

**Objective:** Rework the route/UI around the today-list + AI routine, and remove the legacy calendar components.

**Tasks:**
1. Rework `app/routes/day-planner/day-planner.tsx` (keep the URL) around the new flow; keep route lean, business logic in the service.
2. Components in `app/components/day-planner/` (retiring the old ones):
   - `TodayListInput` — quick free-form add (tap to add line; title only, no time/color/duration).
   - `RoutineSequence` — bucket cards (Morning/Midday/Afternoon/Evening/Any) with items; move/reorder/complete; "Suggest my day" / "Regenerate" buttons.
   - `RoutineTemplatePicker` — save/apply saved routines.
   - Keep `DayPlannerHeader` (title, date nav), keyboard shortcuts (⌘N, ←/→, Esc).
3. **Remove** legacy UI and its state util: `CalendarView.tsx`, `MobileDayTimeline.tsx`, `TaskBlock.tsx`, `AddTaskModal.tsx`, `EditTaskModal.tsx`, `ConflictResolutionModal.tsx`, `TaskModalsContainer.tsx`, `QuickUpcomingTasksSidebar.tsx`, `TimeSlotCard.tsx`, `TaskPreviewTooltip.tsx`, `SyncStatusBadge.tsx`, and `app/utils/dayPlannerStateManagement.ts` (+ its test). Remove now-dead references (e.g. unused `refreshKey`, `conflictData`/`showConflictModal`).
4. Old tables + `DayPlannerService` / `GoogleCalendarService` stay **dormant/intact** (rollback safety); Google sync deferred.

**Acceptance (Session 3):**
- `npm test`, `npm run typecheck`, and `npm run build` pass.
- UI exercised at mobile and desktop widths, keyboard interaction, and relevant dark-mode states.
- No leftover references to removed legacy components or dead state; no `any`, no leaked server imports, no generated-file edits.
