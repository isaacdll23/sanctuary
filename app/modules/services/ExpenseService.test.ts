import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeExpenseCategory,
  validateBalanceCheckIn,
  validateExpenseChargeForm,
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

describe("expense charge ledger validation", () => {
  function chargeForm(values: Partial<Record<string, string>> = {}) {
    const form = new FormData();
    for (const [key, value] of Object.entries({ expenseId: "5", chargeDate: "2026-09-01", amount: "84.20", ...values })) form.set(key, value);
    return form;
  }

  it("parses mark-as-paid with dollars converted to cents", () => {
    assert.deepEqual(validateExpenseChargeForm(chargeForm(), "mark"), {
      success: true,
      data: { expenseId: 5, chargeDate: "2026-09-01", amountCents: 8420 },
    });
  });

  it("rejects invalid ids, dates, and non-positive amounts when marking paid", () => {
    for (const values of [{ expenseId: "0" }, { expenseId: "junk" }, { chargeDate: "2026-13-01" }, { chargeDate: "2026-02-30" }, { amount: "" }, { amount: "0" }, { amount: "-4" }, { amount: "1.999" }]) {
      assert.equal(validateExpenseChargeForm(chargeForm(values), "mark").success, false);
    }
  });

  it("validates undo without requiring an amount", () => {
    assert.deepEqual(validateExpenseChargeForm(chargeForm({ amount: "" }), "unmark"), {
      success: true,
      data: { expenseId: 5, chargeDate: "2026-09-01", amountCents: null },
    });
    assert.equal(validateExpenseChargeForm(chargeForm({ chargeDate: "not-a-date" }), "unmark").success, false);
  });
});

describe("balance check-in validation", () => {
  function balanceForm(values: Partial<Record<string, string>> = {}) {
    const form = new FormData();
    for (const [key, value] of Object.entries({ accountId: "7", balanceDate: "2026-08-31", balance: "1250.50", ...values })) form.set(key, value);
    return form;
  }

  it("parses a balance check-in with dollars converted to cents", () => {
    assert.deepEqual(validateBalanceCheckIn(balanceForm()), {
      success: true,
      data: { accountId: 7, balanceDate: "2026-08-31", balanceCents: 125050 },
    });
  });

  it("allows zero and negative balances (overdraft)", () => {
    const zero = validateBalanceCheckIn(balanceForm({ balance: "0" }));
    const overdraft = validateBalanceCheckIn(balanceForm({ balance: "-42.10" }));
    assert.ok(zero.success && overdraft.success);
    if (zero.success && overdraft.success) {
      assert.equal(zero.data.balanceCents, 0);
      assert.equal(overdraft.data.balanceCents, -4210);
    }
  });

  it("rejects invalid accounts, dates, and malformed balances", () => {
    for (const values of [{ accountId: "0" }, { accountId: "" }, { balanceDate: "2026-13-01" }, { balanceDate: "2026-02-30" }, { balance: "" }, { balance: "1,234.50" }, { balance: "12.345" }]) {
      assert.equal(validateBalanceCheckIn(balanceForm(values)).success, false);
    }
  });
});
