import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/expenses";
import { db } from "~/db";
import { financeExpensesTable, financeIncomeTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

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

  const distinctCategories = Array.from(
    new Set(
      loaderData.userExpenses.map((expense) => expense.category).filter(Boolean)
    )
  );

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      setIsModalOpen(false);
      setEditingExpense(null);
    }
  }, [fetcher.state, fetcher.data]);

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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center md:text-left">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600">
                Expenses
              </span>
            </h1>
            <p className="mt-2 text-lg text-slate-400 text-center md:text-left">
              Track and manage your monthly expenses.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-75"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Expense
          </button>
        </header>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Summary */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-rose-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              Monthly Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Monthly Expenses:</span>
                <span className="text-xl font-medium text-rose-400">
                  $
                  {(totalMonthlyCost / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {annualGrossIncome !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Net Remaining Monthly:</span>
                  <span className="text-xl font-medium text-emerald-400">
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
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-rose-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                />
              </svg>
              Yearly Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Yearly Expenses:</span>
                <span className="text-xl font-medium text-rose-400">
                  $
                  {(totalYearlyCost / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {annualGrossIncome !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Net Remaining Yearly:</span>
                  <span className="text-xl font-medium text-emerald-400">
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
        <div className="mb-6 bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <label className="text-sm font-medium text-slate-300 min-w-[120px]">
              Filter by Category:
            </label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors text-left flex justify-between items-center"
              >
                {filterCategories.length > 0
                  ? filterCategories.join(", ")
                  : "All Categories"}
                <svg
                  className="w-5 h-5 text-slate-400"
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
              </button>{" "}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {distinctCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center px-4 py-2.5 hover:bg-slate-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={cat}
                        checked={filterCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="mr-2 rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-slate-200">{cat}</span>
                    </label>
                  ))}
                  {filterCategories.length > 0 && (
                    <div className="border-t border-slate-600 p-2">
                      <button
                        onClick={() => setFilterCategories([])}
                        className="w-full px-3 py-1.5 text-xs text-center bg-slate-600 hover:bg-slate-500 rounded text-white transition-colors"
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
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Monthly Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Charge Day
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mx-auto h-12 w-12 text-slate-500"
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
                      <p className="mt-2 text-lg">No expenses found.</p>
                      <p className="text-sm">
                        Add your first expense to start tracking.
                      </p>
                    </td>
                  </tr>
                ) : (
                  expenses.map(
                    (expense: typeof financeExpensesTable.$inferSelect) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-200">
                          {expense.name}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="font-medium text-rose-400">
                            ${(expense.monthlyCost / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {(
                              (expense.monthlyCost / totalMonthlyCost) *
                              100
                            ).toFixed(1)}
                            % of total
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                            Day {expense.chargeDay}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingExpense(expense)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 transition-colors"
                            >
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
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors"
                              >
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-pop-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600">
                Add New Expense
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <fetcher.Form method="post" className="space-y-5">
              <input type="hidden" name="_action" value="add" />

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Expense Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="e.g., Netflix, Rent, Groceries"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="monthlyCost"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Monthly Cost
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyCost"
                    id="monthlyCost"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="chargeDay"
                  className="block text-sm font-medium text-slate-300 mb-1"
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
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  Enter the day of the month when this expense is charged.
                </p>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  placeholder="e.g., Entertainment, Housing, Food"
                  list="categories"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                  required
                />
                <datalist id="categories">
                  {distinctCategories
                    .filter((cat): cat is string => cat !== null)
                    .map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                </datalist>
                <p className="mt-1 text-xs text-slate-400">
                  Enter an existing category or create a new one.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-75"
                >
                  {fetcher.state === "submitting" ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Expense
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-pop-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-600">
                Edit Expense
              </h2>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <fetcher.Form method="post" className="space-y-5">
              <input type="hidden" name="_action" value="update" />
              <input type="hidden" name="id" value={editingExpense.id} />

              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Expense Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="edit-name"
                  defaultValue={editingExpense.name}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-monthlyCost"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Monthly Cost
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyCost"
                    id="edit-monthlyCost"
                    defaultValue={(editingExpense.monthlyCost / 100).toFixed(2)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-chargeDay"
                  className="block text-sm font-medium text-slate-300 mb-1"
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
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-category"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="edit-category"
                  defaultValue={editingExpense.category}
                  list="edit-categories"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <datalist id="edit-categories">
                  {distinctCategories
                    .filter((cat): cat is string => cat !== null)
                    .map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                </datalist>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
                >
                  {fetcher.state === "submitting" ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Update Expense
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
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
