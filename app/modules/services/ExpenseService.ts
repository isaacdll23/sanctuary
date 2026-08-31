import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { financeAccountBalanceSnapshotsTable, financeExpenseChargesTable, financeExpensesTable, financeIncomeTable, financePaymentAccountsTable, financePaySchedulesTable } from "~/db/schema";
import type { ExpenseActionResult, ExpenseFormErrors } from "~/types/expense";

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to two decimal places.")
  .transform((value) => Math.round(Number(value) * 100))
  .refine((value) => value > 0, "Amount per charge must be greater than zero.");

const idSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Invalid expense.")
  .transform(Number)
  .pipe(z.number().int().positive("Invalid expense."));

const optionalAccountIdSchema = z.union([z.literal(""), z.string().trim().regex(/^\d+$/, "Invalid payment account.").transform(Number).pipe(z.number().int().positive("Invalid payment account."))])
  .transform((value) => value === "" ? null : value);

const dateKeySchema = makeDateKeySchema("Choose a valid billing date.");

function makeDateKeySchema(message: string) {
  return z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, message).refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }, message);
}

/** Balances may be zero or negative (overdraft), unlike expense amounts. */
const balanceAmountSchema = z
  .string()
  .trim()
  .regex(/^-?\d+(?:\.\d{1,2})?$/, "Enter a valid balance with up to two decimal places.")
  .transform((value) => Math.round(Number(value) * 100));

export function normalizeExpenseCategory(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .replace(/(^|[\s/&-])\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

const expenseFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Expense name is required.")
    .max(255, "Expense name must be 255 characters or fewer."),
  monthlyCost: moneySchema,
  chargeDay: z
    .string()
    .trim()
    .regex(/^\d+$/, "Charge day must be a whole number.")
    .transform(Number)
    .pipe(z.number().int().min(1, "Charge day must be between 1 and 31.").max(31, "Charge day must be between 1 and 31.")),
  category: z
    .string()
    .transform(normalizeExpenseCategory)
    .pipe(z.string().min(1, "Category is required.").max(255, "Category must be 255 characters or fewer.")),
  recurrenceFrequency: z.enum(["monthly", "weekly", "biweekly", "quarterly", "yearly"]),
  recurrenceAnchor: dateKeySchema,
  lastDayOfMonth: z.boolean(),
  necessity: z.enum(["essential", "discretionary"]),
  costType: z.enum(["fixed", "variable"]),
  paymentMethod: z.enum(["autopay", "manual"]),
  accountId: optionalAccountIdSchema,
  isActive: z.boolean(),
});

const addExpenseSchema = expenseFieldsSchema;
const updateExpenseSchema = expenseFieldsSchema.extend({ id: idSchema });
const deleteExpenseSchema = z.object({ id: idSchema });
const expenseStatusSchema = z.object({
  id: idSchema,
  isActive: z.enum(["0", "1"]),
});
const paymentAccountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required.").max(255, "Account name must be 255 characters or fewer."),
});

const expenseChargeSchema = z.object({ expenseId: idSchema, chargeDate: dateKeySchema });
const markChargePaidSchema = expenseChargeSchema.extend({ amount: moneySchema });

const balanceCheckInSchema = z.object({
  accountId: idSchema,
  balanceDate: makeDateKeySchema("Choose a valid balance date."),
  balance: balanceAmountSchema,
});

type ExpenseFields = z.infer<typeof expenseFieldsSchema>;

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function formErrors(error: z.ZodError): ExpenseActionResult {
  const fieldErrors: ExpenseFormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as keyof ExpenseFormErrors] = issue.message;
    }
  }
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}

