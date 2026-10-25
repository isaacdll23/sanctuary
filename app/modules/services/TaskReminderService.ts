import { and, eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { tasksTable } from "~/db/schema";
import {
  boundReminderBatchSize,
  buildTaskReminderPayload,
  DEFAULT_TASK_REMINDER_BATCH_SIZE,
  normalizeClaimedReminders,
  parseReminderBatchSize,
  type ClaimedReminder,
} from "~/modules/taskReminders";
import {
  isPushConfigured,
  sendPushToUser,
} from "~/modules/services/PushNotificationService";

/**
 * Server-only task-reminder dispatch.
 *
 * A due reminder is a task with `reminder_sent = 0`, a `reminder_date` at or
 * before now, and no `completed_at`. Tasks are claimed in one atomic
 * `UPDATE ... WHERE reminder_sent = 0 RETURNING` statement, so overlapping
 * runs (interval tick + manual run, or a restart mid-run) can never deliver the
 * same reminder twice: Postgres re-checks the `reminder_sent = 0` predicate on
 * the locked row version, and only the first statement to update a row gets it
 * back in `RETURNING`.
 *
 * The claim statement locks the selected rows with `FOR UPDATE SKIP LOCKED`,
 * which is what actually makes concurrent runs safe: a second dispatcher skips
 * rows another transaction has already locked instead of claiming them too. The
 * outer `reminder_sent = 0` predicate re-checks the row version after the lock,
 * so a row that changed in between is never claimed twice.
 *
 * Only counts and task/user ids are logged; endpoints, keys, and email
 * addresses never are.
 */

export type TaskReminderDispatchSummary = {
  /** Reminders claimed by this run (at most `batchSize`). */
  claimed: number;
  /** Reminders whose push reached at least one subscription. */
  sent: number;
  /** Reminders where no push could be delivered (no subscription or failure). */
  failed: number;
  /** Stale subscriptions pruned while delivering. */
  pruned: number;
  /** True when the run was skipped instead of claiming anything. */
  skipped: boolean;
  /** Why the run was skipped, when it was. */
  reason: string | null;
  /** Task ids claimed, oldest reminder first (safe to surface to the UI). */
  taskIds: number[];
};

/**
 * Atomically claims up to `batchSize` due reminders for this run.
 *
 * Exported for documentation and verification: the whole claim is a single
 * statement. Two concurrent dispatchers cannot both take a row — the first
 * locks it inside the CTE and the second skips it (`SKIP LOCKED`) — and a
 * sequential rerun sees `reminder_sent = 1` and returns nothing.
 */
export async function claimDueTaskReminders(
  batchSize: number,
  now: Date
): Promise<ClaimedReminder[]> {
  const boundedBatchSize = boundReminderBatchSize(batchSize);

  // `tasks` columns are camelCase in the database (the schema does not map
  // them), so identifiers are emitted through the column definitions instead of
  // being hard-coded here.
  const column = (name: "id" | "userId" | "title" | "reminderSent" | "reminderDate" | "completedAt") =>
    sql.identifier(tasksTable[name].name);

  const result = await db.execute<{
    id: number;
    user_id: number;
    title: string;
  }>(sql`
    WITH due AS (
      SELECT ${column("id")}
      FROM ${tasksTable}
      WHERE ${column("reminderSent")} = 0
        AND ${column("reminderDate")} IS NOT NULL
        AND ${column("reminderDate")} <= ${now}
        AND ${column("completedAt")} IS NULL
      ORDER BY ${column("reminderDate")} ASC, ${column("id")} ASC
      LIMIT ${boundedBatchSize}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE ${tasksTable} AS t
    SET ${column("reminderSent")} = 1
    FROM due
    WHERE t.${column("id")} = due.${column("id")}
      AND t.${column("reminderSent")} = 0
    RETURNING t.${column("id")} AS id,
      t.${column("userId")} AS user_id,
      t.${column("title")} AS title
  `);

  return normalizeClaimedReminders(result.rows);
}

async function recordDelivered(taskId: number, userId: number, at: Date) {
  await db
    .update(tasksTable)
    .set({ reminderSentAt: at, reminderFailedAt: null })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));
}

async function recordFailed(taskId: number, userId: number, at: Date) {
  await db
    .update(tasksTable)
    .set({ reminderFailedAt: at })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));
}

function emptySummary(reason: string | null): TaskReminderDispatchSummary {
  return {
    claimed: 0,
    sent: 0,
    failed: 0,
    pruned: 0,
    skipped: reason !== null,
    reason,
    taskIds: [],
  };
}

/** Reads `TASK_REMINDER_BATCH_SIZE` and bounds it to one run. */
export function resolveReminderBatchSize(
  raw: string | undefined = process.env.TASK_REMINDER_BATCH_SIZE
): number {
  return parseReminderBatchSize(raw) || DEFAULT_TASK_REMINDER_BATCH_SIZE;
}

export type TaskReminderDispatchOptions = {
  now?: Date;
  batchSize?: number;
  /** Test seam; defaults to the real Web Push delivery service. */
  deliver?: typeof sendPushToUser;
};

/**
 * Claims and delivers one batch of due reminders.
 *
 * Each claimed task is delivered to its owner once. A delivery that reaches no
 * subscription is recorded on the task (`reminder_failed_at`) instead of being
 * retried forever; re-setting the reminder in the UI clears the state and makes
 * it due again. Runs never throw for delivery problems and never exceed one
 * batch, which keeps a slow push service from blocking the interval.
 */
export async function dispatchDueTaskReminders(
  options: TaskReminderDispatchOptions = {}
): Promise<TaskReminderDispatchSummary> {
  if (!isPushConfigured()) {
    return emptySummary("push_unconfigured");
  }

  const now = options.now ?? new Date();
  const batchSize = options.batchSize ?? resolveReminderBatchSize();
  const deliver = options.deliver ?? sendPushToUser;

  const claimed = await claimDueTaskReminders(batchSize, now);
  if (claimed.length === 0) {
    return emptySummary(null);
  }

  const summary = emptySummary(null);
  summary.claimed = claimed.length;
  summary.taskIds = claimed.map((task) => task.id);

  for (const task of claimed) {
    let delivered = 0;
    try {
      const result = await deliver(task.userId, buildTaskReminderPayload(task));
      delivered = result.sent;
      summary.pruned += result.pruned;
    } catch (error) {
      // Delivery must never abort the batch; the claim stays terminal and the
      // failure is recorded below.
      console.error("[TaskReminderService] delivery threw for task", {
        taskId: task.id,
        userId: task.userId,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }

    try {
      if (delivered > 0) {
        summary.sent += 1;
        await recordDelivered(task.id, task.userId, now);
      } else {
        summary.failed += 1;
        await recordFailed(task.id, task.userId, now);
      }
    } catch (error) {
      console.error("[TaskReminderService] could not record dispatch outcome", {
        taskId: task.id,
        userId: task.userId,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  console.log("[TaskReminderService] dispatch summary", {
    claimed: summary.claimed,
    sent: summary.sent,
    failed: summary.failed,
    pruned: summary.pruned,
    taskIds: summary.taskIds,
  });

  return summary;
}
