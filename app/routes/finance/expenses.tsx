import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/expenses";
import { db } from "~/db";
import { financeExpensesTable, financeIncomeTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const user = await getUserFromSession(request);

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

  // Check if user has any income
  if (userIncomeRecords.length === 0) {
    return { userExpenses: userExpenses, userIncome: undefined };
  }

  return { userExpenses: userExpenses, userIncome: userIncomeRecords[0] };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "delete") {
    const id = formData.get("id") as string;
    await db
      .delete(financeExpensesTable)
      .where(eq(financeExpensesTable.id, Number(id)));
    return;
  } else if (_action === "update") {
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
  } else {
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

    const user = await getUserFromSession(request);

    await db.insert(financeExpensesTable).values({
      userId: user.id,
      name,
      monthlyCost,
      chargeDay,
      category,
    });
  }
}

export default function Expenses({ loaderData }: Route.ComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const fetcher = useFetcher();
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const distinctCategories = Array.from(
    new Set(
      loaderData.userExpenses.map((expense) => expense.category).filter(Boolean)
    )
  );

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      lastSubmitTime > 0
    ) {
      setIsModalOpen(false);
      setEditingExpense(null);
      setLastSubmitTime(0);
    }
  }, [fetcher.state, fetcher.data, lastSubmitTime]);

  const filteredExpenses = filterCategories.length
    ? loaderData.userExpenses.filter((expense) =>
        filterCategories.includes(expense.category)
      )
    : loaderData.userExpenses;

  const expenses = filteredExpenses.sort((e1, e2) =>
    e1.monthlyCost > e2.monthlyCost ? -1 : 1
  );

  const totalMonthlyCost = expenses.reduce(
    (acc: number, expense: typeof financeExpensesTable.$inferSelect) =>
      acc + expense.monthlyCost,
    0
  );
  const totalYearlyCost = totalMonthlyCost * 12;

  const annualGrossIncome =
    (loaderData.userIncome?.annualGrossIncome ?? 0) * 100;
  const taxDeductionPercentage =
    loaderData.userIncome?.taxDeductionPercentage ?? 0;
  const annualIncomeAfterTax =
    annualGrossIncome * (1 - taxDeductionPercentage / 100);
  const netRemainingYearly = annualIncomeAfterTax - totalYearlyCost;
  const netRemainingMonthly = netRemainingYearly / 12;

  // Toggle category selection
  const toggleCategory = (cat: string) => {
    setFilterCategories((current) =>
      current.includes(cat)
        ? current.filter((x) => x !== cat)
        : [...current, cat]
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Summary */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Monthly Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Monthly Expenses:
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  $
                  {(totalMonthlyCost / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {annualGrossIncome !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Net Remaining Monthly:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    $
                    {(netRemainingMonthly / 100).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Yearly Summary */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Yearly Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Yearly Expenses:
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  $
                  {(totalYearlyCost / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {annualGrossIncome !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Net Remaining Yearly:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    $
                    {(netRemainingYearly / 100).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="relative z-20 mb-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-fit">
              Filter by Category:
            </label>
            <div className="relative w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full md:w-auto px-4 py-2.5 text-sm bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150 flex justify-between items-center"
              >
                {filterCategories.length > 0
                  ? filterCategories.join(", ")
                  : "All Categories"}
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={showDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                  />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {distinctCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-150"
                    >
                      <input
                        type="checkbox"
                        value={cat}
                        checked={filterCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="mr-3 rounded text-gray-900 dark:bg-gray-600 dark:border-gray-500 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {cat}
                      </span>
                    </label>
                  ))}
                  {filterCategories.length > 0 && (
                    <div className="border-t border-gray-300 dark:border-gray-600 p-2">
                      <button
                        onClick={() => setFilterCategories([])}
                        className="w-full px-3 py-1.5 text-xs text-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-900 dark:text-white transition-colors duration-150"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Monthly Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Charge Day
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-gray-700/50">
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-600 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        <p className="text-base font-medium">No expenses found.</p>
                        <p className="text-sm">
                          Add your first expense to start tracking.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map(
                    (expense: typeof financeExpensesTable.$inferSelect) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {expense.name}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            ${(expense.monthlyCost / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {(
                              (expense.monthlyCost / totalMonthlyCost) *
                              100
                            ).toFixed(1)}
                            % of total
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            Day {expense.chargeDay}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingExpense(expense)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150 min-h-[32px]"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <fetcher.Form
                              method="post"
                              className="inline-block"
                            >
                              <input
                                type="hidden"
                                name="_action"
                                value="delete"
                              />
                              <input
                                type="hidden"
                                name="id"
                                value={expense.id}
                              />
                              <button
                                type="submit"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150 min-h-[32px]"
                              >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </fetcher.Form>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-150">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Add New Expense
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setLastSubmitTime(0);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <fetcher.Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="_action" value="add" />

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Expense Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="e.g., Netflix, Rent, Groceries"
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="monthlyCost"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Monthly Cost
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyCost"
                    id="monthlyCost"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="chargeDay"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Day of Month Charged
                </label>
                <input
                  type="number"
                  name="chargeDay"
                  id="chargeDay"
                  placeholder="1-31"
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Enter the day of the month when this expense is charged.
                </p>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  placeholder="e.g., Entertainment, Housing, Food"
                  list="categories"
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
                <datalist id="categories">
                  {distinctCategories
                    .filter((cat): cat is string => cat !== null)
                    .map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                </datalist>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Enter an existing category or create a new one.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  onClick={() => setLastSubmitTime(Date.now())}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 dark:bg-gray-100 dark:hover:bg-gray-200 dark:disabled:bg-gray-400 text-white dark:text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
                >
                  {fetcher.state === "submitting" ? (
                    <>
                      <ArrowPathIcon className="animate-spin w-4 h-4" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Add Expense
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setLastSubmitTime(0);
                  }}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-150">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Expense
              </h2>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setLastSubmitTime(0);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <fetcher.Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="_action" value="update" />
              <input type="hidden" name="id" value={editingExpense.id} />

              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Expense Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="edit-name"
                  defaultValue={editingExpense.name}
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-monthlyCost"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Monthly Cost
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyCost"
                    id="edit-monthlyCost"
                    defaultValue={(editingExpense.monthlyCost / 100).toFixed(2)}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-chargeDay"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Day of Month Charged
                </label>
                <input
                  type="number"
                  name="chargeDay"
                  id="edit-chargeDay"
                  defaultValue={editingExpense.chargeDay}
                  min="1"
                  max="31"
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="edit-category"
                  defaultValue={editingExpense.category}
                  list="edit-categories"
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                />
                <datalist id="edit-categories">
                  {distinctCategories
                    .filter((cat): cat is string => cat !== null)
                    .map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                </datalist>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  onClick={() => setLastSubmitTime(Date.now())}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 dark:bg-gray-100 dark:hover:bg-gray-200 dark:disabled:bg-gray-400 text-white dark:text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
                >
                  {fetcher.state === "submitting" ? (
                    <>
                      <ArrowPathIcon className="animate-spin w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PencilIcon className="w-4 h-4" />
                      Update Expense
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingExpense(null);
                    setLastSubmitTime(0);
                  }}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}
