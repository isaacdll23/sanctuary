import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateIncomeCents } from "./useIncomeCalculations";

describe("calculateIncomeCents", () => {
  it("keeps income and expenses in cents when calculating remaining income", () => {
    const result = calculateIncomeCents(10_000_000, 20, 200_000);
    assert.equal(result.annualNetIncome, 8_000_000);
    assert.equal(result.monthlyNetIncome, 666_666.6666666666);
    assert.equal(result.netRemainingMonthly, 466_666.6666666666);
    assert.equal(result.netRemainingYearly, 5_600_000);
  });
});
