import type { Expense } from "~/types/expense";
import {
  formatDateKey,
  getNextChargeDate,
  getNormalizedMonthlyCostCents,
  getNormalizedYearlyCostCents,
  parseDateKey,
} from "~/modules/finance/recurrence";
import {
  getExpectedPaycheckCents,
  getPayDatesAfter,
} from "~/modules/finance/paySchedule";

/**
 * Read-only projections of finance data shaped for the assistant. Amounts are
 * exposed in US dollars (the model reasons in dollars); the underlying domain
 * values stay in integer cents and are only converted at this boundary.
 */

export interface IncomeRecord {
  /** Stored in whole dollars, not cents. */
  annualGrossIncome: number;
  taxDeductionPercentage: number;
}

export interface PayScheduleRecord {
  isEnabled: number;
  scheduleType: string;
  firstNominalDay: number;
  secondPaydayRule: string;
  weekendAdjustment: string;
  netPaycheckAmountCents: number | null;
  depositAccountId: number | null;
}

export interface PaymentAccountRecord {
  id: number;
  name: string;
}

export interface ExpenseView {
  id: number;
  name: string;
  category: string;
  /** Amount charged per occurrence, in USD. */
  amountUsd: number;
  recurrence: string;
  monthlyEquivalentUsd: number;
  yearlyEquivalentUsd: number;
  necessity: string;
  costType: string;
  paymentMethod: string;
  accountName: string | null;
  isActive: boolean;
  nextChargeDate: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  monthlyUsd: number;
  yearlyUsd: number;
}

export interface ExpenseSummary {
  currency: "USD";
  activeExpenseCount: number;
  inactiveExpenseCount: number;
  monthlyRecurringUsd: number;
  yearlyRecurringUsd: number;
  byCategory: CategoryBreakdown[];
  byNecessity: { essentialMonthlyUsd: number; discretionaryMonthlyUsd: number };
  byCostType: { fixedMonthlyUsd: number; variableMonthlyUsd: number };
}

export interface ExpenseSummaryWithIncome extends ExpenseSummary {
  income: {
    configured: boolean;
    monthlyNetIncomeUsd: number | null;
    annualNetIncomeUsd: number | null;
    netRemainingMonthlyUsd: number | null;
    netRemainingYearlyUsd: number | null;
  };
}

export interface PayScheduleView {
  enabled: boolean;
  type: string;
  firstPaydayDayOfMonth: number;
  secondPaydayRule: string;
  weekendAdjustment: string;
  netPaycheckAmountUsd: number | null;
  estimatedNetPaycheckUsd: number;
  paycheckIsEstimate: boolean;
  depositAccountName: string | null;
  upcomingPaydays: string[];
}

export interface IncomeOverview {
  currency: "USD";
  configured: boolean;
  annualGrossIncomeUsd: number | null;
  taxDeductionPercentage: number | null;
  annualNetIncomeUsd: number | null;
  monthlyNetIncomeUsd: number | null;
  paySchedule: PayScheduleView | null;
}

