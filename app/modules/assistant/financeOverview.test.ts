import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AccountBalanceSnapshot, Expense, ExpenseCharge } from "~/types/expense";
import {
  buildBalanceSummary,
  buildExpenseSummary,
  buildIncomeOverview,
  buildPaymentAccountsView,
  buildUpcomingCashFlow,
  summarizeExpenses,
  toExpenseView,
} from "./financeOverview";

function expense(overrides: Partial<Expense> & Pick<Expense, "id" | "name">): Expense {
  return {
    userId: 1,
    monthlyCost: 0,
    chargeDay: 1,
    category: "Misc",
    accountId: null,
    recurrenceFrequency: "monthly",
    recurrenceAnchor: "2000-01-01",
    lastDayOfMonth: 0,
    necessity: "essential",
    costType: "fixed",
    paymentMethod: "autopay",
    isActive: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const rent = expense({
  id: 1,
  name: "Rent",
  monthlyCost: 150_000,
  chargeDay: 1,
  category: "Housing",
});
const gym = expense({
  id: 2,
  name: "Gym",
  monthlyCost: 5_000,
  chargeDay: 20,
  category: "Health",
  necessity: "discretionary",
});
const insurance = expense({
  id: 3,
  name: "Insurance",
  monthlyCost: 120_000,
  category: "Insurance",
  recurrenceFrequency: "yearly",
  recurrenceAnchor: "2026-01-01",
  costType: "variable",
});
const paused = expense({
  id: 4,
  name: "Paused subscription",
  monthlyCost: 1_000,
  isActive: 0,
});

describe("summarizeExpenses", () => {
  it("normalizes cadences and excludes paused expenses from totals", () => {
    const summary = summarizeExpenses([rent, gym, insurance, paused]);

    assert.equal(summary.activeExpenseCount, 3);
    assert.equal(summary.inactiveExpenseCount, 1);
    assert.equal(summary.monthlyRecurringUsd, 1_650);
    assert.equal(summary.yearlyRecurringUsd, 19_800);
    assert.deepEqual(summary.byNecessity, {
      essentialMonthlyUsd: 1_600,
      discretionaryMonthlyUsd: 50,
    });
    assert.deepEqual(summary.byCostType, {
      fixedMonthlyUsd: 1_550,
      variableMonthlyUsd: 100,
    });
    assert.deepEqual(
      summary.byCategory.map((entry) => [entry.category, entry.monthlyUsd]),
      [
        ["Housing", 1_500],
        ["Insurance", 100],
        ["Health", 50],
      ]
    );
  });
});

describe("toExpenseView", () => {
  it("converts cents to dollars and derives the next charge date", () => {
    const view = toExpenseView(rent, "Checking", "2026-10-11");

    assert.equal(view.amountUsd, 1_500);
    assert.equal(view.monthlyEquivalentUsd, 1_500);
    assert.equal(view.yearlyEquivalentUsd, 18_000);
    assert.equal(view.nextChargeDate, "2026-11-01");
    assert.equal(view.accountName, "Checking");
    assert.equal(view.isActive, true);
  });
});

describe("buildIncomeOverview", () => {
  it("derives net income, paycheck estimate, and upcoming paydays", () => {
    const overview = buildIncomeOverview(
      {
        income: { annualGrossIncome: 120_000, taxDeductionPercentage: 25 },
        paySchedule: {
          isEnabled: 1,
          scheduleType: "semi-monthly",
          firstNominalDay: 15,
          secondPaydayRule: "last-day",
          weekendAdjustment: "previous-friday",
          netPaycheckAmountCents: null,
          depositAccountId: 7,
        },
        paymentAccounts: [{ id: 7, name: "Checking" }],
      },
      "2026-10-11"
    );

    assert.equal(overview.configured, true);
    assert.equal(overview.annualNetIncomeUsd, 90_000);
    assert.equal(overview.monthlyNetIncomeUsd, 7_500);
    assert.equal(overview.paySchedule?.depositAccountName, "Checking");
    assert.equal(overview.paySchedule?.estimatedNetPaycheckUsd, 3_750);
    assert.equal(overview.paySchedule?.paycheckIsEstimate, true);
    assert.deepEqual(overview.paySchedule?.upcomingPaydays.slice(0, 2), [
      "2026-10-15",
      "2026-10-30",
    ]);
  });

  it("reports unconfigured income without inventing values", () => {
    const overview = buildIncomeOverview(
      { income: null, paySchedule: null, paymentAccounts: [] },
      "2026-10-11"
    );

    assert.equal(overview.configured, false);
    assert.equal(overview.annualGrossIncomeUsd, null);
    assert.equal(overview.paySchedule, null);
  });
});

describe("buildExpenseSummary", () => {
  it("subtracts recurring costs from net income", () => {
    const summary = buildExpenseSummary(
      [rent],
      { annualGrossIncome: 120_000, taxDeductionPercentage: 25 }
    );

    assert.equal(summary.monthlyRecurringUsd, 1_500);
    assert.equal(summary.yearlyRecurringUsd, 18_000);
    assert.equal(summary.income.netRemainingMonthlyUsd, 6_000);
    assert.equal(summary.income.netRemainingYearlyUsd, 72_000);
  });
});

function snapshot(overrides: Partial<AccountBalanceSnapshot>): AccountBalanceSnapshot {
  return {
    id: 1,
    userId: 1,
    accountId: 7,
    balanceDate: "2026-10-01",
    balanceCents: 125_050,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    updatedAt: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

function charge(overrides: Partial<ExpenseCharge>): ExpenseCharge {
  return {
    id: 1,
    userId: 1,
    expenseId: 1,
    chargeDate: "2026-10-14",
    amountCents: 5_000,
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
    ...overrides,
  };
}

// Mirrors the semi-monthly schedule used on the Income page.
const schedule = {
  isEnabled: 1,
  scheduleType: "semi-monthly",
  firstNominalDay: 15,
  secondPaydayRule: "last-day",
  weekendAdjustment: "previous-friday",
  netPaycheckAmountCents: null,
  depositAccountId: null,
};

const phone = expense({
  id: 9,
  name: "Phone",
  monthlyCost: 5_000,
  chargeDay: 14,
  category: "Utilities",
});

const water = expense({
  id: 10,
  name: "Water",
  monthlyCost: 3_000,
  chargeDay: 5,
  category: "Utilities",
});

describe("buildPaymentAccountsView", () => {
  it("uses the newest snapshot per account and reports staleness", () => {
    const view = buildPaymentAccountsView(
      [
        { id: 7, name: "Checking" },
        { id: 8, name: "Credit" },
      ],
      [
        snapshot({ id: 1, accountId: 7, balanceDate: "2026-10-01", balanceCents: 125_050 }),
        snapshot({ id: 2, accountId: 7, balanceDate: "2026-09-01", balanceCents: 100_000 }),
        snapshot({ id: 3, accountId: 8, balanceDate: "2026-09-20", balanceCents: -4_210 }),
      ],
      "2026-10-11"
    );

    assert.equal(view.accountCount, 2);
    assert.equal(view.totalBalanceUsd, 1_208.4);
    assert.deepEqual(
      view.accounts.map((account) => [account.name, account.currentBalanceUsd]),
      [
        ["Checking", 1_250.5],
        ["Credit", -42.1],
      ]
    );
    assert.equal(view.accounts[0].balanceCheckedDaysAgo, 10);
    assert.equal(view.accounts[0].balanceAgeLabel, "checked 10 days ago");
  });

  it("reports null balances when an account has no check-in", () => {
    const view = buildPaymentAccountsView(
      [{ id: 7, name: "Checking" }],
      [],
      "2026-10-11"
    );

    assert.equal(view.accounts[0].currentBalanceUsd, null);
    assert.equal(view.totalBalanceUsd, 0);
  });
});

describe("buildBalanceSummary", () => {
  it("subtracts unpaid bills through the next payday from total balance", () => {
    const view = buildBalanceSummary(
      [rent, phone],
      [],
      [snapshot({ accountId: 7, balanceDate: "2026-10-01", balanceCents: 125_050 })],
      schedule,
      "2026-10-11"
    );

    assert.equal(view.totalBalanceUsd, 1_250.5);
    assert.equal(view.nextPayday, "2026-10-15");
    assert.equal(view.billsThroughDate, "2026-10-14");
    assert.equal(view.committedBillsUsd, 50);
    assert.equal(view.remainingAfterBillsUsd, 1_200.5);
    assert.equal(view.daysSinceLastCheck, 10);
    assert.equal(view.paydaySinceLastCheck, false);
  });

  it("skips bills already marked paid and flags a payday missed since the last check-in", () => {
    const view = buildBalanceSummary(
      [rent, phone],
      [charge({ expenseId: 9, chargeDate: "2026-10-14", amountCents: 5_000 })],
      [snapshot({ accountId: 7, balanceDate: "2026-09-01", balanceCents: 125_050 })],
      schedule,
      "2026-10-11"
    );

    assert.equal(view.committedBillsUsd, 0);
    assert.equal(view.remainingAfterBillsUsd, 1_250.5);
    assert.equal(view.paydaySinceLastCheck, true);
  });

  it("omits committed figures without a pay schedule", () => {
    const view = buildBalanceSummary(
      [rent, phone],
      [],
      [snapshot({ accountId: 7 })],
      null,
      "2026-10-11"
    );

    assert.equal(view.payScheduleEnabled, false);
    assert.equal(view.nextPayday, null);
    assert.equal(view.committedBillsUsd, null);
    assert.equal(view.remainingAfterBillsUsd, null);
  });
});

describe("buildUpcomingCashFlow", () => {
  it("groups bills into pay periods with paid status and remaining paycheck", () => {
    const view = buildUpcomingCashFlow(
      schedule,
      { amountCents: 375_000, isEstimate: true },
      [rent, phone, water],
      [charge({ expenseId: 10, chargeDate: "2026-11-05", amountCents: 3_000 })],
      "2026-10-11",
      2
    );

    assert.equal(view.payScheduleEnabled, true);
    assert.equal(view.nextPayday, "2026-10-15");
    assert.equal(view.billsBeforeNextPaydayUsd, 50);
    assert.deepEqual(view.periods.map((period) => period.payday), [
      "2026-10-15",
      "2026-10-30",
    ]);

    const second = view.periods[1];
    assert.equal(second.periodEnd, "2026-11-12");
    assert.deepEqual(second.bills.map((bill) => [bill.name, bill.paid]), [
      ["Rent", false],
      ["Water", true],
    ]);
    assert.equal(second.scheduledBillsUsd, 1_530);
    assert.equal(second.paidBillsUsd, 30);
    assert.equal(second.unpaidBillsUsd, 1_500);
    assert.equal(second.remainingUsd, 2_250);
  });
});
