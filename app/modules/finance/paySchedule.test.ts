import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDateKey } from "~/modules/finance/recurrence";
import { getExpectedPaycheckCents, getMostRecentPayDate, getNextPaydayAfter, getPayDatesAfter, getScheduledBillsInPayPeriod, getSemiMonthlyPayDatesForMonth } from "./paySchedule";

const schedule = { scheduleType: "semi-monthly", firstNominalDay: 15, secondPaydayRule: "last-day", weekendAdjustment: "previous-friday" };

describe("semi-monthly pay schedules", () => {
  it("moves Saturday and Sunday nominal paydays to Friday", () => {
    assert.deepEqual(getSemiMonthlyPayDatesForMonth(schedule, 2026, 7).map(formatDateKey), ["2026-08-14", "2026-08-31"]);
    assert.deepEqual(getSemiMonthlyPayDatesForMonth(schedule, 2024, 2).map(formatDateKey), ["2024-03-15", "2024-03-29"]);
  });

  it("keeps weekend nominal dates when no adjustment is selected", () => {
    assert.deepEqual(
      getSemiMonthlyPayDatesForMonth({ ...schedule, weekendAdjustment: "none" }, 2026, 7).map(formatDateKey),
      ["2026-08-15", "2026-08-31"]
    );
  });

  it("handles leap years and year boundaries while deriving future dates", () => {
    assert.deepEqual(getPayDatesAfter(schedule, new Date(Date.UTC(2024, 1, 14)), 4).map(formatDateKey), ["2024-02-15", "2024-02-29", "2024-03-15", "2024-03-29"]);
    assert.deepEqual(getPayDatesAfter(schedule, new Date(Date.UTC(2026, 11, 30)), 3).map(formatDateKey), ["2026-12-31", "2027-01-15", "2027-01-29"]);
  });

  it("uses configured net pay or an annual-income estimate", () => {
    assert.deepEqual(getExpectedPaycheckCents({ netPaycheckAmountCents: 123_456 }, 100_000, 20), { amountCents: 123_456, isEstimate: false });
    assert.deepEqual(getExpectedPaycheckCents({}, 120_000, 20), { amountCents: 400_000, isEstimate: true });
  });

  it("assigns bills on payday to the new half-open pay period", () => {
    const expenses = [
      { id: 1, name: "Payday bill", monthlyCost: 10_000, isActive: 1, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-15", chargeDay: 15, lastDayOfMonth: 0 },
      { id: 2, name: "Next payday bill", monthlyCost: 20_000, isActive: 1, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-31", chargeDay: 31, lastDayOfMonth: 0 },
    ];
    const bills = getScheduledBillsInPayPeriod(expenses, new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 0, 30)));
    assert.deepEqual(bills.map((bill) => bill.name), ["Payday bill"]);
  });

  it("moves a next-payday bill into the new period without double-counting it", () => {
    const expenses = [
      { id: 1, name: "Boundary bill", monthlyCost: 10_000, isActive: 1, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-30", chargeDay: 30, lastDayOfMonth: 0 },
    ];
    const firstPeriod = getScheduledBillsInPayPeriod(expenses, new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 0, 30)));
    const secondPeriod = getScheduledBillsInPayPeriod(expenses, new Date(Date.UTC(2026, 0, 30)), new Date(Date.UTC(2026, 1, 13)));
    assert.deepEqual(firstPeriod, []);
    assert.deepEqual(secondPeriod.map((bill) => bill.name), ["Boundary bill"]);
  });

  it("finds the most recent payday on or before the reference date across month boundaries", () => {
    const assertPayDate = (reference: Date, expected: string) => {
      const payDate = getMostRecentPayDate(schedule, reference);
      assert.ok(payDate);
      if (payDate) assert.equal(formatDateKey(payDate), expected);
    };
    assertPayDate(new Date(Date.UTC(2026, 7, 30, 12)), "2026-08-14");
    assertPayDate(new Date(Date.UTC(2026, 8, 1)), "2026-08-31");
    assertPayDate(new Date(Date.UTC(2026, 0, 1)), "2025-12-31");
    assertPayDate(new Date(Date.UTC(2026, 0, 14)), "2025-12-31");
  });

  it("bounds the current pay period so payday bills are funded by the new paycheck", () => {
    // On a payday the window extends to the following payday; mid-period it ends before the next one.
    const onPayday = getNextPaydayAfter(schedule, new Date(Date.UTC(2026, 7, 31)));
    const midPeriod = getNextPaydayAfter(schedule, new Date(Date.UTC(2026, 8, 3)));
    assert.ok(onPayday && midPeriod);
    if (onPayday && midPeriod) {
      assert.equal(formatDateKey(onPayday), "2026-09-15");
      assert.equal(formatDateKey(midPeriod), "2026-09-15");
    }
  });
});
