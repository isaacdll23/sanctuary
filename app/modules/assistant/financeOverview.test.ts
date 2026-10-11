import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Expense } from "~/types/expense";
import {
  buildExpenseSummary,
  buildIncomeOverview,
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
