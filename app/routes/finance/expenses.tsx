import { useState, useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import { pageAccessLoader, pageAccessAction } from "~/modules/middleware/pageAccess";
import type { Route } from "./+types/expenses";
import { eq, desc } from "drizzle-orm";
import { PlusIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { AddExpenseModal, EditExpenseModal } from "~/components/finance/ExpenseFormModal";
import ExpenseSummaryCards from "~/components/finance/ExpenseSummaryCards";
import ExpensesCategoryFilter from "~/components/finance/ExpensesCategoryFilter";
import ExpensesTable from "~/components/finance/ExpensesTable";
import { useExpenseFiltering } from "~/hooks/useExpenseFiltering";
import { useIncomeCalculations } from "~/hooks/useIncomeCalculations";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export const loader = pageAccessLoader("finance", async (user, request) => {
  const { db } = await import("~/db");
  const { financeExpensesTable, financeIncomeTable } = await import("~/db/schema");

  const userExpenses = await db
    .select()
    .from(financeExpensesTable)
    .where(eq(financeExpensesTable.userId, user.id))
    .orderBy(desc(financeExpensesTable.createdAt));

  const userIncomeRecords = await db
    .select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, user.id))
    .orderBy(desc(financeIncomeTable.createdAt));

  return {
    userExpenses,
    userIncome: userIncomeRecords.length > 0 ? userIncomeRecords[0] : undefined,
  };
});

export const action = pageAccessAction("finance", async (user, request) => {
  const { db } = await import("~/db");
  const { financeExpensesTable } = await import("~/db/schema");

  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "delete") {
    const id = formData.get("id") as string;
    await db
      .delete(financeExpensesTable)
      .where(eq(financeExpensesTable.id, Number(id)));
    return;
  }

  if (_action === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const monthlyCostStr = formData.get("monthlyCost") as string;
    const chargeDayStr = formData.get("chargeDay") as string;
    const category = formData.get("category") as string;

    const monthlyCostFloat = parseFloat(monthlyCostStr);
    const monthlyCost = Math.round(monthlyCostFloat * 100);
    const chargeDay = parseInt(chargeDayStr, 10);

    if (!name || isNaN(monthlyCostFloat) || isNaN(chargeDay)) {
      return { error: "Invalid input" };
    }

    await db
      .update(financeExpensesTable)
      .set({ name, monthlyCost, chargeDay, category })
      .where(eq(financeExpensesTable.id, Number(id)));
    return;
  }

  const name = formData.get("name") as string;
  const monthlyCostStr = formData.get("monthlyCost") as string;
  const chargeDayStr = formData.get("chargeDay") as string;
  const category = formData.get("category") as string;

  const monthlyCostFloat = parseFloat(monthlyCostStr);
  const monthlyCost = Math.round(monthlyCostFloat * 100);
  const chargeDay = parseInt(chargeDayStr, 10);

  if (!name || isNaN(monthlyCostFloat) || isNaN(chargeDay)) {
    return { error: "Invalid input" };
  }

  await db.insert(financeExpensesTable).values({
    userId: user.id,
    name,
    monthlyCost,
    chargeDay,
    category,
  });
});

export default function Expenses({ loaderData }: Route.ComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const fetcher = useFetcher();

  const { distinctCategories, filteredExpenses, totalMonthlyCost, toggleCategory } =
    useExpenseFiltering(loaderData.userExpenses, filterCategories, setFilterCategories);

  const { firstHalfTotal, secondHalfTotal } = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, expense) => {
        if (expense.chargeDay <= 14) {
          acc.firstHalfTotal += expense.monthlyCost;
        } else {
          acc.secondHalfTotal += expense.monthlyCost;
        }
        return acc;
      },
      { firstHalfTotal: 0, secondHalfTotal: 0 }
    );
  }, [filteredExpenses]);

  const firstHalfPercentage = totalMonthlyCost
    ? (firstHalfTotal / totalMonthlyCost) * 100
    : 0;
  const secondHalfPercentage = totalMonthlyCost
    ? (secondHalfTotal / totalMonthlyCost) * 100
    : 0;

  const { netRemainingYearly, netRemainingMonthly } = useIncomeCalculations(
    (loaderData.userIncome?.annualGrossIncome ?? 0) || undefined,
    loaderData.userIncome?.taxDeductionPercentage || undefined,
    totalMonthlyCost
  );

  const totalYearlyCost = totalMonthlyCost * 12;
  const annualGrossIncome = (loaderData.userIncome?.annualGrossIncome ?? 0) * 100;
  const taxDeductionPercentage = loaderData.userIncome?.taxDeductionPercentage ?? 0;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && lastSubmitTime > 0) {
      setIsModalOpen(false);
      setEditingExpense(null);
      setLastSubmitTime(0);
    }
  }, [fetcher.state, fetcher.data, lastSubmitTime]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Expenses
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Track and manage your monthly expenses.
            </p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setEditingExpense(null);
            }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
          >
            <PlusIcon className="w-5 h-5" />
            Add Expense
          </button>
        </header>

        <ExpenseSummaryCards
          totalMonthlyCost={totalMonthlyCost}
          totalYearlyCost={totalYearlyCost}
          annualGrossIncome={annualGrossIncome}
          taxDeductionPercentage={taxDeductionPercentage}
          netRemainingMonthly={netRemainingMonthly}
          netRemainingYearly={netRemainingYearly}
        />

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDaysIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Days 1-14</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  First Half of Month
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              $
              {(firstHalfTotal / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {firstHalfPercentage.toFixed(1)}% of filtered monthly spend
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDaysIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Days 15-End</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Second Half of Month
                </h3>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              $
              {(secondHalfTotal / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {secondHalfPercentage.toFixed(1)}% of filtered monthly spend
            </p>
          </div>
        </div>

        <ExpensesCategoryFilter
          distinctCategories={distinctCategories}
          filterCategories={filterCategories}
          onToggleCategory={toggleCategory}
          onClearFilters={() => setFilterCategories([])}
        />

        <ExpensesTable
          filteredExpenses={filteredExpenses}
          totalMonthlyCost={totalMonthlyCost}
          onEditExpense={setEditingExpense}
        />
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        distinctCategories={distinctCategories}
        onClose={() => setIsModalOpen(false)}
        fetcher={fetcher}
        onLastSubmitTimeChange={setLastSubmitTime}
        lastSubmitTime={lastSubmitTime}
      />

      <EditExpenseModal
        expense={editingExpense}
        distinctCategories={distinctCategories}
        onClose={() => setEditingExpense(null)}
        fetcher={fetcher}
        onLastSubmitTimeChange={setLastSubmitTime}
        lastSubmitTime={lastSubmitTime}
      />
    </div>
  );
}
