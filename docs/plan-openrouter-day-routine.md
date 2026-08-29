# Sanctuary — OpenRouter AI Rewrite + Day Planner → AI "Today List"

**Dispatch target:** `build-fast` agent (global opencode agent routing through the fast CoreWeave OpenRouter provider).
**Repo:** `/Users/idelalama/workspaces/sanctuary` · Stack: React Router 8, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, PostgreSQL.
**Ground rules:** Read `docs/CODING_STANDARDS.md` before changing code (source of truth). Run `npm test` and `npm run typecheck` before finishing each session; run `npm run build` where routes/server boundaries change. No secrets in code or commits. Never attribute/credit AI in commits or PRs.

## Background & decisions (settled — do not re-litigate)

The Day Planner forces time-blocking (every task requires start time + duration, behind a "create plan" gate), which the user found too much friction. Goal: **replace the calendar with an AI-assisted "Today List"** — a free-form dump of the day's items that AI organizes into a **rough sequence** (Morning / Midday / Afternoon / Evening / Any) with **no exact clock times**. AI also powers saved reusable **routine templates**. The existing Azure-based AI integration must be **rewritten to use OpenRouter**.

Locked decisions:
- **OpenRouter fully replaces Azure** (no fallback).
- **Configurable default + per-feature model** via env vars.
- **Prompt-for-JSON + strict zod validation** for structured AI output (no reliance on `response_format` support).
- **Config lives in env vars**, not the DB.
- **New lightweight tables** for the today-list; old calendar tables stay dormant (not deleted).
- **Google Calendar sync deferred** (left dormant; no new push logic).
- **Remove the legacy calendar UI components** (tables/data stay).
- **Keep the `/day-planner` route and URL**, swap its content.
- The `openai` SDK (already a dependency, `^4.100.0`) supports OpenRouter via `baseURL` — **no new package**.

## Key files / current state (for context)

- `app/modules/ai.server.ts` — the only AI module. Uses `AzureOpenAI` (gpt-5-mini) + zod `json_object`; exports `isAiConfigured()`, `generateNoteTitle(content)`.
- AI consumers: `app/modules/services/NoteService.ts` (`generateNoteTitle` intent), `app/routes/notes/notes.tsx` (`aiEnabled: isAiConfigured()`), `app/components/notes/NoteEditor.tsx`.
- Day Planner: `app/routes/day-planner/day-planner.tsx`, `app/modules/services/DayPlannerService.ts`, `app/modules/services/GoogleCalendarService.ts` (dormant after this work), components in `app/components/day-planner/`, state util `app/utils/dayPlannerStateManagement.ts`.
- Schema: `app/db/schema.ts` (day planner tables ~lines 236–325). Migrations in `migrations/`. No `.env.example` exists yet.
- Test convention: `node:test` + `node:assert/strict`, colocated `*.test.ts`. Service tests isolate external systems and never use production data.

---

## Session 1 — OpenRouter AI rewrite (self-contained; do first)

**Objective:** Rewrite `app/modules/ai.server.ts` to use OpenRouter via the standard `OpenAI` client, with configurable per-feature models and a reusable zod-validated JSON helper. Keep the existing notes consumer working.

**Tasks:**
1. Rewrite `app/modules/ai.server.ts`:
   - Replace `AzureOpenAI` with `OpenAI` from the `openai` package.
   - `baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"`, `apiKey = process.env.OPENROUTER_API_KEY`.
   - Per-feature model selection with fallback chain: `OPENROUTER_MODEL_<FEATURE>` → `OPENROUTER_MODEL` → sensible default.
   - `isAiConfigured()` returns true when `OPENROUTER_API_KEY` is set.
   - Private generic `callJson({ feature, model, system, user, schema })`: builds messages, requests JSON, **strictly validates with `schema.parse`** (zod), throws a typed user-safe error on failure (never leak raw provider responses), supports per-feature `temperature`/`max_tokens`.
   - Refactor `generateNoteTitle` through `callJson`; preserve its exported signature and behavior.
   - Add `suggestDayRoutine(items, template?)` and `adaptRoutineTemplate(...)` (AI backbone for Sessions 2/3) — define the day-routine zod schema here (period union `"morning" | "midday" | "afternoon" | "evening" | "any"` and ordered item arrays), even if unused until Session 2.
2. Create `.env.example` documenting: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`, `OPENROUTER_MODEL_NOTE_TITLE`, `OPENROUTER_MODEL_DAY_ROUTINE`. Note these must also be set in the deployment environment.
3. Update consumers if any signature changed (note-title flow should need no UI change).

**Standards to respect:** no `any`; typed domain results for expected failures; throw only for unexpected conditions; `import type` for type-only imports; `~/*` alias.

**Acceptance (Session 1):**
- `npm test` and `npm run typecheck` pass.
- Unit tests cover: the JSON-parse + zod-validation helper (mocked OpenAI client), `isAiConfigured`, model-selection fallback, and the note-title schema.
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
