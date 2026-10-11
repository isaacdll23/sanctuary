import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { financeIncomeTable, financePaymentAccountsTable, financePaySchedulesTable } from "~/db/schema";
import type { IncomeActionResult, IncomeFormErrors } from "~/types/income";

const moneySchema = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid dollar amount.").transform((value) => Math.round(Number(value) * 100));
const annualGrossSchema = z.string().trim().regex(/^\d+$/, "Annual gross income must be whole dollars.").transform(Number).pipe(z.number().int().nonnegative());
const optionalAccountSchema = z.union([z.literal(""), z.string().trim().regex(/^\d+$/, "Invalid payment account.").transform(Number).pipe(z.number().int().positive("Invalid payment account."))]).transform((value) => value === "" ? null : value);

const incomeFormSchema = z.object({
  annualGrossIncome: annualGrossSchema,
  taxDeductionPercentage: z.string().trim().regex(/^\d+$/, "Tax percentage must be a whole number.").transform(Number).pipe(z.number().int().min(0).max(100)),
  scheduleEnabled: z.boolean(),
  scheduleType: z.literal("semi-monthly"),
  firstNominalDay: z.string().trim().regex(/^\d+$/, "Choose a valid first payday.").transform(Number).pipe(z.number().int().min(1).max(27)),
  secondPaydayRule: z.literal("last-day"),
  weekendAdjustment: z.enum(["previous-friday", "none"]),
  netPaycheckAmount: z.union([z.literal(""), moneySchema]).transform((value) => value === "" ? null : value),
  depositAccountId: optionalAccountSchema,
});

/** Validated income and pay-schedule values shared by the route form and the assistant. */
export type IncomeFields = z.infer<typeof incomeFormSchema>;

/**
 * Structured income input for non-form callers, notably the assistant. The web
 * form posts strings through `incomeFormSchema`; this mirrors the same fields
 * with native types so both boundaries normalize to one `IncomeFields` shape.
 */
export const incomeWriteSchema = z.object({
  annualGrossIncome: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Annual gross income in whole US dollars."),
  taxDeductionPercentage: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe("Tax deduction percentage, 0–100."),
  scheduleEnabled: z
    .boolean()
    .optional()
    .describe("Whether to use a primary semi-monthly pay schedule."),
  firstNominalDay: z
    .number()
    .int()
    .min(1)
    .max(27)
    .optional()
    .describe("First nominal payday day of month (1–27)."),
  weekendAdjustment: z
    .enum(["previous-friday", "none"])
    .optional()
    .describe("Whether a weekend payday moves to the previous Friday."),
  netPaycheck: z
    .number()
    .finite()
    .nonnegative()
    .nullable()
    .optional()
    .describe(
      "Actual net pay per paycheck in US dollars, or null to estimate it from annual income."
    ),
  depositAccountId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe("Payment account id for deposits, or null for unassigned."),
});

export type IncomeWriteInput = z.infer<typeof incomeWriteSchema>;

/** The subset of current income and pay-schedule values a merge needs. */
export interface CurrentIncomeSnapshot {
  income: {
    annualGrossIncome: number;
    taxDeductionPercentage: number;
  } | null;
  paySchedule: {
    isEnabled: number;
    firstNominalDay: number;
    weekendAdjustment: string;
    netPaycheckAmountCents: number | null;
    depositAccountId: number | null;
  } | null;
}

/**
 * Merges a partial income update onto the user's current income and pay
 * schedule, matching the income form's schedule conventions. Missing values
 * fall back to existing rows, then to the form's defaults.
 */
export function incomeWriteToFields(
  input: IncomeWriteInput,
  current: CurrentIncomeSnapshot
): IncomeFields {
  const { income, paySchedule } = current;
  return {
    annualGrossIncome: input.annualGrossIncome ?? income?.annualGrossIncome ?? 0,
    taxDeductionPercentage:
      input.taxDeductionPercentage ?? income?.taxDeductionPercentage ?? 0,
    scheduleEnabled:
      input.scheduleEnabled ?? (paySchedule?.isEnabled ?? 0) !== 0,
    scheduleType: "semi-monthly",
    firstNominalDay: input.firstNominalDay ?? paySchedule?.firstNominalDay ?? 15,
    secondPaydayRule: "last-day",
    weekendAdjustment:
      input.weekendAdjustment ??
      (paySchedule?.weekendAdjustment === "none" ? "none" : "previous-friday"),
    netPaycheckAmount:
      input.netPaycheck !== undefined
        ? input.netPaycheck == null
          ? null
          : Math.round(input.netPaycheck * 100)
        : paySchedule?.netPaycheckAmountCents ?? null,
    depositAccountId:
      input.depositAccountId !== undefined
        ? input.depositAccountId
        : paySchedule?.depositAccountId ?? null,
  };
}

