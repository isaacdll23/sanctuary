import { useMemo } from "react";
import type { Expense } from "~/types/expense";
import { getNextChargeDate, getNormalizedMonthlyCostCents, getNormalizedYearlyCostCents, parseDateKey } from "~/modules/finance/recurrence";

export type ExpenseStatusFilter = "all" | "active" | "paused";
export type ExpenseSort = "nextCharge" | "name" | "monthlyCost";

export interface ExpenseListFilters {
  categories: string[];
  searchQuery: string;
  status: ExpenseStatusFilter;
  sort: ExpenseSort;
  asOfDate: string;
}

/** Applies client-side list controls without changing the account-wide summaries. */
export function filterAndSortExpenses(expenses: Expense[], filters: ExpenseListFilters): Expense[] {
  const query = filters.searchQuery.trim().toLocaleLowerCase();

  return expenses
    .filter((expense) => {
      const matchesCategory = !filters.categories.length || filters.categories.includes(expense.category);
      const matchesStatus = filters.status === "all"
        || (filters.status === "active" && expense.isActive !== 0)
        || (filters.status === "paused" && expense.isActive === 0);
      const matchesSearch = !query
        || expense.name.toLocaleLowerCase().includes(query)
        || expense.category.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "name":
          return a.name.localeCompare(b.name) || a.chargeDay - b.chargeDay;
        case "monthlyCost":
          return getNormalizedMonthlyCostCents(b) - getNormalizedMonthlyCostCents(a) || a.name.localeCompare(b.name);
        case "nextCharge":
        default:
          return getNextChargeDate(a, parseDateKey(filters.asOfDate)).getTime()
            - getNextChargeDate(b, parseDateKey(filters.asOfDate)).getTime()
            || a.name.localeCompare(b.name);
      }
    });
}

interface UseExpenseFilteringReturn {
  distinctCategories: string[];
  filteredExpenses: Expense[];
  activeFilteredExpenses: Expense[];
  filteredMonthlyCost: number;
  filteredYearlyCost: number;
  filteredActiveCount: number;
  totalMonthlyCost: number;
  totalYearlyCost: number;
  filterCategories: string[];
  setFilterCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
}

export function useExpenseFiltering(
  expenses: Expense[],
  filterCategories: string[],
  setFilterCategories: (categories: string[]) => void,
  searchQuery: string,
  status: ExpenseStatusFilter,
  sort: ExpenseSort,
  asOfDate: string
): UseExpenseFilteringReturn {
  const distinctCategories = useMemo(
    () =>
      Array.from(
        new Set(expenses.map((expense) => expense.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [expenses]
  );

  const sortedExpenses = useMemo(
    () => filterAndSortExpenses(expenses, { categories: filterCategories, searchQuery, status, sort, asOfDate }),
    [expenses, filterCategories, searchQuery, status, sort, asOfDate]
  );

  const activeFilteredExpenses = useMemo(
    () => sortedExpenses.filter((expense) => expense.isActive !== 0),
    [sortedExpenses]
  );

  const filteredMonthlyCost = useMemo(
    () =>
      activeFilteredExpenses.reduce(
        (acc: number, expense: Expense) => acc + getNormalizedMonthlyCostCents(expense),
        0
      ),
    [activeFilteredExpenses]
  );

  const filteredActiveCount = activeFilteredExpenses.length;
  const filteredYearlyCost = useMemo(
    () => activeFilteredExpenses.reduce((total, expense) => total + getNormalizedYearlyCostCents(expense), 0),
    [activeFilteredExpenses]
  );

  const totalMonthlyCost = useMemo(
    () => expenses.reduce((total, expense) => expense.isActive !== 0 ? total + getNormalizedMonthlyCostCents(expense) : total, 0),
    [expenses]
  );

  const totalYearlyCost = useMemo(
    () => expenses.reduce((total, expense) => expense.isActive !== 0 ? total + getNormalizedYearlyCostCents(expense) : total, 0),
    [expenses]
  );

  const toggleCategory = (category: string) => {
    setFilterCategories(
      filterCategories.includes(category)
        ? filterCategories.filter((c) => c !== category)
        : [...filterCategories, category]
    );
  };

  return {
    distinctCategories,
    filteredExpenses: sortedExpenses,
    activeFilteredExpenses,
    filteredMonthlyCost,
    filteredYearlyCost,
    filteredActiveCount,
    totalMonthlyCost,
    totalYearlyCost,
    filterCategories,
    setFilterCategories,
    toggleCategory,
  };
}
