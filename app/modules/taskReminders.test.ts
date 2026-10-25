import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_TASK_REMINDER_BATCH_SIZE,
  DEFAULT_TASK_REMINDER_INTERVAL_MS,
  MAX_TASK_REMINDER_BATCH_SIZE,
  MIN_TASK_REMINDER_INTERVAL_MS,
  TASK_REMINDER_TITLE,
  TASK_REMINDER_URL,
  boundReminderBatchSize,
  buildTaskReminderPayload,
  decideReminderScheduler,
  isTaskReminderDue,
  normalizeClaimedReminders,
  parseReminderBatchSize,
  parseReminderInterval,
  selectDueTaskReminders,
  type ReminderTask,
} from "./taskReminders";

const now = new Date("2026-11-09T12:00:00.000Z");

function task(overrides: Partial<ReminderTask> = {}): ReminderTask {
  return {
    id: 1,
    userId: 7,
    title: "Water the plants",
    reminderDate: new Date("2026-11-09T11:00:00.000Z"),
    reminderSent: 0,
    completedAt: null,
    ...overrides,
  };
}

describe("isTaskReminderDue", () => {
  it("is due when unsent, dated in the past, and still open", () => {
    assert.equal(isTaskReminderDue(task(), now), true);
  });

  it("is due exactly at the reminder instant", () => {
    assert.equal(isTaskReminderDue(task({ reminderDate: now }), now), true);
  });

  it("is not due one millisecond before the reminder instant", () => {
    const reminderDate = new Date(now.getTime() + 1);
    assert.equal(isTaskReminderDue(task({ reminderDate }), now), false);
  });

  it("is not due when already claimed", () => {
    assert.equal(isTaskReminderDue(task({ reminderSent: 1 }), now), false);
  });

  it("is not due without a reminder date", () => {
    assert.equal(isTaskReminderDue(task({ reminderDate: null }), now), false);
  });

  it("is not due once the task is completed", () => {
    const completedAt = new Date("2026-11-09T10:00:00.000Z");
    assert.equal(isTaskReminderDue(task({ completedAt }), now), false);
  });
});

describe("selectDueTaskReminders", () => {
  it("keeps only due reminders and drops sent, completed, undated, and future ones", () => {
    const candidates: ReminderTask[] = [
      task({ id: 1 }),
      task({ id: 2, reminderSent: 1 }),
      task({ id: 3, reminderDate: null }),
      task({ id: 4, completedAt: new Date("2026-11-09T09:00:00.000Z") }),
      task({ id: 5, reminderDate: new Date("2026-11-10T09:00:00.000Z") }),
      task({ id: 6, reminderDate: new Date("2026-11-09T10:00:00.000Z") }),
    ];

    assert.deepEqual(
      selectDueTaskReminders(candidates, now).map((candidate) => candidate.id),
      [6, 1]
    );
  });

  it("orders by reminder date and then by task id", () => {
    const at = (iso: string) => new Date(iso);
    const candidates: ReminderTask[] = [
      task({ id: 30, reminderDate: at("2026-11-09T09:00:00.000Z") }),
      task({ id: 10, reminderDate: at("2026-11-09T09:00:00.000Z") }),
      task({ id: 20, reminderDate: at("2026-11-09T08:00:00.000Z") }),
    ];

    assert.deepEqual(
      selectDueTaskReminders(candidates, now).map((candidate) => candidate.id),
      [20, 10, 30]
    );
  });

  it("bounds the batch and never claims more than the maximum", () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      task({ id: index + 1, reminderDate: new Date(now.getTime() - index * 1000) })
    );

    assert.equal(selectDueTaskReminders(many, now, 3).length, 3);
    assert.equal(
      selectDueTaskReminders(many, now, MAX_TASK_REMINDER_BATCH_SIZE + 500).length,
      12
    );
    assert.deepEqual(selectDueTaskReminders(many, now, 0), []);
  });

  it("does not mutate its input", () => {
    const candidates: ReminderTask[] = [task({ id: 2 }), task({ id: 1 })];
    const before = candidates.map((candidate) => candidate.id);

    selectDueTaskReminders(candidates, now);

    assert.deepEqual(
      candidates.map((candidate) => candidate.id),
      before
    );
  });
});

describe("boundReminderBatchSize", () => {
  it("clamps into the supported range", () => {
    assert.equal(boundReminderBatchSize(25), 25);
    assert.equal(boundReminderBatchSize(0), 1);
    assert.equal(boundReminderBatchSize(-10), 1);
    assert.equal(boundReminderBatchSize(1_000), MAX_TASK_REMINDER_BATCH_SIZE);
    assert.equal(boundReminderBatchSize(Number.NaN), DEFAULT_TASK_REMINDER_BATCH_SIZE);
  });
});

