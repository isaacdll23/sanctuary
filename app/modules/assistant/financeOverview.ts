import type {
  AccountBalanceSnapshot,
  Expense,
  ExpenseCharge,
} from "~/types/expense";
import {
  formatDateKey,
  getNextChargeDate,
  getNormalizedMonthlyCostCents,
  getNormalizedYearlyCostCents,
  parseDateKey,
} from "~/modules/finance/recurrence";
import {
  describeBalanceAge,
  getDaysSince,
  getLatestBalanceByAccount,
  summarizeBalances,
} from "~/modules/finance/balances";
import {
  buildPaidChargeKeys,
  getBillsBeforePayday,
  getExpectedPaycheckCents,
  getMostRecentPayDate,
  getNextPaydayAfter,
  getPayDatesAfter,
  getScheduledBillsInPayPeriod,
  type PrimaryPaySchedule,
  type ScheduledBill,
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

// --- Cash and cash-flow reads -------------------------------------------------

export interface PaymentAccountView {
  id: number;
  name: string;
  currentBalanceUsd: number | null;
  balanceAsOfDate: string | null;
  balanceCheckedDaysAgo: number | null;
  /** e.g. "checked 3 days ago"; null when no snapshot exists. */
  balanceAgeLabel: string | null;
}

export interface PaymentAccountsView {
  currency: "USD";
  accountCount: number;
  totalBalanceUsd: number;
  accounts: PaymentAccountView[];
}

/** Accounts with their latest manual balance check-in and staleness. */
export function buildPaymentAccountsView(
  accounts: readonly PaymentAccountRecord[],
  snapshots: readonly AccountBalanceSnapshot[],
  asOfDate: string
): PaymentAccountsView {
  const latestByAccount = getLatestBalanceByAccount([...snapshots]);

  const accountViews = accounts.map((account) => {
    const snapshot = latestByAccount.get(account.id);
    const days = snapshot
      ? getDaysSince(snapshot.balanceDate, asOfDate)
      : null;
    return {
      id: account.id,
      name: account.name,
      currentBalanceUsd: snapshot ? toUsd(snapshot.balanceCents) : null,
      balanceAsOfDate: snapshot?.balanceDate ?? null,
      balanceCheckedDaysAgo: days,
      balanceAgeLabel: days == null ? null : describeBalanceAge(days),
    };
  });

  return {
    currency: "USD",
    accountCount: accounts.length,
    totalBalanceUsd: roundUsd(
      accountViews.reduce(
        (sum, account) => sum + (account.currentBalanceUsd ?? 0),
        0
      )
    ),
    accounts: accountViews,
  };
}

export interface BalanceSummaryToolView {
  currency: "USD";
  accountsWithBalances: number;
  totalBalanceUsd: number;
  oldestBalanceDate: string | null;
  daysSinceLastCheck: number | null;
  payScheduleEnabled: boolean;
  nextPayday: string | null;
  billsThroughDate: string | null;
  /** Scheduled (unpaid) bills through the next payday; null without a schedule. */
  committedBillsUsd: number | null;
  remainingAfterBillsUsd: number | null;
  paydaySinceLastCheck: boolean;
}

/**
 * Committed-vs-available cash picture, mirroring the Expenses `BalanceSummary`:
 * total current balance minus scheduled bills through the next payday.
 */
export function buildBalanceSummary(
  expenses: readonly Expense[],
  chargeRecords: readonly ExpenseCharge[],
  snapshots: readonly AccountBalanceSnapshot[],
  schedule: PrimaryPaySchedule | null,
  asOfDate: string
): BalanceSummaryToolView {
  const balance = summarizeBalances([...snapshots]);
  const asOf = parseDateKey(asOfDate);
  const paidKeys = buildPaidChargeKeys(chargeRecords);
  const hasSchedule = Boolean(schedule && schedule.isEnabled !== 0);

  const nextPayday =
    hasSchedule && schedule ? getNextPaydayAfter(schedule, asOf) : null;
  const committedCents = nextPayday
    ? getBillsBeforePayday([...expenses], asOf, nextPayday, paidKeys).reduce(
        (sum, bill) => sum + bill.amountCents,
        0
      )
    : null;

  const lastPayDate =
    hasSchedule && schedule ? getMostRecentPayDate(schedule, asOf) : null;
  const lastPayDateKey = lastPayDate ? formatDateKey(lastPayDate) : null;

  return {
    currency: "USD",
    accountsWithBalances: balance.latestByAccount.size,
    totalBalanceUsd: toUsd(balance.totalBalanceCents),
    oldestBalanceDate: balance.oldestBalanceDate,
    daysSinceLastCheck: balance.oldestBalanceDate
      ? getDaysSince(balance.oldestBalanceDate, asOfDate)
      : null,
    payScheduleEnabled: hasSchedule,
    nextPayday: nextPayday ? formatDateKey(nextPayday) : null,
    billsThroughDate: nextPayday
      ? formatDateKey(new Date(nextPayday.getTime() - 86_400_000))
      : null,
    committedBillsUsd: committedCents == null ? null : toUsd(committedCents),
    remainingAfterBillsUsd:
      committedCents == null
        ? null
        : toUsd(balance.totalBalanceCents - committedCents),
    paydaySinceLastCheck: Boolean(
      balance.oldestBalanceDate &&
        lastPayDateKey &&
        lastPayDateKey > balance.oldestBalanceDate
    ),
  };
}

export interface CashFlowBillView {
  expenseId: number;
  name: string;
  chargeDate: string;
  amountUsd: number;
  paid: boolean;
}

export interface CashFlowPeriodView {
  payday: string;
  periodEnd: string;
  expectedPaycheckUsd: number;
  paycheckIsEstimate: boolean;
  bills: CashFlowBillView[];
  scheduledBillsUsd: number;
  paidBillsUsd: number;
  unpaidBillsUsd: number;
  /** Expected paycheck minus unpaid bills. */
  remainingUsd: number;
}

export interface UpcomingCashFlowView {
  currency: "USD";
  payScheduleEnabled: boolean;
  nextPayday: string | null;
  billsBeforeNextPayday: CashFlowBillView[];
  billsBeforeNextPaydayUsd: number;
  periods: CashFlowPeriodView[];
}

/** Bill occurrences grouped into pay periods, mirroring `PaycheckCashFlow`. */
export function buildUpcomingCashFlow(
  schedule: PrimaryPaySchedule,
  expected: { amountCents: number; isEstimate: boolean },
  expenses: readonly Expense[],
  chargeRecords: readonly ExpenseCharge[],
  asOfDate: string,
  periodCount: number
): UpcomingCashFlowView {
  const asOf = parseDateKey(asOfDate);
  const paidKeys = buildPaidChargeKeys(chargeRecords);
  const payDates = getPayDatesAfter(schedule, asOf, periodCount + 1);

  const toBill = (bill: ScheduledBill): CashFlowBillView => ({
    expenseId: bill.expenseId,
    name: bill.name,
    chargeDate: bill.chargeDate,
    amountUsd: toUsd(bill.amountCents),
    paid: paidKeys.has(`${bill.expenseId}:${bill.chargeDate}`),
  });

  if (payDates.length === 0) {
    return {
      currency: "USD",
      payScheduleEnabled: true,
      nextPayday: null,
      billsBeforeNextPayday: [],
      billsBeforeNextPaydayUsd: 0,
      periods: [],
    };
  }

  const before = getBillsBeforePayday(
    [...expenses],
    asOf,
    payDates[0],
    paidKeys
  ).map(toBill);

  const periods: CashFlowPeriodView[] = [];
  for (let index = 0; index < periodCount && index + 1 < payDates.length; index++) {
    const payDate = payDates[index];
    const nextPayDate = payDates[index + 1];
    const bills = getScheduledBillsInPayPeriod(
      [...expenses],
      payDate,
      nextPayDate
    ).map(toBill);
    const scheduledUsd = bills.reduce((sum, bill) => sum + bill.amountUsd, 0);
    const paidUsd = bills
      .filter((bill) => bill.paid)
      .reduce((sum, bill) => sum + bill.amountUsd, 0);
    const unpaidUsd = scheduledUsd - paidUsd;

    periods.push({
      payday: formatDateKey(payDate),
      periodEnd: formatDateKey(new Date(nextPayDate.getTime() - 86_400_000)),
      expectedPaycheckUsd: toUsd(expected.amountCents),
      paycheckIsEstimate: expected.isEstimate,
      bills,
      scheduledBillsUsd: roundUsd(scheduledUsd),
      paidBillsUsd: roundUsd(paidUsd),
      unpaidBillsUsd: roundUsd(unpaidUsd),
      remainingUsd: roundUsd(toUsd(expected.amountCents) - unpaidUsd),
    });
  }

  return {
    currency: "USD",
    payScheduleEnabled: true,
    nextPayday: formatDateKey(payDates[0]),
    billsBeforeNextPayday: before,
    billsBeforeNextPaydayUsd: roundUsd(
      before.reduce((sum, bill) => sum + bill.amountUsd, 0)
    ),
    periods,
  };
}