function expenseFormInput(formData: FormData) {
  return {
    name: formValue(formData, "name"),
    monthlyCost: formValue(formData, "monthlyCost"),
    chargeDay: formValue(formData, "chargeDay"),
    category: formValue(formData, "category"),
    recurrenceFrequency: formValue(formData, "recurrenceFrequency"),
    recurrenceAnchor: formValue(formData, "recurrenceAnchor"),
    lastDayOfMonth: formData.get("lastDayOfMonth") === "1",
    necessity: formValue(formData, "necessity"),
    costType: formValue(formData, "costType"),
    paymentMethod: formValue(formData, "paymentMethod"),
    accountId: formValue(formData, "accountId"),
    isActive: formData.get("isActive") === "1",
  };
}

/** Parse an expense form without touching the database. */
export function validateExpenseForm(
  formData: FormData,
  action: "add" | "update"
): { success: true; data: ExpenseFields & { id?: number } } | { success: false; result: ExpenseActionResult } {
  const input = expenseFormInput(formData);
  const parsed = action === "update"
    ? updateExpenseSchema.safeParse({ ...input, id: formValue(formData, "id") })
    : addExpenseSchema.safeParse(input);

  if (parsed.success) {
    const data = parsed.data.recurrenceFrequency === "monthly"
      ? { ...parsed.data, recurrenceAnchor: `2000-01-${String(parsed.data.chargeDay).padStart(2, "0")}` }
      : { ...parsed.data, chargeDay: Number(parsed.data.recurrenceAnchor.slice(-2)) };
    return { success: true, data };
  }
  return { success: false, result: formErrors(parsed.error) };
}

export function validateExpenseDelete(formData: FormData):
  | { success: true; id: number }
  | { success: false; result: ExpenseActionResult } {
  const parsed = deleteExpenseSchema.safeParse({ id: formValue(formData, "id") });
  return parsed.success
    ? { success: true, id: parsed.data.id }
    : { success: false, result: formErrors(parsed.error) };
}

/** Validate the small, purpose-built payload used by the inline pause/resume control. */
export function validateExpenseStatus(formData: FormData):
  | { success: true; id: number; isActive: boolean }
  | { success: false; result: ExpenseActionResult } {
  const parsed = expenseStatusSchema.safeParse({
    id: formValue(formData, "id"),
    isActive: formValue(formData, "isActive"),
  });
  return parsed.success
    ? { success: true, id: parsed.data.id, isActive: parsed.data.isActive === "1" }
    : { success: false, result: formErrors(parsed.error) };
}

export function validatePaymentAccountForm(formData: FormData):
  | { success: true; data: z.infer<typeof paymentAccountSchema> }
  | { success: false; result: ExpenseActionResult } {
  const parsed = paymentAccountSchema.safeParse({ name: formValue(formData, "name") });
  return parsed.success ? { success: true, data: parsed.data } : { success: false, result: formErrors(parsed.error) };
}

/** Validate a balance check-in for one payment account. */
export function validateBalanceCheckIn(formData: FormData):
  | { success: true; data: { accountId: number; balanceDate: string; balanceCents: number } }
  | { success: false; result: ExpenseActionResult } {
  const parsed = balanceCheckInSchema.safeParse({
    accountId: formValue(formData, "accountId"),
    balanceDate: formValue(formData, "balanceDate"),
    balance: formValue(formData, "balance"),
  });
  if (!parsed.success) return { success: false, result: chargeFormErrors(parsed.error) };
  return { success: true, data: { accountId: parsed.data.accountId, balanceDate: parsed.data.balanceDate, balanceCents: parsed.data.balance } };
}

/** Validate the charge-ledger payloads used by mark-as-paid and its undo. */
export function validateExpenseChargeForm(
  formData: FormData,
  action: "mark" | "unmark"
):
  | { success: true; data: { expenseId: number; chargeDate: string; amountCents: number | null } }
  | { success: false; result: ExpenseActionResult } {
  const input = { expenseId: formValue(formData, "expenseId"), chargeDate: formValue(formData, "chargeDate") };

  if (action === "mark") {
    const parsed = markChargePaidSchema.safeParse({ ...input, amount: formValue(formData, "amount") });
    if (!parsed.success) return { success: false, result: chargeFormErrors(parsed.error) };
    return { success: true, data: { expenseId: parsed.data.expenseId, chargeDate: parsed.data.chargeDate, amountCents: parsed.data.amount } };
  }

  const parsed = expenseChargeSchema.safeParse(input);
  if (!parsed.success) return { success: false, result: chargeFormErrors(parsed.error) };
  return { success: true, data: { expenseId: parsed.data.expenseId, chargeDate: parsed.data.chargeDate, amountCents: null } };
}

