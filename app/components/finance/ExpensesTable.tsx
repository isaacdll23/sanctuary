import { useFetcher } from "react-router";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Expense {
  id: number;
  name: string;
  monthlyCost: number;
  chargeDay: number;
  category: string;
}

interface ExpensesTableProps {
  filteredExpenses: Expense[];
  totalMonthlyCost: number;
  onEditExpense: (expense: Expense) => void;
}

export default function ExpensesTable({
  filteredExpenses,
  totalMonthlyCost,
  onEditExpense,
}: ExpensesTableProps) {
  const fetcher = useFetcher();

  return (
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
            {filteredExpenses.length === 0 ? (
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
              filteredExpenses.map((expense: Expense) => (
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
                        onClick={() => onEditExpense(expense)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
