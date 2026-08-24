import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDateKey, getChargeDatesInRange, getNextChargeDate, getNormalizedMonthlyCostCents, getNormalizedYearlyCostCents } from "./recurrence";

describe("expense recurrence", () => {
  it("clamps numbered monthly charges in short months", () => {
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-31", chargeDay: 31 }, new Date(Date.UTC(2027, 1, 1)))), "2027-02-28");
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-31", chargeDay: 31 }, new Date(Date.UTC(2028, 1, 1)))), "2028-02-29");
  });

  it("supports an explicit last-day rule and quarter/year anchors", () => {
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-15", chargeDay: 15, lastDayOfMonth: 1 }, new Date(Date.UTC(2027, 3, 1)))), "2027-04-30");
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "quarterly", recurrenceAnchor: "2026-01-31", chargeDay: 31 }, new Date(Date.UTC(2026, 4, 1)))), "2026-07-31");
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "yearly", recurrenceAnchor: "2024-02-29", chargeDay: 29 }, new Date(Date.UTC(2025, 2, 1)))), "2026-02-28");
  });

  it("derives weekly and biweekly schedules from their anchor", () => {
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "weekly", recurrenceAnchor: "2026-08-03" }, new Date(Date.UTC(2026, 7, 5)))), "2026-08-10");
    assert.equal(formatDateKey(getNextChargeDate({ monthlyCost: 100, recurrenceFrequency: "biweekly", recurrenceAnchor: "2026-08-03" }, new Date(Date.UTC(2026, 7, 17)))), "2026-08-17");
  });

  it("lists every charge in a range for accurate upcoming cash flow", () => {
    const dates = getChargeDatesInRange(
      { monthlyCost: 100, recurrenceFrequency: "weekly", recurrenceAnchor: "2026-08-03" },
      new Date(Date.UTC(2026, 7, 5)),
      new Date(Date.UTC(2026, 8, 3))
    );
    assert.deepEqual(dates.map(formatDateKey), ["2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31"]);
  });

  it("normalizes each cadence from its annual cost in cents", () => {
    assert.equal(getNormalizedYearlyCostCents({ monthlyCost: 1000, recurrenceFrequency: "weekly" }), 52000);
    assert.equal(getNormalizedMonthlyCostCents({ monthlyCost: 1000, recurrenceFrequency: "weekly" }), 4333);
    assert.equal(getNormalizedMonthlyCostCents({ monthlyCost: 12000, recurrenceFrequency: "yearly" }), 1000);
  });
});
