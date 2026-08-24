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

function value(formData: FormData, field: string) { const raw = formData.get(field); return typeof raw === "string" ? raw : ""; }

function errors(error: z.ZodError): IncomeActionResult {
  const fieldErrors: IncomeFormErrors = {};
  for (const issue of error.issues) if (typeof issue.path[0] === "string" && !fieldErrors[issue.path[0] as keyof IncomeFormErrors]) fieldErrors[issue.path[0] as keyof IncomeFormErrors] = issue.message;
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}

export function validateIncomeForm(formData: FormData): { success: true; data: z.infer<typeof incomeFormSchema> } | { success: false; result: IncomeActionResult } {
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

export async function getPrimaryPayScheduleForUser(userId: number) {
  const [schedule] = await db.select().from(financePaySchedulesTable).where(eq(financePaySchedulesTable.userId, userId)).limit(1);
  return schedule ?? null;
}

export async function saveIncomeOverviewForUser(userId: number, data: z.infer<typeof incomeFormSchema>) {
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