describe("normalizeClaimedReminders", () => {
  it("maps RETURNING rows into domain values and drops malformed rows", () => {
    assert.deepEqual(
      normalizeClaimedReminders([
        { id: 4, user_id: 2, title: "Renew passport" },
        { id: "5", user_id: 2, title: "Bad id" },
        { id: 6, title: "Missing user" },
        null,
        "nope",
      ]),
      [{ id: 4, userId: 2, title: "Renew passport" }]
    );
  });
});

describe("parseReminderInterval", () => {
  it("defaults to sixty seconds when unset or blank", () => {
    assert.deepEqual(parseReminderInterval(undefined), {
      kind: "enabled",
      intervalMs: DEFAULT_TASK_REMINDER_INTERVAL_MS,
    });
    assert.deepEqual(parseReminderInterval("   "), {
      kind: "enabled",
      intervalMs: DEFAULT_TASK_REMINDER_INTERVAL_MS,
    });
  });

  it("treats zero and negative values as disabled", () => {
    assert.deepEqual(parseReminderInterval("0"), { kind: "disabled" });
    assert.deepEqual(parseReminderInterval("-1000"), { kind: "disabled" });
  });

  it("reports non-numeric values as invalid", () => {
    assert.deepEqual(parseReminderInterval("soon"), {
      kind: "invalid",
      value: "soon",
    });
  });

  it("raises impractically small intervals to the minimum", () => {
    assert.deepEqual(parseReminderInterval("250"), {
      kind: "enabled",
      intervalMs: MIN_TASK_REMINDER_INTERVAL_MS,
    });
    assert.deepEqual(parseReminderInterval("30000"), {
      kind: "enabled",
      intervalMs: 30_000,
    });
  });
});

describe("parseReminderBatchSize", () => {
  it("falls back to the default and clamps large values", () => {
    assert.equal(parseReminderBatchSize(undefined), DEFAULT_TASK_REMINDER_BATCH_SIZE);
    assert.equal(parseReminderBatchSize("nope"), DEFAULT_TASK_REMINDER_BATCH_SIZE);
    assert.equal(parseReminderBatchSize("12"), 12);
    assert.equal(parseReminderBatchSize("10000"), MAX_TASK_REMINDER_BATCH_SIZE);
  });
});

describe("decideReminderScheduler", () => {
  const productionEnv = { NODE_ENV: "production" } as const;

  it("never starts during tests", () => {
    assert.deepEqual(
      decideReminderScheduler({
        env: { NODE_ENV: "test" },
        pushConfigured: true,
      }),
      { start: false, reason: "test_environment" }
    );
    assert.deepEqual(
      decideReminderScheduler({
        env: { NODE_TEST_CONTEXT: "child-v8", NODE_ENV: "production" },
        pushConfigured: true,
      }),
      { start: false, reason: "test_environment" }
    );
  });

  it("does not start when push is unconfigured", () => {
    assert.deepEqual(
      decideReminderScheduler({ env: productionEnv, pushConfigured: false }),
      { start: false, reason: "push_unconfigured" }
    );
  });

  it("honours the disabling interval", () => {
    assert.deepEqual(
      decideReminderScheduler({
        env: { ...productionEnv, TASK_REMINDER_INTERVAL_MS: "0" },
        pushConfigured: true,
      }),
      { start: false, reason: "disabled_by_env" }
    );
  });

  it("starts with the default or configured interval", () => {
    assert.deepEqual(
      decideReminderScheduler({ env: productionEnv, pushConfigured: true }),
      { start: true, intervalMs: DEFAULT_TASK_REMINDER_INTERVAL_MS }
    );
    assert.deepEqual(
      decideReminderScheduler({
        env: { ...productionEnv, TASK_REMINDER_INTERVAL_MS: "15000" },
        pushConfigured: true,
      }),
      { start: true, intervalMs: 15_000 }
    );
  });

  it("falls back to the default interval for an invalid value", () => {
    assert.deepEqual(
      decideReminderScheduler({
        env: { ...productionEnv, TASK_REMINDER_INTERVAL_MS: "every-minute" },
        pushConfigured: true,
      }),
      { start: true, intervalMs: DEFAULT_TASK_REMINDER_INTERVAL_MS }
    );
  });
});

describe("buildTaskReminderPayload", () => {
  it("uses the fixed title, the task title as body, and the task list URL", () => {
    assert.deepEqual(buildTaskReminderPayload({ title: "  Renew passport  " }), {
      title: TASK_REMINDER_TITLE,
      body: "Renew passport",
      url: TASK_REMINDER_URL,
    });
  });

  it("falls back to a generic body for an empty title", () => {
    assert.equal(
      buildTaskReminderPayload({ title: "   " }).body,
      "You have a task reminder."
    );
  });

  it("clamps the body to the push payload limit", () => {
    assert.equal(buildTaskReminderPayload({ title: "x".repeat(900) }).body.length, 500);
  });
});