/** The charge form renders inline, so surface the first concrete issue instead of a generic banner. */
function chargeFormErrors(error: z.ZodError): ExpenseActionResult {
  const fieldErrors: ExpenseFormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as keyof ExpenseFormErrors] = issue.message;
    }
  }
  return { ok: false, error: error.issues[0]?.message ?? "Please correct the highlighted fields.", fieldErrors };
}

export async function getExpensesForUser(userId: number) {
  return db
    .select()
    .from(financeExpensesTable)
    .where(eq(financeExpensesTable.userId, userId))
    .orderBy(desc(financeExpensesTable.createdAt));
}

export async function getLatestIncomeForUser(userId: number) {
  const [income] = await db
    .select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, userId))
    .orderBy(desc(financeIncomeTable.createdAt))
    .limit(1);
  return income;
}

export async function getPaymentAccountsForUser(userId: number) {
  return db.select().from(financePaymentAccountsTable).where(eq(financePaymentAccountsTable.userId, userId)).orderBy(financePaymentAccountsTable.name);
}

export async function isPaymentAccountOwnedByUser(userId: number, accountId: number | null) {
  if (accountId == null) return true;
  const [account] = await db.select({ id: financePaymentAccountsTable.id }).from(financePaymentAccountsTable)
    .where(and(eq(financePaymentAccountsTable.id, accountId), eq(financePaymentAccountsTable.userId, userId))).limit(1);
  return Boolean(account);
}

export async function createPaymentAccountForUser(userId: number, name: string) {
  return db.insert(financePaymentAccountsTable).values({ userId, name }).returning({ id: financePaymentAccountsTable.id });
}

/** Unlinks a user's expenses before removing their account; no expense is deleted. */
export async function deletePaymentAccountForUser(userId: number, id: number) {
  return db.transaction(async (tx) => {
    const [account] = await tx.select({ id: financePaymentAccountsTable.id }).from(financePaymentAccountsTable)
      .where(and(eq(financePaymentAccountsTable.id, id), eq(financePaymentAccountsTable.userId, userId))).limit(1);
    if (!account) return [];
    await tx.update(financeExpensesTable).set({ accountId: null, updatedAt: new Date() })
      .where(and(eq(financeExpensesTable.userId, userId), eq(financeExpensesTable.accountId, id)));
    await tx.update(financePaySchedulesTable).set({ depositAccountId: null, updatedAt: new Date() })
      .where(and(eq(financePaySchedulesTable.userId, userId), eq(financePaySchedulesTable.depositAccountId, id)));
    return tx.delete(financePaymentAccountsTable).where(and(eq(financePaymentAccountsTable.id, id), eq(financePaymentAccountsTable.userId, userId))).returning({ id: financePaymentAccountsTable.id });
  });
}

export async function createExpenseForUser(userId: number, values: ExpenseFields) {
  await db.insert(financeExpensesTable).values({ userId, ...values, lastDayOfMonth: values.lastDayOfMonth ? 1 : 0, isActive: values.isActive ? 1 : 0 });
}

export async function updateExpenseForUser(userId: number, id: number, values: ExpenseFields) {
  return db
    .update(financeExpensesTable)
    .set({ ...values, lastDayOfMonth: values.lastDayOfMonth ? 1 : 0, isActive: values.isActive ? 1 : 0, updatedAt: new Date() })
    .where(and(eq(financeExpensesTable.id, id), eq(financeExpensesTable.userId, userId)))
    .returning({ id: financeExpensesTable.id });
}

