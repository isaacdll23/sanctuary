/**
 * Pure task-reminder decision helpers.
 *
 * This module is intentionally free of Node-only APIs, database access, and
 * environment reads so the dispatcher's selection rules can be unit tested.
 * Persistence, claiming, and delivery live in
 * `app/modules/services/TaskReminderService.ts`; scheduling lives in
 * `app/modules/services/TaskReminderScheduler.server.ts`.
 */

/** Default dispatch interval; overridable with `TASK_REMINDER_INTERVAL_MS`. */
export const DEFAULT_TASK_REMINDER_INTERVAL_MS = 60_000;

/**
 * Below this the interval is tightened to avoid a pointless busy loop; `0`
 * disables the scheduler entirely.
 */
export const MIN_TASK_REMINDER_INTERVAL_MS = 5_000;

/** Default number of reminders claimed per dispatch run. */
export const DEFAULT_TASK_REMINDER_BATCH_SIZE = 50;

/** Upper bound for `TASK_REMINDER_BATCH_SIZE`; keeps one run bounded. */
export const MAX_TASK_REMINDER_BATCH_SIZE = 200;

/**
 * Tasks have no per-task URL today (the detail view is a modal on the list),
 * so a reminder always opens the task list.
 */
export const TASK_REMINDER_URL = "/tasks";

/** Title shown by the service worker; the task title goes in the body. */
export const TASK_REMINDER_TITLE = "Task reminder";

/** `tasks` row fields the reminder decision needs. */
export type ReminderTask = {
  id: number;
  userId: number;
  title: string;
  reminderDate: Date | null;
  /** `tasks.reminder_sent`: `0` = not dispatched, `1` = claimed/terminal. */
  reminderSent: number;
  /** `tasks.completed_at`: `null` while the task is still open. */
  completedAt: Date | null;
};

/**
 * A reminder is due when it was never dispatched, has a reminder date at or
 * before `now`, and the task is still open. Completed tasks never remind.
 */
export function isTaskReminderDue(task: ReminderTask, now: Date): boolean {
  if (task.reminderSent !== 0) return false;
  if (task.reminderDate === null) return false;
  if (task.completedAt !== null) return false;
  return task.reminderDate.getTime() <= now.getTime();
}

/**
 * Filters due reminders and bounds the batch, oldest reminder first, breaking
 * ties by task id so overlapping runs process rows in a stable order.
 */
export function selectDueTaskReminders(
  tasks: readonly ReminderTask[],
  now: Date,
  limit: number = DEFAULT_TASK_REMINDER_BATCH_SIZE
): ReminderTask[] {
  if (limit <= 0) return [];

  return tasks
    .filter((task) => isTaskReminderDue(task, now))
    .sort((left, right) => {
      const leftAt = left.reminderDate?.getTime() ?? 0;
      const rightAt = right.reminderDate?.getTime() ?? 0;
      if (leftAt !== rightAt) return leftAt - rightAt;
      return left.id - right.id;
    })
    .slice(0, Math.min(limit, MAX_TASK_REMINDER_BATCH_SIZE));
}

/** Parsed `TASK_REMINDER_INTERVAL_MS` value. */
export type ReminderInterval =
  | { kind: "enabled"; intervalMs: number }
  | { kind: "disabled" }
  | { kind: "invalid"; value: string };

/**
 * Resolves `TASK_REMINDER_INTERVAL_MS`. Blank means "use the default", `0`
 * disables the scheduler, and anything non-numeric is reported as invalid so
 * the caller can log it and fall back to the default instead of guessing. A
 * usable interval is never returned below `MIN_TASK_REMINDER_INTERVAL_MS`.
 */
export function parseReminderInterval(
  raw: string | undefined
): ReminderInterval {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return { kind: "enabled", intervalMs: DEFAULT_TASK_REMINDER_INTERVAL_MS };

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { kind: "invalid", value: trimmed };
  if (value <= 0) return { kind: "disabled" };

  return {
    kind: "enabled",
    intervalMs: Math.max(Math.round(value), MIN_TASK_REMINDER_INTERVAL_MS),
  };
}

/** Resolves `TASK_REMINDER_BATCH_SIZE`, clamped to the allowed range. */
export function parseReminderBatchSize(raw: string | undefined): number {
  const value = Number.parseInt((raw ?? "").trim(), 10);
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_TASK_REMINDER_BATCH_SIZE;
  }
  return Math.min(value, MAX_TASK_REMINDER_BATCH_SIZE);
}

