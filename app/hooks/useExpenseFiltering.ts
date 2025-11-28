import { useMemo } from "react";

interface Expense {
  id: number;
  name: string;
  monthlyCost: number;
  chargeDay: number;
  category: string;
}

interface UseExpenseFilteringReturn {
  distinctCategories: string[];
  filteredExpenses: Expense[];
  totalMonthlyCost: number;
  totalYearlyCost: number;
  filterCategories: string[];
  setFilterCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
}

export function useExpenseFiltering(
  expenses: Expense[],
  filterCategories: string[],
  setFilterCategories: (categories: string[]) => void
): UseExpenseFilteringReturn {
  const distinctCategories = useMemo(
    () =>
      Array.from(
        new Set(expenses.map((expense) => expense.category).filter(Boolean))
      ) as string[],
    [expenses]
  );

  const filteredExpenses = useMemo(
    () =>
      filterCategories.length
        ? expenses.filter((expense) =>
            filterCategories.includes(expense.category)
          )
        : expenses,
    [expenses, filterCategories]
  );

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (a.chargeDay === b.chargeDay) {
        return a.name.localeCompare(b.name);
      }
      return a.chargeDay - b.chargeDay;
    });
  }, [filteredExpenses]);

  const totalMonthlyCost = useMemo(
    () =>
      sortedExpenses.reduce(
        (acc: number, expense: Expense) => acc + expense.monthlyCost,
        0
      ),
    [sortedExpenses]
  );

  const totalYearlyCost = useMemo(
    () => totalMonthlyCost * 12,
    [totalMonthlyCost]
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
    totalMonthlyCost,
    totalYearlyCost,
    filterCategories,
    setFilterCategories,
    toggleCategory,
  };
}
