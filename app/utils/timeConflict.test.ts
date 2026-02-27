import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateEndTime,
  findConflictingTasks,
  formatTimeForDisplay,
  hasTimeConflict,
} from "./timeConflict";

describe("timeConflict utilities", () => {
  it("detects overlapping and non-overlapping time ranges", () => {
    assert.equal(
      hasTimeConflict(
        { startTime: "09:00", durationMinutes: 60 },
        { startTime: "09:30", durationMinutes: 30 }
      ),
      true
    );
    assert.equal(
      hasTimeConflict(
        { startTime: "09:00", durationMinutes: 60 },
        { startTime: "10:00", durationMinutes: 30 }
      ),
      false
    );
  });

  it("finds conflicts and supports excludeTaskId", () => {
    const conflicts = findConflictingTasks(
      { startTime: "09:15", durationMinutes: 30 },
      [
        { id: "a", startTime: "09:00", durationMinutes: 30 },
        { id: "b", startTime: "09:30", durationMinutes: 30 },
        { id: "c", startTime: "11:00", durationMinutes: 30 },
      ]
    );

    assert.deepEqual(
      conflicts.map((c) => c.id),
      ["a", "b"]
    );

    const filtered = findConflictingTasks(
      { startTime: "09:15", durationMinutes: 30 },
      [
        { id: "a", startTime: "09:00", durationMinutes: 30 },
        { id: "b", startTime: "09:30", durationMinutes: 30 },
      ],
      "a"
    );

    assert.deepEqual(
      filtered.map((c) => c.id),
      ["b"]
    );
  });

  it("formats display time in 12-hour format", () => {
    assert.equal(formatTimeForDisplay("00:05"), "12:05 AM");
    assert.equal(formatTimeForDisplay("12:00"), "12:00 PM");
    assert.equal(formatTimeForDisplay("13:30"), "1:30 PM");
  });

  it("calculates end time from start and duration", () => {
    assert.equal(calculateEndTime("09:15", 45), "10:00");
    assert.equal(calculateEndTime("14:00", 90), "15:30");
  });
});