/**
 * Push payload for one reminder. The title is fixed, the task title becomes the
 * body (clamped to the payload limit), and the URL opens the task list.
 */
export function buildTaskReminderPayload(task: Pick<ReminderTask, "title">): {
  title: string;
  body: string;
  url: string;
} {
  const body = task.title.trim() || "You have a task reminder.";
  return {
    title: TASK_REMINDER_TITLE,
    body: body.length > 500 ? body.slice(0, 500) : body,
    url: TASK_REMINDER_URL,
  };
}

/**
 * Grace window after a claim before a still-outcome-less reminder is treated as
 * orphaned (the process crashed between the claim and the outcome write).
 */
export const REMINDER_CLAIM_GRACE_MS = 10 * 60_000;

/** Outcome columns of a claimed reminder, used to spot orphaned claims. */
export type ReminderClaimOutcome = {
  reminderDate: Date | null;
  reminderSentAt: Date | null;
  reminderFailedAt: Date | null;
};

/**
 * True for a claimed reminder that never recorded an outcome and is older than
 * the grace window — i.e. the process died between the claim and
 * `recordDelivered`/`recordFailed`. These are marked failed (never re-sent) so
 * the loss is visible instead of silent. Mirrors the reconciliation predicate
 * in `TaskReminderService.reconcileOrphanedReminderClaims`, which computes the
 * same cutoff from `now - graceMs`.
 */
export function isOrphanedReminderClaim(
  task: ReminderClaimOutcome,
  now: Date,
  graceMs: number = REMINDER_CLAIM_GRACE_MS
): boolean {
  if (task.reminderDate === null) return false;
  if (task.reminderSentAt !== null || task.reminderFailedAt !== null) return false;
  return task.reminderDate.getTime() <= now.getTime() - graceMs;
}

/** One claimed reminder returned by the claim statement's `RETURNING` clause. */
export type ClaimedReminder = {
  id: number;
  userId: number;
  title: string;
};

/** Clamps any requested batch size into `1..MAX_TASK_REMINDER_BATCH_SIZE`. */
export function boundReminderBatchSize(batchSize: number): number {
  if (!Number.isFinite(batchSize)) return DEFAULT_TASK_REMINDER_BATCH_SIZE;
  return Math.min(Math.max(Math.trunc(batchSize), 1), MAX_TASK_REMINDER_BATCH_SIZE);
}

type ClaimedReminderRow = {
  id: number;
  user_id: number;
  title: string;
};

function isClaimedReminderRow(row: unknown): row is ClaimedReminderRow {
  if (typeof row !== "object" || row === null) return false;
  return (
    typeof Reflect.get(row, "id") === "number" &&
    typeof Reflect.get(row, "user_id") === "number" &&
    typeof Reflect.get(row, "title") === "string"
  );
}

/**
 * Maps raw `RETURNING id, user_id, title` rows into domain values, dropping
 * anything that does not match the expected shape.
 */
export function normalizeClaimedReminders(
  rows: readonly unknown[]
): ClaimedReminder[] {
  const claimed: ClaimedReminder[] = [];

  for (const row of rows) {
    if (!isClaimedReminderRow(row)) continue;
    claimed.push({ id: row.id, userId: row.user_id, title: row.title });
  }

  return claimed;
}

/** Why the in-process scheduler did or did not start. */
export type ReminderSchedulerDecision =
  | { start: true; intervalMs: number }
  | {
      start: false;
      reason: "test_environment" | "disabled_by_env" | "push_unconfigured";
    };

/**
 * Pure start guard for the in-process interval: never during tests, never when
 * `TASK_REMINDER_INTERVAL_MS=0`, and never while push is unconfigured. An
 * invalid interval value falls back to the default instead of disabling
 * reminders silently.
 */
export function decideReminderScheduler({
  env,
  pushConfigured,
}: {
  env: Record<string, string | undefined>;
  pushConfigured: boolean;
}): ReminderSchedulerDecision {
  if (env.NODE_ENV === "test" || env.NODE_TEST_CONTEXT !== undefined) {
    return { start: false, reason: "test_environment" };
  }

  const interval = parseReminderInterval(env.TASK_REMINDER_INTERVAL_MS);
  if (interval.kind === "disabled") {
    return { start: false, reason: "disabled_by_env" };
  }

  if (!pushConfigured) {
    return { start: false, reason: "push_unconfigured" };
  }

  return {
    start: true,
    intervalMs:
      interval.kind === "enabled"
        ? interval.intervalMs
        : DEFAULT_TASK_REMINDER_INTERVAL_MS,
  };
}
