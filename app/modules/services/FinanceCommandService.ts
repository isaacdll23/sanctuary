import {
  createExpenseForUser,
  createPaymentAccountForUser,
  deleteExpenseChargeForUser,
  deleteExpenseForUser,
  deletePaymentAccountForUser,
  isPaymentAccountOwnedByUser,
  setExpenseActiveForUser,
  setExpenseChargeForUser,
  updateExpenseForUser,
  type ExpenseFields,
  upsertBalanceSnapshotForUser,
} from "~/modules/services/ExpenseService";
import {
  saveIncomeOverviewForUser,
  type IncomeFields,
} from "~/modules/services/IncomeService";
import type { ExpenseActionResult } from "~/types/expense";
import type { IncomeActionResult } from "~/types/income";

/**
 * Application-level finance commands shared by every write entrypoint.
 *
 * Route actions validate FormData and the assistant tools validate structured
 * input; both then call these functions so ownership checks, persistence, and
 * user-facing result messages live in exactly one place.
 */

export async function createExpense(
  userId: number,
  fields: ExpenseFields
): Promise<ExpenseActionResult> {
  if (!(await isPaymentAccountOwnedByUser(userId, fields.accountId))) {
    return { ok: false, error: "Select one of your payment accounts." };
  }
  await createExpenseForUser(userId, fields);
  return { ok: true, action: "add", message: "Expense added." };
}

export async function updateExpense(
  userId: number,
  id: number,
  fields: ExpenseFields
): Promise<ExpenseActionResult> {
  if (!(await isPaymentAccountOwnedByUser(userId, fields.accountId))) {
    return { ok: false, error: "Select one of your payment accounts." };
  }
  const updated = await updateExpenseForUser(userId, id, fields);
  return updated.length
    ? { ok: true, action: "update", message: "Expense updated." }
    : { ok: false, error: "Expense not found or permission denied." };
}

export async function deleteExpense(
  userId: number,
  id: number
): Promise<ExpenseActionResult> {
  const deleted = await deleteExpenseForUser(userId, id);
  return deleted.length
    ? { ok: true, action: "delete", message: "Expense deleted." }
    : { ok: false, error: "Expense not found or permission denied." };
}

export async function setExpenseActive(
  userId: number,
  id: number,
  isActive: boolean
): Promise<ExpenseActionResult> {
  const updated = await setExpenseActiveForUser(userId, id, isActive);
  return updated.length
    ? {
        ok: true,
        action: "toggleStatus",
        message: isActive
          ? "Expense resumed and included in totals."
          : "Expense paused and excluded from totals.",
      }
    : { ok: false, error: "Expense not found or permission denied." };
}

export async function recordExpenseCharge(
  userId: number,
  expenseId: number,
  chargeDate: string,
  amountCents: number
): Promise<ExpenseActionResult> {
  const expense = await setExpenseChargeForUser(
    userId,
    expenseId,
    chargeDate,
    amountCents
  );
  return expense
    ? {
        ok: true,
        action: "markChargePaid",
        message: `${expense.name} marked paid for ${chargeDate}.`,
      }
    : { ok: false, error: "Expense not found or permission denied." };
}

export async function removeExpenseCharge(
  userId: number,
  expenseId: number,
  chargeDate: string
): Promise<ExpenseActionResult> {
  const removed = await deleteExpenseChargeForUser(
    userId,
    expenseId,
    chargeDate
  );
  return removed.length
    ? {
        ok: true,
        action: "unmarkChargePaid",
        message: "Charge marked unpaid and removed from the ledger.",
      }
    : { ok: false, error: "No recorded charge found for this expense and date." };
}

export async function logAccountBalance(
  userId: number,
  accountId: number,
  balanceDate: string,
  balanceCents: number
): Promise<ExpenseActionResult> {
  const account = await upsertBalanceSnapshotForUser(
    userId,
    accountId,
    balanceDate,
    balanceCents
  );
  return account
    ? {
        ok: true,
        action: "logBalance",
        message: `Balance for ${account.name} logged for ${balanceDate}.`,
      }
    : { ok: false, error: "Payment account not found or permission denied." };
}

export async function createPaymentAccount(
  userId: number,
  name: string
): Promise<ExpenseActionResult> {
  await createPaymentAccountForUser(userId, name);
  return { ok: true, action: "addPaymentAccount", message: "Payment account added." };
}

export async function deletePaymentAccount(
  userId: number,
  id: number
): Promise<ExpenseActionResult> {
  const deleted = await deletePaymentAccountForUser(userId, id);
  return deleted.length
    ? {
        ok: true,
        action: "deletePaymentAccount",
        message:
          "Payment account removed. Linked expenses are now unassigned.",
      }
    : { ok: false, error: "Payment account not found or permission denied." };
}

export async function saveIncome(
  userId: number,
  fields: IncomeFields
): Promise<IncomeActionResult> {
  const saved = await saveIncomeOverviewForUser(userId, fields);
  return saved.ok
    ? { ok: true, message: "Income and pay schedule saved." }
    : saved;
}
