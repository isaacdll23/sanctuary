# Task Reminders

Sanctuary can push a Web Push notification when a task's reminder time passes,
if the task is still open. Reminders are stored on the task itself
(`tasks.reminderDate`, `tasks.reminderSent`) and dispatched by the app — there is
no external scheduler. Delivery uses the Web Push stack described in
[`docs/push-notifications.md`](./push-notifications.md).

This feature is Sanctuary-internal: it is not a general notification platform
and it only reads and writes the `tasks` table.

## Behaviour

- A reminder is **due** when all of the following hold:
  - `"reminderSent" = 0` (never dispatched),
  - `"reminderDate"` is not null and is at or before now,
  - `"completedAt"` is null (the task is still open).
- Completed tasks never remind. Setting a reminder again (`setTaskReminder`,
  or editing a task with a reminder date in the task modal) resets
  `"reminderSent"` to `0`, which makes the task due again.
- Each due reminder sends **one** push to its owner through
  `sendPushToUser(userId, {title, body, url})`. The body is the task title and
  the URL is `/tasks` (the task list — task details are a modal, so there is no
  per-task URL).
- Reminders fire **once**. After the atomic claim the task is terminal for that
  reminder even if the device had no subscription or the push service failed.

## Pieces

| Piece | Location | Responsibility |
| --- | --- | --- |
| Pure rules | `app/modules/taskReminders.ts` | Due check, batch selection/ordering, batch-size and interval parsing, payload shape, scheduler start guard. No I/O. |
| Dispatcher | `app/modules/services/TaskReminderService.ts` | Atomic claim, per-task delivery, outcome bookkeeping, counts. |
| Scheduler | `app/modules/services/TaskReminderScheduler.server.ts` | Starts the in-process interval exactly once, skips overlapping ticks. |
| Start hook | `app/root.tsx` loader | First server-rendered request calls `ensureTaskReminderSchedulerStarted()`. |
| Manual run | Settings → Notifications → "Run task reminders now" (`app/routes/settings.tsx`, intent `runTaskReminders`) | Session + `pageAccess("settings")`, runs one batch immediately and returns counts. |
| Bookkeeping | `tasks."reminderSentAt"`, `tasks."reminderFailedAt"` | When a push was delivered, and when an attempt delivered nothing. |

## Trigger: one in-process interval

hs1 runs a single app instance, so the dispatcher is an interval inside that
process — no cron sidecar, no host crontab.

- `TASK_REMINDER_INTERVAL_MS` controls the interval. Default `60000` (one
  minute); values below `5000` are raised to `5000`; `0` disables the scheduler.
  A non-numeric value logs the fallback and uses the default.
- The interval starts from the root loader, i.e. on the first server-rendered
  request, guarded by a module-level flag so it starts exactly once per process.
- It does **not** start when `NODE_ENV=test` (or under `node --test`), when the
  interval is `0`, or when Web Push is unconfigured (`VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` missing). Without keys, `isPushConfigured()` is false and
  the app simply never dispatches.
- Starting is synchronous and cannot fail; every tick is wrapped in `try/catch`
  and logged, and the timer is `unref`'d, so a slow database or push service can
  never block or crash boot.
- Ticks never overlap: if a run is still in flight, the next tick is skipped.
  A restart mid-run is safe — see the claim below.
- `TASK_REMINDER_BATCH_SIZE` bounds one run (default `50`, hard maximum `200`).

## Idempotency and concurrency

Delivery only happens **after** a successful claim, and the claim is a single
statement:

```sql
WITH due AS (
  SELECT "id" FROM tasks
  WHERE "reminderSent" = 0
    AND "reminderDate" IS NOT NULL
    AND "reminderDate" <= $1
    AND "completedAt" IS NULL
  ORDER BY "reminderDate" ASC, "id" ASC
  LIMIT $2
  FOR UPDATE SKIP LOCKED
)
UPDATE tasks AS t
SET "reminderSent" = 1
FROM due
WHERE t."id" = due."id"
  AND t."reminderSent" = 0
RETURNING t."id", t."userId", t."title";
```

Double-send is impossible because:

1. `reminderSent = 1` is set in the same statement that returns the row, before
   any push is attempted.
2. `FOR UPDATE SKIP LOCKED` makes a concurrent run skip rows another
   transaction has locked instead of claiming them too.
3. The outer `t."reminderSent" = 0` predicate is re-checked against the row
   version after the lock, so a row that became sent in between is not claimed.

A reminder whose push could not be delivered is still claimed (so it cannot be
re-sent forever) and `"reminderFailedAt"` records the attempt; a successful
delivery sets `"reminderSentAt"` and clears `"reminderFailedAt"`. To retry,
re-set the reminder in the task UI. Logs contain counts and task/user ids only —
never endpoints, VAPID keys, or email addresses.

## Verifying

- **Manual run:** Settings → Notifications → "Run task reminders now" reports
  how many reminders were due, delivered, and not delivered. It is a normal
  session-authenticated action (`pageAccessAction("settings")`), so it can also
  be exercised by submitting the settings form with `intent=runTaskReminders`
  while signed in.
- **Inspect state:** `SELECT id, "reminderDate", "reminderSent",
  "reminderSentAt", "reminderFailedAt" FROM tasks WHERE "reminderDate" IS NOT
  NULL ORDER BY "reminderDate";`
- **Logs:** the dispatcher logs one `[TaskReminderService] dispatch summary` line
  per non-empty run and `[TaskReminderScheduler] started {intervalMs}` once at
  boot.
- **Local:** use `skills/sanctuary-local-testing/SKILL.md`, set
  `TASK_REMINDER_INTERVAL_MS` (or keep the default), create a task with a
  reminder a minute in the past, and use the manual run button. Push delivery
  itself needs VAPID keys and a subscribed browser, as in
  `docs/push-notifications.md`.

## Deployment notes

- Additive columns only:
  `migrations/2026-11-09-task-reminder-dispatch.sql` adds
  `"reminderSentAt"` and `"reminderFailedAt"` to `tasks` (the release applies
  the Drizzle schema with `drizzle-kit push --force`; the SQL file documents the
  same change). Existing rows are unaffected.
- Optional: set `TASK_REMINDER_INTERVAL_MS` / `TASK_REMINDER_BATCH_SIZE` on the
  server. Reminders stay off while VAPID keys are unset.
- No `.woodpecker.yml` change is required.
