import { useMemo } from "react";
import type { Expense } from "~/types/expense";
import { getNormalizedMonthlyCostCents, getNormalizedYearlyCostCents } from "~/modules/finance/recurrence";
import {
  filterAndSortExpenses,
  type ExpenseListFilters,
  type ExpenseSort,
  type ExpenseStatusFilter,
} from "~/modules/finance/expenseFiltering";

export { filterAndSortExpenses };
export type { ExpenseListFilters, ExpenseSort, ExpenseStatusFilter };

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
