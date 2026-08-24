export interface Expense {
  id: number;
  userId: number;
  name: string;
  monthlyCost: number;
  chargeDay: number;
  category: string;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseFormErrors = Partial<
  Record<"id" | "name" | "monthlyCost" | "chargeDay" | "category", string>
>;

export type ExpenseActionResult =
  | { ok: true; action: "add" | "update" | "delete"; message: string }
  | { ok: false; error: string; fieldErrors?: ExpenseFormErrors };
