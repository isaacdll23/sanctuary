import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAndSortExpenses } from "./useExpenseFiltering";
import type { Expense } from "~/types/expense";

const expenses: Expense[] = [
  { id: 1, userId: 1, name: "Netflix", monthlyCost: 1599, chargeDay: 10, category: "Entertainment", accountId: null, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-10", lastDayOfMonth: 0, necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, userId: 1, name: "Rent", monthlyCost: 150000, chargeDay: 1, category: "Housing", accountId: null, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-01", lastDayOfMonth: 0, necessity: "essential", costType: "fixed", paymentMethod: "manual", isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, userId: 1, name: "Gym", monthlyCost: 5000, chargeDay: 20, category: "Health", accountId: null, recurrenceFrequency: "monthly", recurrenceAnchor: "2000-01-20", lastDayOfMonth: 0, necessity: "discretionary", costType: "fixed", paymentMethod: "autopay", isActive: 0, createdAt: new Date(), updatedAt: new Date() },
];

describe("expense list filtering", () => {
  it("combines category, text, and status filters", () => {
    const result = filterAndSortExpenses(expenses, { categories: ["Entertainment"], searchQuery: "net", status: "active", sort: "nextCharge", asOfDate: "2026-08-24" });
    assert.deepEqual(result.map((expense) => expense.id), [1]);
  });

  it("sorts by charge day, name, and monthly cost", () => {
    const filters = { categories: [], searchQuery: "", status: "all" as const, asOfDate: "2026-08-24" };
    assert.deepEqual(filterAndSortExpenses(expenses, { ...filters, sort: "nextCharge" }).map((expense) => expense.id), [2, 1, 3]);
    assert.deepEqual(filterAndSortExpenses(expenses, { ...filters, sort: "name" }).map((expense) => expense.id), [3, 1, 2]);
    assert.deepEqual(filterAndSortExpenses(expenses, { ...filters, sort: "monthlyCost" }).map((expense) => expense.id), [2, 3, 1]);
  });

  it("sorts cost by normalized monthly equivalent instead of raw charge amount", () => {
    const annual = { ...expenses[0], id: 4, name: "Annual", monthlyCost: 120_000, recurrenceFrequency: "yearly", recurrenceAnchor: "2026-01-01" };
    const weekly = { ...expenses[0], id: 5, name: "Weekly", monthlyCost: 3_000, recurrenceFrequency: "weekly", recurrenceAnchor: "2026-01-01" };
    const result = filterAndSortExpenses([annual, weekly], {
      categories: [],
      searchQuery: "",
      status: "all",
      sort: "monthlyCost",
      asOfDate: "2026-08-24",
    });
    assert.deepEqual(result.map((expense) => expense.id), [5, 4]);
  });
});
