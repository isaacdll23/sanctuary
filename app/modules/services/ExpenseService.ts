import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { financeExpensesTable, financeIncomeTable } from "~/db/schema";
import type { ExpenseActionResult, ExpenseFormErrors } from "~/types/expense";

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to two decimal places.")
  .transform((value) => Math.round(Number(value) * 100))
  .refine((value) => value > 0, "Monthly cost must be greater than zero.");

const idSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Invalid expense.")
  .transform(Number)
  .pipe(z.number().int().positive("Invalid expense."));

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
  isActive: z.boolean(),
});

const addExpenseSchema = expenseFieldsSchema;
const updateExpenseSchema = expenseFieldsSchema.extend({ id: idSchema });
const deleteExpenseSchema = z.object({ id: idSchema });

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

  return parsed.success
    ? { success: true, data: parsed.data }
    : { success: false, result: formErrors(parsed.error) };
}

export function validateExpenseDelete(formData: FormData):
  | { success: true; id: number }
  | { success: false; result: ExpenseActionResult } {
  const parsed = deleteExpenseSchema.safeParse({ id: formValue(formData, "id") });
  return parsed.success
    ? { success: true, id: parsed.data.id }
    : { success: false, result: formErrors(parsed.error) };
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

export async function createExpenseForUser(userId: number, values: ExpenseFields) {
  await db.insert(financeExpensesTable).values({ userId, ...values, isActive: values.isActive ? 1 : 0 });
}

export async function updateExpenseForUser(userId: number, id: number, values: ExpenseFields) {
  return db
    .update(financeExpensesTable)
    .set({ ...values, isActive: values.isActive ? 1 : 0, updatedAt: new Date() })
    .where(and(eq(financeExpensesTable.id, id), eq(financeExpensesTable.userId, userId)))
    .returning({ id: financeExpensesTable.id });
}

export async function deleteExpenseForUser(userId: number, id: number) {
  return db
    .delete(financeExpensesTable)
    .where(and(eq(financeExpensesTable.id, id), eq(financeExpensesTable.userId, userId)))
    .returning({ id: financeExpensesTable.id });
}
