import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { incomeWriteSchema, incomeWriteToFields, validateIncomeForm } from "./IncomeService";

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

const existingIncome = {
  income: { annualGrossIncome: 120_000, taxDeductionPercentage: 20 },
  paySchedule: {
    isEnabled: 1,
    firstNominalDay: 15,
    weekendAdjustment: "previous-friday",
    netPaycheckAmountCents: 200_000,
    depositAccountId: 7,
  },
};

describe("structured income write input", () => {
  it("keeps existing values when no fields are provided", () => {
    assert.deepEqual(
      incomeWriteToFields(incomeWriteSchema.parse({}), existingIncome),
      {
        annualGrossIncome: 120_000,
        taxDeductionPercentage: 20,
        scheduleEnabled: true,
        scheduleType: "semi-monthly",
        firstNominalDay: 15,
        secondPaydayRule: "last-day",
        weekendAdjustment: "previous-friday",
        netPaycheckAmount: 200_000,
        depositAccountId: 7,
      }
    );
  });

  it("overrides only the provided fields", () => {
    const fields = incomeWriteToFields(
      incomeWriteSchema.parse({ annualGrossIncome: 150_000, netPaycheck: 1234.56 }),
      existingIncome
    );
    assert.equal(fields.annualGrossIncome, 150_000);
    assert.equal(fields.netPaycheckAmount, 123_456);
    assert.equal(fields.taxDeductionPercentage, 20);
    assert.equal(fields.depositAccountId, 7);
  });

  it("clears the net paycheck and disables the schedule", () => {
    const fields = incomeWriteToFields(
      incomeWriteSchema.parse({ netPaycheck: null, scheduleEnabled: false }),
      existingIncome
    );
    assert.equal(fields.netPaycheckAmount, null);
    assert.equal(fields.scheduleEnabled, false);
  });

  it("falls back to the form defaults when nothing is configured", () => {
    assert.deepEqual(
      incomeWriteToFields(incomeWriteSchema.parse({}), {
        income: null,
        paySchedule: null,
      }),
      {
        annualGrossIncome: 0,
        taxDeductionPercentage: 0,
        scheduleEnabled: false,
        scheduleType: "semi-monthly",
        firstNominalDay: 15,
        secondPaydayRule: "last-day",
        weekendAdjustment: "previous-friday",
        netPaycheckAmount: null,
        depositAccountId: null,
      }
    );
  });

  it("rejects out-of-range structured values", () => {
    for (const values of [
      { annualGrossIncome: -1 },
      { annualGrossIncome: 12.5 },
      { taxDeductionPercentage: 101 },
      { taxDeductionPercentage: -1 },
      { firstNominalDay: 0 },
      { firstNominalDay: 28 },
      { netPaycheck: -1 },
      { depositAccountId: 0 },
      { weekendAdjustment: "next-monday" },
    ]) {
      assert.equal(incomeWriteSchema.safeParse(values).success, false);
    }
  });
});
