import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeExpenseCategory,
  validateExpenseDelete,
  validateExpenseForm,
} from "./ExpenseService";

function expenseForm(values: Partial<Record<string, string>> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: " Rent ",
    monthlyCost: "1250.50",
    chargeDay: "1",
    category: " home   & UTILITIES ",
    isActive: "1",
    ...values,
  })) form.set(key, value);
  return form;
}

describe("expense form validation", () => {
  it("normalizes valid input and converts dollars to cents", () => {
    const result = validateExpenseForm(expenseForm(), "add");
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data, {
        name: "Rent",
        monthlyCost: 125050,
        chargeDay: 1,
        category: "Home & Utilities",
        isActive: true,
      });
    }
  });

  it("rejects partial, non-positive, and out-of-range values", () => {
    for (const values of [
      { monthlyCost: "12oops" },
      { monthlyCost: "0" },
      { chargeDay: "32" },
      { name: "   " },
      { category: "  " },
    ]) {
      assert.equal(validateExpenseForm(expenseForm(values), "add").success, false);
    }
  });

  it("requires a strictly positive integer id for update and delete", () => {
    assert.equal(validateExpenseForm(expenseForm({ id: "5" }), "update").success, true);
    assert.equal(validateExpenseForm(expenseForm({ id: "5junk" }), "update").success, false);
    assert.equal(validateExpenseDelete(expenseForm({ id: "0" })).success, false);
  });

  it("uses a stable category display name", () => {
    assert.equal(normalizeExpenseCategory(" streaming   services "), "Streaming Services");
  });
});