function toUsd(cents: number): number {
  return Math.round(cents) / 100;
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

function netAnnualUsd(income: IncomeRecord | null): number | null {
  return income
    ? roundUsd(income.annualGrossIncome * (1 - income.taxDeductionPercentage / 100))
    : null;
}

export function toExpenseView(
  expense: Expense,
  accountName: string | null,
  asOfDate: string
): ExpenseView {
  return {
    id: expense.id,
    name: expense.name,
    category: expense.category,
    amountUsd: toUsd(expense.monthlyCost),
    recurrence: expense.recurrenceFrequency,
    monthlyEquivalentUsd: toUsd(getNormalizedMonthlyCostCents(expense)),
    yearlyEquivalentUsd: toUsd(getNormalizedYearlyCostCents(expense)),
    necessity: expense.necessity,
    costType: expense.costType,
    paymentMethod: expense.paymentMethod,
    accountName,
    isActive: expense.isActive !== 0,
    nextChargeDate: formatDateKey(
      getNextChargeDate(expense, parseDateKey(asOfDate))
    ),
  };
}

/** Totals cover active expenses only; inactive ones are counted but excluded. */
export function summarizeExpenses(expenses: readonly Expense[]): ExpenseSummary {
  let activeExpenseCount = 0;
  let inactiveExpenseCount = 0;
  let monthlyCents = 0;
  let yearlyCents = 0;
  let essentialMonthlyCents = 0;
  let discretionaryMonthlyCents = 0;
  let fixedMonthlyCents = 0;
  let variableMonthlyCents = 0;
  const categories = new Map<
    string,
    { count: number; monthlyCents: number; yearlyCents: number }
  >();

  for (const expense of expenses) {
    if (expense.isActive === 0) {
      inactiveExpenseCount += 1;
      continue;
    }

    activeExpenseCount += 1;
    const monthly = getNormalizedMonthlyCostCents(expense);
    const yearly = getNormalizedYearlyCostCents(expense);
    monthlyCents += monthly;
    yearlyCents += yearly;

    if (expense.necessity === "discretionary") discretionaryMonthlyCents += monthly;
    else essentialMonthlyCents += monthly;

    if (expense.costType === "variable") variableMonthlyCents += monthly;
    else fixedMonthlyCents += monthly;

    const bucket = categories.get(expense.category) ?? {
      count: 0,
      monthlyCents: 0,
      yearlyCents: 0,
    };
    bucket.count += 1;
    bucket.monthlyCents += monthly;
    bucket.yearlyCents += yearly;
    categories.set(expense.category, bucket);
  }

  return {
    currency: "USD",
    activeExpenseCount,
    inactiveExpenseCount,
    monthlyRecurringUsd: toUsd(monthlyCents),
    yearlyRecurringUsd: toUsd(yearlyCents),
    byCategory: [...categories.entries()]
      .map(([category, bucket]) => ({
        category,
        count: bucket.count,
        monthlyUsd: toUsd(bucket.monthlyCents),
        yearlyUsd: toUsd(bucket.yearlyCents),
      }))
      .sort((a, b) => b.monthlyUsd - a.monthlyUsd),
    byNecessity: {
      essentialMonthlyUsd: toUsd(essentialMonthlyCents),
      discretionaryMonthlyUsd: toUsd(discretionaryMonthlyCents),
    },
    byCostType: {
      fixedMonthlyUsd: toUsd(fixedMonthlyCents),
      variableMonthlyUsd: toUsd(variableMonthlyCents),
    },
  };
}

export function buildExpenseSummary(
  expenses: readonly Expense[],
  income: IncomeRecord | null
): ExpenseSummaryWithIncome {
  const summary = summarizeExpenses(expenses);
  const annualNetIncomeUsd = netAnnualUsd(income);
  const monthlyNetIncomeUsd =
    annualNetIncomeUsd != null ? roundUsd(annualNetIncomeUsd / 12) : null;

  return {
    ...summary,
    income: {
      configured: income != null,
      annualNetIncomeUsd,
      monthlyNetIncomeUsd,
      netRemainingMonthlyUsd:
        monthlyNetIncomeUsd != null
          ? roundUsd(monthlyNetIncomeUsd - summary.monthlyRecurringUsd)
          : null,
      netRemainingYearlyUsd:
        annualNetIncomeUsd != null
          ? roundUsd(annualNetIncomeUsd - summary.yearlyRecurringUsd)
          : null,
    },
  };
}

export function buildIncomeOverview(
  input: {
    income: IncomeRecord | null;
    paySchedule: PayScheduleRecord | null;
    paymentAccounts: readonly PaymentAccountRecord[];
  },
  asOfDate: string
): IncomeOverview {
  const { income, paySchedule, paymentAccounts } = input;
  const annualGrossIncomeUsd = income?.annualGrossIncome ?? null;
  const taxDeductionPercentage = income?.taxDeductionPercentage ?? null;
  const annualNetIncomeUsd = netAnnualUsd(income);
  const monthlyNetIncomeUsd =
    annualNetIncomeUsd != null ? roundUsd(annualNetIncomeUsd / 12) : null;

  let payScheduleView: PayScheduleView | null = null;
  if (paySchedule) {
    const enabled = paySchedule.isEnabled !== 0;
    const paycheck = getExpectedPaycheckCents(
      paySchedule,
      income?.annualGrossIncome,
      income?.taxDeductionPercentage
    );
    payScheduleView = {
      enabled,
      type: paySchedule.scheduleType,
      firstPaydayDayOfMonth: paySchedule.firstNominalDay,
      secondPaydayRule: paySchedule.secondPaydayRule,
      weekendAdjustment: paySchedule.weekendAdjustment,
      netPaycheckAmountUsd:
        paySchedule.netPaycheckAmountCents != null
          ? toUsd(paySchedule.netPaycheckAmountCents)
          : null,
      estimatedNetPaycheckUsd: toUsd(paycheck.amountCents),
      paycheckIsEstimate: paycheck.isEstimate,
      depositAccountName:
        paySchedule.depositAccountId != null
          ? paymentAccounts.find(
              (account) => account.id === paySchedule.depositAccountId
            )?.name ?? null
          : null,
      upcomingPaydays: enabled
        ? getPayDatesAfter(paySchedule, parseDateKey(asOfDate), 4).map(
            formatDateKey
          )
        : [],
    };
  }

  return {
    currency: "USD",
    configured: income != null,
    annualGrossIncomeUsd,
    taxDeductionPercentage,
    annualNetIncomeUsd,
    monthlyNetIncomeUsd,
    paySchedule: payScheduleView,
  };
}
