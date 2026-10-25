import {
  decideReminderScheduler,
  type ReminderSchedulerDecision,
} from "~/modules/taskReminders";
import { isPushConfigured } from "~/modules/services/PushNotificationService";
import { dispatchDueTaskReminders } from "~/modules/services/TaskReminderService";

/**
 * In-process scheduler for task reminders.
 *
 * Sanctuary runs on a single hs1 instance, so an interval inside the app is
 * enough: no cron sidecar and no host crontab. The scheduler is started lazily
 * from the root loader — the first server-rendered request — and a module-level
 * flag makes that happen exactly once per process.
 *
 * It never blocks or crashes boot: starting is synchronous and error-free, each
 * tick is wrapped, and the timer is `unref`'d so it cannot hold the process
 * open. Overlapping ticks are skipped, and a restart in the middle of a run is
 * safe because delivery only happens after the atomic claim in
 * `TaskReminderService` (see `claimDueTaskReminders`).
 */

export type ReminderSchedulerStartDecision = ReminderSchedulerDecision;

/**
 * Decides whether this process may start the scheduler, using the real push
 * configuration. The rule itself lives in `decideReminderScheduler` so it can
 * be unit tested without timers or a database.
 */
export function decideReminderSchedulerStart({
  env = process.env,
  pushConfigured = isPushConfigured,
}: {
  env?: NodeJS.ProcessEnv;
  pushConfigured?: () => boolean;
} = {}): ReminderSchedulerStartDecision {
  return decideReminderScheduler({ env, pushConfigured: pushConfigured() });
}

let started = false;
let timer: NodeJS.Timeout | null = null;

/** True once the interval is running in this process. */
export function isTaskReminderSchedulerStarted(): boolean {
  return started;
}

/**
 * Runs one tick. Never throws: a database or push outage is logged and the next
 * tick tries again.
 */
export async function runReminderTick(): Promise<void> {
  try {
    await dispatchDueTaskReminders();
  } catch (error) {
    console.error("[TaskReminderScheduler] tick failed", {
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
}

/**
 * Starts the interval at most once per process. Safe to call on every request;
 * returns whether this call started it.
 */
export function ensureTaskReminderSchedulerStarted(): boolean {
  if (started) return false;

  const decision = decideReminderSchedulerStart();
  if (!decision.start) {
    if (decision.reason !== "test_environment") {
      console.log(
        `[TaskReminderScheduler] not started: ${decision.reason} ` +
          "(task reminders only dispatch when push is configured)"
      );
    }
    // Mark as decided so the guard is not re-evaluated on every request.
    started = true;
    return false;
  }

  started = true;

  let running = false;
  timer = setInterval(() => {
    if (running) return;
    running = true;
    void runReminderTick().finally(() => {
      running = false;
    });
  }, decision.intervalMs);
  // Never keep the process alive just for reminders.
  timer.unref?.();

  console.log("[TaskReminderScheduler] started", {
    intervalMs: decision.intervalMs,
  });

  return true;
}

/** Stops the interval. Exported for tests and graceful shutdown paths. */
export function stopTaskReminderScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  started = false;
}
