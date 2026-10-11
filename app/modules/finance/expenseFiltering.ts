import type { Expense } from "~/types/expense";
import {
  getNextChargeDate,
  getNormalizedMonthlyCostCents,
  parseDateKey,
} from "~/modules/finance/recurrence";

export type ExpenseStatusFilter = "all" | "active" | "paused";
export type ExpenseSort = "nextCharge" | "name" | "monthlyCost";

export interface ExpenseListFilters {
  categories: string[];
  searchQuery: string;
  status: ExpenseStatusFilter;
  sort: ExpenseSort;
  asOfDate: string;
}

/**
 * Applies the Expenses list controls (category, text, status, sort) without
 * changing account-wide summaries. Pure so routes, the assistant, and the
 * client hook all share one behavior.
 */
export function filterAndSortExpenses(
  expenses: Expense[],
  filters: ExpenseListFilters
): Expense[] {
  const query = filters.searchQuery.trim().toLocaleLowerCase();

  return expenses
    .filter((expense) => {
      const matchesCategory =
        !filters.categories.length ||
        filters.categories.includes(expense.category);
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && expense.isActive !== 0) ||
        (filters.status === "paused" && expense.isActive === 0);
      const matchesSearch =
        !query ||
        expense.name.toLocaleLowerCase().includes(query) ||
        expense.category.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "name":
          return a.name.localeCompare(b.name) || a.chargeDay - b.chargeDay;
        case "monthlyCost":
          return (
            getNormalizedMonthlyCostCents(b) -
              getNormalizedMonthlyCostCents(a) ||
            a.name.localeCompare(b.name)
          );
        case "nextCharge":
        default:
          return (
            getNextChargeDate(a, parseDateKey(filters.asOfDate)).getTime() -
              getNextChargeDate(b, parseDateKey(filters.asOfDate)).getTime() ||
            a.name.localeCompare(b.name)
          );
      }
    });
}
