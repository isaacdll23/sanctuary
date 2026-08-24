import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeExpenseCategory,
  validateExpenseDelete,
  validateExpenseForm,
  validateExpenseStatus,
} from "./ExpenseService";

function expenseForm(values: Partial<Record<string, string>> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: " Rent ",
    monthlyCost: "1250.50",
    chargeDay: "1",
    category: " home   & UTILITIES ",
    recurrenceFrequency: "monthly",
    recurrenceAnchor: "2000-01-01",
    necessity: "essential",
    costType: "fixed",
    paymentMethod: "autopay",
    accountId: "",
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
        recurrenceFrequency: "monthly",
        recurrenceAnchor: "2000-01-01",
        lastDayOfMonth: false,
        necessity: "essential",
        costType: "fixed",
        paymentMethod: "autopay",
        accountId: null,
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

  it("validates the explicit active state used by inline pause and resume", () => {
    assert.deepEqual(validateExpenseStatus(expenseForm({ id: "5", isActive: "0" })), {
      success: true,
      id: 5,
      isActive: false,
    });
    assert.equal(validateExpenseStatus(expenseForm({ id: "5", isActive: "paused" })).success, false);
  });

  it("uses a stable category display name", () => {
    assert.equal(normalizeExpenseCategory(" streaming   services "), "Streaming Services");
  });

  it("uses the supplied anchor for non-monthly schedules and rejects invalid account ids", () => {
    const result = validateExpenseForm(expenseForm({ recurrenceFrequency: "weekly", recurrenceAnchor: "2026-08-24", accountId: "12" }), "add");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.chargeDay, 24);
      assert.equal(result.data.accountId, 12);
    }
    assert.equal(validateExpenseForm(expenseForm({ accountId: "12oops" }), "add").success, false);
  });
});
