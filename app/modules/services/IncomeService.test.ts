import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateIncomeForm } from "./IncomeService";

function incomeForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ annualGrossIncome: "120000", taxDeductionPercentage: "20", scheduleType: "semi-monthly", firstNominalDay: "15", secondPaydayRule: "last-day", weekendAdjustment: "previous-friday", netPaycheckAmount: "", depositAccountId: "", ...values })) form.set(key, value);
  form.set("scheduleEnabled", "1");
  return form;
}

describe("income schedule validation", () => {
  it("parses cents for an optional configured net paycheck", () => {
    const result = validateIncomeForm(incomeForm({ netPaycheckAmount: "1234.56", depositAccountId: "7" }));
    assert.equal(result.success, true);
    if (result.success) { assert.equal(result.data.netPaycheckAmount, 123456); assert.equal(result.data.depositAccountId, 7); }
  });

  it("rejects invalid or arbitrary-shaped payment account ids", () => {
    assert.equal(validateIncomeForm(incomeForm({ depositAccountId: "7oops" })).success, false);
    assert.equal(validateIncomeForm(incomeForm({ firstNominalDay: "28" })).success, false);
  });

  it("accepts no weekend adjustment", () => {
    const result = validateIncomeForm(incomeForm({ weekendAdjustment: "none" }));
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.weekendAdjustment, "none");
  });
});
