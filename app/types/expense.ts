import type { financeAccountBalanceSnapshotsTable, financeExpenseChargesTable } from "~/db/schema";

export interface Expense {
  id: number;
  userId: number;
  name: string;
  monthlyCost: number;
  chargeDay: number;
  category: string;
  accountId: number | null;
  recurrenceFrequency: string;
  recurrenceAnchor: string;
  lastDayOfMonth: number;
  necessity: string;
  costType: string;
  paymentMethod: string;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCharge = typeof financeExpenseChargesTable.$inferSelect;

export type AccountBalanceSnapshot = typeof financeAccountBalanceSnapshotsTable.$inferSelect;

export type ExpenseFormErrors = Partial<
  Record<"id" | "name" | "monthlyCost" | "chargeDay" | "category" | "recurrenceFrequency" | "recurrenceAnchor" | "accountId" | "necessity" | "costType" | "paymentMethod" | "expenseId" | "chargeDate" | "amount" | "balance" | "balanceDate", string>
>;

export type ExpenseActionResult =
  | { ok: true; action: "add" | "update" | "delete" | "toggleStatus" | "addPaymentAccount" | "deletePaymentAccount" | "markChargePaid" | "unmarkChargePaid" | "logBalance"; message: string }
  | { ok: false; error: string; fieldErrors?: ExpenseFormErrors };
