-- Migration: Task reminder dispatch bookkeeping
-- Date: 2026-11-09
-- Description: `tasks.reminderSent` was already stored but nothing dispatched
--              it. The dispatcher claims a due reminder atomically with
--              `UPDATE tasks SET "reminderSent" = 1 WHERE ... AND "reminderSent" = 0
--              RETURNING ...`, so a claimed row can never be sent twice. These
--              two nullable columns record the outcome of that claim: when the
--              push was delivered (`"reminderSentAt"`) and when an attempt
--              delivered nothing (`"reminderFailedAt"`). Purely additive, so
--              existing rows and tables are unaffected. This mirrors
--              app/db/schema.ts (the production migrate step runs
--              drizzle-kit push, so this file documents the change).
--
-- Note: `tasks` was created without explicit column names, so its identifiers
-- are camelCase and must stay quoted.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "reminderSentAt" timestamp;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "reminderFailedAt" timestamp;
