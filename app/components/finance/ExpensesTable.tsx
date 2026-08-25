import { PauseIcon, PencilIcon, PlayIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { FetcherWithComponents } from "react-router";
import type { Expense, ExpenseActionResult } from "~/types/expense";
import type { PaymentAccountOption } from "~/components/finance/PaymentAccountsPanel";
import { formatDateKey, getNextChargeDate, getNormalizedMonthlyCostCents, getRecurrenceDescription, parseDateKey } from "~/modules/finance/recurrence";

interface ExpensesTableProps {
  filteredExpenses: Expense[];
  totalExpenseCount: number;
  totalMonthlyCost: number;
  filteredMonthlyCost: number;
  filteredYearlyCost: number;
  filteredActiveCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  fetcher: FetcherWithComponents<ExpenseActionResult>;
  paymentAccounts: PaymentAccountOption[];
  asOfDate: string;
}

export default function ExpensesTable({ filteredExpenses, totalExpenseCount, totalMonthlyCost, filteredMonthlyCost, filteredYearlyCost, filteredActiveCount, hasActiveFilters, onClearFilters, onAddExpense, onEditExpense, fetcher, paymentAccounts, asOfDate }: ExpensesTableProps) {
  const asOf = parseDateKey(asOfDate);
  const getShareOfTotal = (expense: Expense) =>
    !totalMonthlyCost || expense.isActive === 0
      ? "—"
      : ((getNormalizedMonthlyCostCents(expense) / totalMonthlyCost) * 100).toFixed(1);
  const isSubmitting = fetcher.state !== "idle";
  const isEmpty = totalExpenseCount === 0;
  const emptyState = <EmptyState isEmpty={isEmpty} onAddExpense={onAddExpense} onClearFilters={onClearFilters} />;

  return (
    <section aria-label="Expense results" className="mb-8">
      {hasActiveFilters && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300">
          <p>
            <span className="font-semibold">Filtered results:</span> {filteredExpenses.length}{" "}
            {filteredExpenses.length === 1 ? "expense" : "expenses"} · {filteredActiveCount} active ·{" "}
            <span className="font-medium">
              ${(filteredMonthlyCost / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              /month
            </span>{" "}
            active subtotal · ${(filteredYearlyCost / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/year
          </p>
          <button type="button" onClick={onClearFilters} className="w-fit font-semibold underline underline-offset-2 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:text-white dark:focus:ring-gray-600">
            Clear filters
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="divide-y divide-gray-300 dark:divide-gray-700/50 md:hidden">
          {filteredExpenses.length === 0
            ? emptyState
            : filteredExpenses.map((expense) => (
                <article key={expense.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{expense.name}</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">${(expense.monthlyCost / 100).toFixed(2)} per charge · ${(getNormalizedMonthlyCostCents(expense) / 100).toFixed(2)}/month</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">Next {formatDateKey(getNextChargeDate(expense, asOf))}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">{expense.category}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{expense.isActive === 0 ? "Paused" : `${getShareOfTotal(expense)}% of active total`}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{getRecurrenceDescription(expense)} · {expense.necessity} · {expense.costType} · {expense.paymentMethod}{expense.accountId ? ` · ${paymentAccounts.find((account) => account.id === expense.accountId)?.name ?? "Unassigned"}` : ""}</p>
                  <ExpenseActions expense={expense} fetcher={fetcher} isSubmitting={isSubmitting} onEditExpense={onEditExpense} />
                </article>
              ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700/50">
              <tr>
                {["Name", "Cost", "Schedule", "Category", "Details"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">{heading}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-gray-700/50">
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8">{emptyState}</td></tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        {expense.name}
                        {expense.isActive === 0 && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">Paused</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">${(expense.monthlyCost / 100).toFixed(2)} per charge</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">${(getNormalizedMonthlyCostCents(expense) / 100).toFixed(2)}/month normalized</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{expense.isActive === 0 ? "Paused" : `${getShareOfTotal(expense)}% of active total`}</div>
                    </td>
                    <td className="px-4 py-4 text-sm"><div className="font-medium text-gray-900 dark:text-gray-100">{getRecurrenceDescription(expense)}</div><div className="text-xs text-gray-600 dark:text-gray-400">Next {formatDateKey(getNextChargeDate(expense, asOf))}</div></td>
                    <td className="px-4 py-4 text-sm"><span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">{expense.category}</span></td>
                    <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-400"><div className="capitalize">{expense.necessity} · {expense.costType}</div><div className="capitalize">{expense.paymentMethod}{expense.accountId ? ` · ${paymentAccounts.find((account) => account.id === expense.accountId)?.name ?? "Unassigned"}` : ""}</div></td>
                    <td className="px-4 py-4 text-right text-sm"><ExpenseActions expense={expense} fetcher={fetcher} isSubmitting={isSubmitting} onEditExpense={onEditExpense} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ExpenseActions({ expense, fetcher, isSubmitting, onEditExpense }: { expense: Expense; fetcher: FetcherWithComponents<ExpenseActionResult>; isSubmitting: boolean; onEditExpense: (expense: Expense) => void }) {
  const buttonClass = "inline-flex min-h-[36px] items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-600";
  const deleteButtonClass = "inline-flex min-h-[36px] items-center rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 shadow-sm transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60 dark:focus:ring-red-600";
  const statusLabel = expense.isActive === 0 ? "Resume" : "Pause";
  return (
    <div className="mt-3 flex flex-wrap justify-end gap-2 md:mt-0">
      <fetcher.Form method="post">
        <input type="hidden" name="_action" value="toggleStatus" />
        <input type="hidden" name="id" value={expense.id} />
        <input type="hidden" name="isActive" value={expense.isActive === 0 ? "1" : "0"} />
        <button type="submit" disabled={isSubmitting} className={buttonClass} aria-label={`${statusLabel} ${expense.name}`}>
          {expense.isActive === 0 ? <PlayIcon className="mr-1 h-4 w-4" /> : <PauseIcon className="mr-1 h-4 w-4" />}
          {statusLabel}
        </button>
      </fetcher.Form>
      <button type="button" onClick={() => onEditExpense(expense)} disabled={isSubmitting} className={buttonClass} aria-label={`Edit ${expense.name}`}>
        <PencilIcon className="mr-1 h-4 w-4" />Edit
      </button>
      <fetcher.Form method="post" onSubmit={(event) => { if (!window.confirm(`Delete ${expense.name}? This cannot be undone.`)) event.preventDefault(); }}>
        <input type="hidden" name="_action" value="delete" />
        <input type="hidden" name="id" value={expense.id} />
        <button type="submit" disabled={isSubmitting} className={deleteButtonClass} aria-label={`Delete ${expense.name}`}>
          <TrashIcon className="mr-1 h-4 w-4" />Delete
        </button>
      </fetcher.Form>
    </div>
  );
}

function EmptyState({ isEmpty, onAddExpense, onClearFilters }: { isEmpty: boolean; onAddExpense: () => void; onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center text-center text-gray-600 dark:text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p className="text-base font-medium">{isEmpty ? "No expenses yet." : "No expenses match these filters."}</p>
      <p className="mt-1 text-sm">{isEmpty ? "Add your first recurring expense to start tracking." : "Try clearing filters or changing your search."}</p>
      {isEmpty ? (
        <button type="button" onClick={onAddExpense} className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <PlusIcon className="h-4 w-4" />Add Expense
        </button>
      ) : (
        <button type="button" onClick={onClearFilters} className="mt-4 font-semibold underline underline-offset-2 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:text-white dark:focus:ring-gray-600">Clear filters</button>
      )}
    </div>
  );
}
