import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Route } from "./+types/expenses";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import {
  createExpenseForUser,
  deleteExpenseForUser,
  getExpensesForUser,
  getLatestIncomeForUser,
  updateExpenseForUser,
  validateExpenseDelete,
  validateExpenseForm,
} from "~/modules/services/ExpenseService";
import { AddExpenseModal, EditExpenseModal } from "~/components/finance/ExpenseFormModal";
import ExpenseSummaryCards from "~/components/finance/ExpenseSummaryCards";
import ExpensesCategoryFilter from "~/components/finance/ExpensesCategoryFilter";
import ExpensesTable from "~/components/finance/ExpensesTable";
import { useExpenseFiltering } from "~/hooks/useExpenseFiltering";
import { useIncomeCalculations } from "~/hooks/useIncomeCalculations";
import type { Expense, ExpenseActionResult } from "~/types/expense";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export const loader = pageAccessLoader("finance", async (user) => {
  const [userExpenses, userIncome] = await Promise.all([
    getExpensesForUser(user.id),
    getLatestIncomeForUser(user.id),
  ]);
  return { userExpenses, userIncome };
});

export const action = pageAccessAction("finance", async (user, request): Promise<ExpenseActionResult> => {
  const formData = await request.formData();
  const intent = formData.get("_action");

  switch (intent) {
    case "add": {
      const parsed = validateExpenseForm(formData, "add");
      if (!parsed.success) return parsed.result;
      await createExpenseForUser(user.id, parsed.data);
      return { ok: true, action: "add", message: "Expense added." };
    }
    case "update": {
      const parsed = validateExpenseForm(formData, "update");
      if (!parsed.success) return parsed.result;
      const { id, ...values } = parsed.data;
      const updated = await updateExpenseForUser(user.id, id!, values);
      return updated.length
        ? { ok: true, action: "update", message: "Expense updated." }
        : { ok: false, error: "Expense not found or permission denied." };
    }
    case "delete": {
      const parsed = validateExpenseDelete(formData);
      if (!parsed.success) return parsed.result;
      const deleted = await deleteExpenseForUser(user.id, parsed.id);
      return deleted.length
        ? { ok: true, action: "delete", message: "Expense deleted." }
        : { ok: false, error: "Expense not found or permission denied." };
    }
    default:
      return { ok: false, error: "Unsupported expense action." };
  }
});

export default function Expenses({ loaderData }: Route.ComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [modalSubmissionPending, setModalSubmissionPending] = useState(false);
  const fetcher = useFetcher<ExpenseActionResult>();

  const { distinctCategories, filteredExpenses, totalMonthlyCost, toggleCategory } =
    useExpenseFiltering(loaderData.userExpenses, filterCategories, setFilterCategories);

  const { firstHalfTotal, secondHalfTotal } = useMemo(
    () =>
      filteredExpenses.reduce(
        (acc, expense) => {
          if (expense.isActive === 0) return acc;
          if (expense.chargeDay <= 14) acc.firstHalfTotal += expense.monthlyCost;
          else acc.secondHalfTotal += expense.monthlyCost;
          return acc;
        },
        { firstHalfTotal: 0, secondHalfTotal: 0 }
      ),
    [filteredExpenses]
  );

  const firstHalfPercentage = totalMonthlyCost ? (firstHalfTotal / totalMonthlyCost) * 100 : 0;
  const secondHalfPercentage = totalMonthlyCost ? (secondHalfTotal / totalMonthlyCost) * 100 : 0;
  const annualGrossIncomeCents = (loaderData.userIncome?.annualGrossIncome ?? 0) * 100;
  const taxDeductionPercentage = loaderData.userIncome?.taxDeductionPercentage ?? 0;
  const { netRemainingYearly, netRemainingMonthly } = useIncomeCalculations(
    annualGrossIncomeCents || undefined,
    taxDeductionPercentage || undefined,
    totalMonthlyCost
  );

  useEffect(() => {
    if (modalSubmissionPending && fetcher.state === "idle" && fetcher.data?.ok) {
      setIsModalOpen(false);
      setEditingExpense(null);
      setModalSubmissionPending(false);
    }
  }, [fetcher.data, fetcher.state, modalSubmissionPending]);

  const closeModals = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setModalSubmissionPending(false);
  };

  const totalYearlyCost = totalMonthlyCost * 12;

  return (
    <div className="min-h-screen bg-transparent p-4 text-gray-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col items-start justify-between gap-6 md:mb-12 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">Expenses</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Track recurring monthly expenses. Paused expenses stay visible but are excluded from totals.</p>
          </div>
          <button type="button" onClick={() => { setIsModalOpen(true); setEditingExpense(null); setModalSubmissionPending(false); }} className="flex min-h-[40px] items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-150 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
            <PlusIcon className="h-5 w-5" /> Add Expense
          </button>
        </header>

        <ExpenseSummaryCards totalMonthlyCost={totalMonthlyCost} totalYearlyCost={totalYearlyCost} annualGrossIncomeCents={annualGrossIncomeCents} taxDeductionPercentage={taxDeductionPercentage} netRemainingMonthly={netRemainingMonthly} netRemainingYearly={netRemainingYearly} />

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <PaymentHalfCard label="Days 1–14" title="First Half of Month" total={firstHalfTotal} percentage={firstHalfPercentage} />
          <PaymentHalfCard label="Days 15–End" title="Second Half of Month" total={secondHalfTotal} percentage={secondHalfPercentage} />
        </div>

        <ExpensesCategoryFilter distinctCategories={distinctCategories} filterCategories={filterCategories} onToggleCategory={toggleCategory} onClearFilters={() => setFilterCategories([])} />
        <ExpensesTable filteredExpenses={filteredExpenses} totalMonthlyCost={totalMonthlyCost} hasActiveFilters={filterCategories.length > 0} onEditExpense={(expense) => { setEditingExpense(expense); setIsModalOpen(false); setModalSubmissionPending(false); }} />
      </div>

      <AddExpenseModal isOpen={isModalOpen} distinctCategories={distinctCategories} onClose={closeModals} fetcher={fetcher} submissionAttempted={modalSubmissionPending} onSubmit={() => setModalSubmissionPending(true)} />
      <EditExpenseModal expense={editingExpense} distinctCategories={distinctCategories} onClose={closeModals} fetcher={fetcher} submissionAttempted={modalSubmissionPending} onSubmit={() => setModalSubmissionPending(true)} />
    </div>
  );
}

function PaymentHalfCard({ label, title, total, percentage }: { label: string; title: string; total: number; percentage: number }) {
  return <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm transition-all duration-150 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex items-center gap-3"><CalendarDaysIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">{label}</p><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3></div></div>
    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${(total / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}% of active filtered monthly spend</p>
  </div>;
}