/** Ownership is part of the write predicate so an expense can only be paused by its owner. */
export async function setExpenseActiveForUser(userId: number, id: number, isActive: boolean) {
  return db
    .update(financeExpensesTable)
    .set({ isActive: isActive ? 1 : 0, updatedAt: new Date() })
    .where(and(eq(financeExpensesTable.id, id), eq(financeExpensesTable.userId, userId)))
    .returning({ id: financeExpensesTable.id });
}

export async function deleteExpenseForUser(userId: number, id: number) {
  return db
    .delete(financeExpensesTable)
    .where(and(eq(financeExpensesTable.id, id), eq(financeExpensesTable.userId, userId)))
    .returning({ id: financeExpensesTable.id });
}

/** Charge records from `sinceDate` onward, newest first, for paid-state lookups. */
export async function getExpenseChargesForUser(userId: number, sinceDate: string) {
  return db
    .select()
    .from(financeExpenseChargesTable)
    .where(and(eq(financeExpenseChargesTable.userId, userId), gte(financeExpenseChargesTable.chargeDate, sinceDate)))
    .orderBy(desc(financeExpenseChargesTable.chargeDate));
}

/** Records an actual charge occurrence; ownership of the expense is confirmed before the upsert. */
export async function setExpenseChargeForUser(userId: number, expenseId: number, chargeDate: string, amountCents: number) {
  return db.transaction(async (tx) => {
    const [expense] = await tx.select({ id: financeExpensesTable.id, name: financeExpensesTable.name }).from(financeExpensesTable)
      .where(and(eq(financeExpensesTable.id, expenseId), eq(financeExpensesTable.userId, userId))).limit(1);
    if (!expense) return null;
    await tx.insert(financeExpenseChargesTable)
      .values({ userId, expenseId, chargeDate, amountCents })
      .onConflictDoUpdate({
        target: [financeExpenseChargesTable.expenseId, financeExpenseChargesTable.chargeDate],
        set: { amountCents, updatedAt: new Date() },
      });
    return expense;
  });
}

export async function deleteExpenseChargeForUser(userId: number, expenseId: number, chargeDate: string) {
  return db
    .delete(financeExpenseChargesTable)
    .where(and(eq(financeExpenseChargesTable.userId, userId), eq(financeExpenseChargesTable.expenseId, expenseId), eq(financeExpenseChargesTable.chargeDate, chargeDate)))
    .returning({ id: financeExpenseChargesTable.id });
}

/** Balance snapshots from `sinceDate` onward, newest first, for staleness and current-balance lookups. */
export async function getBalanceSnapshotsForUser(userId: number, sinceDate: string) {
  return db
    .select()
    .from(financeAccountBalanceSnapshotsTable)
    .where(and(eq(financeAccountBalanceSnapshotsTable.userId, userId), gte(financeAccountBalanceSnapshotsTable.balanceDate, sinceDate)))
    .orderBy(desc(financeAccountBalanceSnapshotsTable.balanceDate), desc(financeAccountBalanceSnapshotsTable.id));
}

/** Records a balance check-in; ownership of the account is confirmed before the upsert. */
export async function upsertBalanceSnapshotForUser(userId: number, accountId: number, balanceDate: string, balanceCents: number) {
  return db.transaction(async (tx) => {
    const [account] = await tx.select({ id: financePaymentAccountsTable.id, name: financePaymentAccountsTable.name }).from(financePaymentAccountsTable)
      .where(and(eq(financePaymentAccountsTable.id, accountId), eq(financePaymentAccountsTable.userId, userId))).limit(1);
    if (!account) return null;
    await tx.insert(financeAccountBalanceSnapshotsTable)
      .values({ userId, accountId, balanceDate, balanceCents })
      .onConflictDoUpdate({
        target: [financeAccountBalanceSnapshotsTable.accountId, financeAccountBalanceSnapshotsTable.balanceDate],
        set: { balanceCents, updatedAt: new Date() },
      });
    return account;
  });
}
