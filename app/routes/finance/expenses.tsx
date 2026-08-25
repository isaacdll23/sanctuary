import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { PlusIcon } from "@heroicons/react/24/outline";
import type { Route } from "./+types/expenses";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import {
  createExpenseForUser,
  createPaymentAccountForUser,
  deleteExpenseForUser,
  deletePaymentAccountForUser,
  getExpensesForUser,
  getLatestIncomeForUser,
  getPaymentAccountsForUser,
  isPaymentAccountOwnedByUser,
  setExpenseActiveForUser,
  updateExpenseForUser,
  validateExpenseDelete,
  validateExpenseForm,
  validateExpenseStatus,
  validatePaymentAccountForm,
} from "~/modules/services/ExpenseService";
import { AddExpenseModal, EditExpenseModal } from "~/components/finance/ExpenseFormModal";
import ExpenseSummaryCards from "~/components/finance/ExpenseSummaryCards";
import ExpensesCategoryFilter from "~/components/finance/ExpensesCategoryFilter";
import ExpensesTable from "~/components/finance/ExpensesTable";
import PaymentAccountsPanel from "~/components/finance/PaymentAccountsPanel";
import PaycheckCashFlow from "~/components/finance/PaycheckCashFlow";
import FinanceSubnav from "~/components/finance/FinanceSubnav";
import { useExpenseFiltering, type ExpenseSort, type ExpenseStatusFilter } from "~/hooks/useExpenseFiltering";
import { useIncomeCalculations } from "~/hooks/useIncomeCalculations";
import { getReferenceDateKey } from "~/modules/finance/paySchedule";
import { getPrimaryPayScheduleForUser } from "~/modules/services/IncomeService";
import { Link } from "react-router";
import type { Expense, ExpenseActionResult } from "~/types/expense";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export const loader = pageAccessLoader("finance", async (user) => {
  const [userExpenses, userIncome, paymentAccounts, paySchedule] = await Promise.all([
    getExpensesForUser(user.id),
    getLatestIncomeForUser(user.id),
    getPaymentAccountsForUser(user.id),
    getPrimaryPayScheduleForUser(user.id),
  ]);
  return { userExpenses, userIncome, paymentAccounts, paySchedule, asOfDate: getReferenceDateKey(user.timeZone) };
});