function value(formData: FormData, field: string) { const raw = formData.get(field); return typeof raw === "string" ? raw : ""; }

function errors(error: z.ZodError): IncomeActionResult {
  const fieldErrors: IncomeFormErrors = {};
  for (const issue of error.issues) if (typeof issue.path[0] === "string" && !fieldErrors[issue.path[0] as keyof IncomeFormErrors]) fieldErrors[issue.path[0] as keyof IncomeFormErrors] = issue.message;
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}

export function validateIncomeForm(formData: FormData): { success: true; data: IncomeFields } | { success: false; result: IncomeActionResult } {
  const parsed = incomeFormSchema.safeParse({ annualGrossIncome: value(formData, "annualGrossIncome"), taxDeductionPercentage: value(formData, "taxDeductionPercentage"), scheduleEnabled: formData.get("scheduleEnabled") === "1", scheduleType: value(formData, "scheduleType"), firstNominalDay: value(formData, "firstNominalDay"), secondPaydayRule: value(formData, "secondPaydayRule"), weekendAdjustment: value(formData, "weekendAdjustment"), netPaycheckAmount: value(formData, "netPaycheckAmount"), depositAccountId: value(formData, "depositAccountId") });
  return parsed.success ? { success: true, data: parsed.data } : { success: false, result: errors(parsed.error) };
}

export async function getIncomeOverviewForUser(userId: number) {
  const [income, paySchedule, paymentAccounts] = await Promise.all([
    db.select().from(financeIncomeTable).where(eq(financeIncomeTable.userId, userId)).orderBy(desc(financeIncomeTable.createdAt)).limit(1).then((rows) => rows[0] ?? null),
    db.select().from(financePaySchedulesTable).where(eq(financePaySchedulesTable.userId, userId)).limit(1).then((rows) => rows[0] ?? null),
    db.select({ id: financePaymentAccountsTable.id, name: financePaymentAccountsTable.name }).from(financePaymentAccountsTable).where(eq(financePaymentAccountsTable.userId, userId)).orderBy(financePaymentAccountsTable.name),
  ]);
  return { income, paySchedule, paymentAccounts };
}

export async function saveIncomeOverviewForUser(userId: number, data: IncomeFields) {
  const [account] = data.depositAccountId == null ? [true] : await db.select({ id: financePaymentAccountsTable.id }).from(financePaymentAccountsTable).where(and(eq(financePaymentAccountsTable.userId, userId), eq(financePaymentAccountsTable.id, data.depositAccountId))).limit(1);
  if (!account) return { ok: false as const, error: "Select one of your payment accounts." };
  await db.transaction(async (tx) => {
    const [income] = await tx.select({ id: financeIncomeTable.id }).from(financeIncomeTable).where(eq(financeIncomeTable.userId, userId)).orderBy(desc(financeIncomeTable.createdAt)).limit(1);
    if (income) await tx.update(financeIncomeTable).set({ annualGrossIncome: data.annualGrossIncome, taxDeductionPercentage: data.taxDeductionPercentage, updatedAt: new Date() }).where(and(eq(financeIncomeTable.id, income.id), eq(financeIncomeTable.userId, userId)));
    else await tx.insert(financeIncomeTable).values({ userId, annualGrossIncome: data.annualGrossIncome, taxDeductionPercentage: data.taxDeductionPercentage });
    await tx.insert(financePaySchedulesTable).values({ userId, isEnabled: data.scheduleEnabled ? 1 : 0, scheduleType: data.scheduleType, firstNominalDay: data.firstNominalDay, secondPaydayRule: data.secondPaydayRule, weekendAdjustment: data.weekendAdjustment, netPaycheckAmountCents: data.netPaycheckAmount, depositAccountId: data.depositAccountId, updatedAt: new Date() }).onConflictDoUpdate({ target: financePaySchedulesTable.userId, set: { isEnabled: data.scheduleEnabled ? 1 : 0, scheduleType: data.scheduleType, firstNominalDay: data.firstNominalDay, secondPaydayRule: data.secondPaydayRule, weekendAdjustment: data.weekendAdjustment, netPaycheckAmountCents: data.netPaycheckAmount, depositAccountId: data.depositAccountId, updatedAt: new Date() } });
  });
  return { ok: true as const };
}
