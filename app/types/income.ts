export type IncomeFormErrors = Partial<Record<"annualGrossIncome" | "taxDeductionPercentage" | "scheduleType" | "firstNominalDay" | "secondPaydayRule" | "weekendAdjustment" | "netPaycheckAmount" | "depositAccountId", string>>;

export type IncomeActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: IncomeFormErrors };