export const action = pageAccessAction("finance", async (user, request): Promise<ExpenseActionResult> => {
  const formData = await request.formData();
  const intent = formData.get("_action");

  switch (intent) {
    case "add": {
      const parsed = validateExpenseForm(formData, "add");
      if (!parsed.success) return parsed.result;
      if (!await isPaymentAccountOwnedByUser(user.id, parsed.data.accountId)) return { ok: false, error: "Select one of your payment accounts." };
      await createExpenseForUser(user.id, parsed.data);
      return { ok: true, action: "add", message: "Expense added." };
    }
    case "update": {
      const parsed = validateExpenseForm(formData, "update");
      if (!parsed.success) return parsed.result;
      const { id, ...values } = parsed.data;
      if (!await isPaymentAccountOwnedByUser(user.id, values.accountId)) return { ok: false, error: "Select one of your payment accounts." };
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
    case "toggleStatus": {
      const parsed = validateExpenseStatus(formData);
      if (!parsed.success) return parsed.result;
      const updated = await setExpenseActiveForUser(user.id, parsed.id, parsed.isActive);
      return updated.length
        ? { ok: true, action: "toggleStatus", message: parsed.isActive ? "Expense resumed and included in totals." : "Expense paused and excluded from totals." }
        : { ok: false, error: "Expense not found or permission denied." };
    }
    case "addPaymentAccount": {
      const parsed = validatePaymentAccountForm(formData);
      if (!parsed.success) return parsed.result;
      await createPaymentAccountForUser(user.id, parsed.data.name);
      return { ok: true, action: "addPaymentAccount", message: "Payment account added." };
    }
    case "deletePaymentAccount": {
      const parsed = validateExpenseDelete(formData);
      if (!parsed.success) return parsed.result;
      const deleted = await deletePaymentAccountForUser(user.id, parsed.id);
      return deleted.length ? { ok: true, action: "deletePaymentAccount", message: "Payment account removed. Linked expenses are now unassigned." } : { ok: false, error: "Payment account not found or permission denied." };
    }
    default:
      return { ok: false, error: "Unsupported expense action." };
  }
});

export default function Expenses({ loaderData }: Route.ComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>("all");
  const [sort, setSort] = useState<ExpenseSort>("nextCharge");
  const [modalSubmissionPending, setModalSubmissionPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const fetcher = useFetcher<ExpenseActionResult>();
  const handledActionResult = useRef<ExpenseActionResult | undefined>(undefined);

  const { distinctCategories, filteredExpenses, filteredMonthlyCost, filteredYearlyCost, filteredActiveCount, totalMonthlyCost, totalYearlyCost, toggleCategory } =
    useExpenseFiltering(loaderData.userExpenses, filterCategories, setFilterCategories, searchQuery, statusFilter, sort, loaderData.asOfDate);

  const hasPaySchedule = Boolean(loaderData.paySchedule && loaderData.paySchedule.isEnabled !== 0);
  const annualGrossIncomeCents = (loaderData.userIncome?.annualGrossIncome ?? 0) * 100;
  const taxDeductionPercentage = loaderData.userIncome?.taxDeductionPercentage ?? 0;
  const { netRemainingYearly, netRemainingMonthly } = useIncomeCalculations(
    annualGrossIncomeCents || undefined,
    taxDeductionPercentage || undefined,
    totalMonthlyCost,
    totalYearlyCost
  );

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcher.data === handledActionResult.current) return;
    handledActionResult.current = fetcher.data;
    setFeedback(fetcher.data.ok
      ? { kind: "success", message: fetcher.data.message }
      : { kind: "error", message: fetcher.data.error });
    if (modalSubmissionPending && fetcher.data.ok) {
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

  const hasActiveFilters = filterCategories.length > 0 || searchQuery.trim().length > 0 || statusFilter !== "all";
  const clearFilters = () => {
    setFilterCategories([]);
    setSearchQuery("");
    setStatusFilter("all");
  };
  const openAddExpense = () => {
    setIsModalOpen(true);
    setEditingExpense(null);
    setModalSubmissionPending(false);
  };

  return (
    <div className="min-h-screen bg-transparent p-4 text-gray-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col items-start justify-between gap-6 md:mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">Expenses</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Track recurring expenses across billing schedules. Paused expenses stay visible but are excluded from totals.</p>
          </div>
          <button type="button" onClick={openAddExpense} className="flex min-h-[40px] items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-150 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
            <PlusIcon className="h-5 w-5" /> Add Expense
          </button>
        </header>

        <FinanceSubnav />

        {feedback && <div role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite" className={`mb-6 flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${feedback.kind === "error" ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}><span>{feedback.message}</span><button type="button" onClick={() => setFeedback(null)} className="font-semibold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-current">Dismiss</button></div>}

        <ExpenseSummaryCards totalMonthlyCost={totalMonthlyCost} totalYearlyCost={totalYearlyCost} annualGrossIncomeCents={annualGrossIncomeCents} taxDeductionPercentage={taxDeductionPercentage} netRemainingMonthly={netRemainingMonthly} netRemainingYearly={netRemainingYearly} />

        {hasPaySchedule ? <PaycheckCashFlow schedule={loaderData.paySchedule!} annualGrossIncome={loaderData.userIncome?.annualGrossIncome} taxDeductionPercentage={loaderData.userIncome?.taxDeductionPercentage} expenses={loaderData.userExpenses} asOfDate={loaderData.asOfDate} paymentAccounts={loaderData.paymentAccounts} /> : <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 sm:flex-row sm:items-center dark:border-gray-700 dark:bg-gray-800/70"><p className="text-sm text-gray-700 dark:text-gray-300">Add a primary pay schedule to plan bills by paycheck.</p><Link to="/finance/income" className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600">Set up pay schedule</Link></div>}

        <ExpensesCategoryFilter distinctCategories={distinctCategories} filterCategories={filterCategories} onToggleCategory={toggleCategory} onClearFilters={clearFilters} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} status={statusFilter} onStatusChange={setStatusFilter} sort={sort} onSortChange={setSort} />
        <ExpensesTable filteredExpenses={filteredExpenses} totalExpenseCount={loaderData.userExpenses.length} totalMonthlyCost={totalMonthlyCost} filteredMonthlyCost={filteredMonthlyCost} filteredYearlyCost={filteredYearlyCost} filteredActiveCount={filteredActiveCount} hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} onAddExpense={openAddExpense} fetcher={fetcher} paymentAccounts={loaderData.paymentAccounts} asOfDate={loaderData.asOfDate} onEditExpense={(expense) => { setEditingExpense(expense); setIsModalOpen(false); setModalSubmissionPending(false); }} />
        <PaymentAccountsPanel accounts={loaderData.paymentAccounts} fetcher={fetcher} />
      </div>

      <AddExpenseModal isOpen={isModalOpen} distinctCategories={distinctCategories} paymentAccounts={loaderData.paymentAccounts} onClose={closeModals} fetcher={fetcher} submissionAttempted={modalSubmissionPending} onSubmit={() => setModalSubmissionPending(true)} />
      <EditExpenseModal expense={editingExpense} distinctCategories={distinctCategories} paymentAccounts={loaderData.paymentAccounts} onClose={closeModals} fetcher={fetcher} submissionAttempted={modalSubmissionPending} onSubmit={() => setModalSubmissionPending(true)} />
    </div>
  );
}
