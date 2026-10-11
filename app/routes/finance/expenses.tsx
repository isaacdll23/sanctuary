import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { PlusIcon } from "@heroicons/react/24/outline";
import type { Route } from "./+types/expenses";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import {
  getBalanceSnapshotsForUser,
  getExpenseChargesForUser,
  getExpensesForUser,
  getLatestIncomeForUser,
  getPaymentAccountsForUser,
  validateBalanceCheckIn,
  validateExpenseChargeForm,
  validateExpenseDelete,
  validateExpenseForm,
  validateExpenseStatus,
  validatePaymentAccountForm,
} from "~/modules/services/ExpenseService";
import {
  createExpense,
  createPaymentAccount,
  deleteExpense,
  deletePaymentAccount,
  logAccountBalance,
  recordExpenseCharge,
  removeExpenseCharge,
  setExpenseActive,
  updateExpense,
} from "~/modules/services/FinanceCommandService";
import { AddExpenseModal, EditExpenseModal } from "~/components/finance/ExpenseFormModal";
import BalanceSummary from "~/components/finance/BalanceSummary";
import ExpenseSummaryCards from "~/components/finance/ExpenseSummaryCards";
import ExpensesCategoryFilter from "~/components/finance/ExpensesCategoryFilter";
import ExpensesTable from "~/components/finance/ExpensesTable";
import PaymentAccountsPanel from "~/components/finance/PaymentAccountsPanel";
import PaycheckCashFlow from "~/components/finance/PaycheckCashFlow";
import FinanceSubnav from "~/components/finance/FinanceSubnav";
import { useExpenseFiltering, type ExpenseSort, type ExpenseStatusFilter } from "~/hooks/useExpenseFiltering";
import { useIncomeCalculations } from "~/hooks/useIncomeCalculations";
import { getDaysSince, summarizeBalances } from "~/modules/finance/balances";
import { buildPaidChargeKeys, getBillsBeforePayday, getMostRecentPayDate, getNextPaydayAfter, getReferenceDateKey } from "~/modules/finance/paySchedule";
import { formatDateKey, parseDateKey } from "~/modules/finance/recurrence";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { financePaySchedulesTable } from "~/db/schema";
import { Link } from "react-router";
import type { Expense, ExpenseActionResult } from "~/types/expense";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export const loader = pageAccessLoader("finance", async (user) => {
  const asOfDate = getReferenceDateKey(user.timeZone);
  // One year of history covers paid-charge lookups, staleness display, and any
  // next occurrence the user marks paid early, including on a yearly schedule.
  const historySinceDate = formatDateKey(new Date(parseDateKey(asOfDate).getTime() - 365 * 86_400_000));
  const [userExpenses, userIncome, paymentAccounts, paySchedule, chargeRecords, balanceSnapshots] = await Promise.all([
    getExpensesForUser(user.id),
    getLatestIncomeForUser(user.id),
    getPaymentAccountsForUser(user.id),
    db.select().from(financePaySchedulesTable).where(eq(financePaySchedulesTable.userId, user.id)).limit(1).then((rows) => rows[0] ?? null),
    getExpenseChargesForUser(user.id, historySinceDate),
    getBalanceSnapshotsForUser(user.id, historySinceDate),
  ]);
  return { userExpenses, userIncome, paymentAccounts, paySchedule, asOfDate, chargeRecords, balanceSnapshots };
});

export const action = pageAccessAction("finance", async (user, request): Promise<ExpenseActionResult> => {
  const formData = await request.formData();
  const intent = formData.get("_action");

  switch (intent) {
    case "add": {
      const parsed = validateExpenseForm(formData, "add");
      if (!parsed.success) return parsed.result;
      return createExpense(user.id, parsed.data);
    }
    case "update": {
      const parsed = validateExpenseForm(formData, "update");
      if (!parsed.success) return parsed.result;
      const { id, ...values } = parsed.data;
      return updateExpense(user.id, id, values);
    }
    case "delete": {
      const parsed = validateExpenseDelete(formData);
      if (!parsed.success) return parsed.result;
      return deleteExpense(user.id, parsed.id);
    }
    case "toggleStatus": {
      const parsed = validateExpenseStatus(formData);
      if (!parsed.success) return parsed.result;
      return setExpenseActive(user.id, parsed.id, parsed.isActive);
    }
    case "markChargePaid": {
      const parsed = validateExpenseChargeForm(formData, "mark");
      if (!parsed.success) return parsed.result;
      if (parsed.data.amountCents == null) return { ok: false, error: "Enter the amount that was charged." };
      return recordExpenseCharge(user.id, parsed.data.expenseId, parsed.data.chargeDate, parsed.data.amountCents);
    }
    case "unmarkChargePaid": {
      const parsed = validateExpenseChargeForm(formData, "unmark");
      if (!parsed.success) return parsed.result;
      return removeExpenseCharge(user.id, parsed.data.expenseId, parsed.data.chargeDate);
    }
    case "logBalance": {
      const parsed = validateBalanceCheckIn(formData);
      if (!parsed.success) return parsed.result;
      return logAccountBalance(user.id, parsed.data.accountId, parsed.data.balanceDate, parsed.data.balanceCents);
    }
    case "addPaymentAccount": {
      const parsed = validatePaymentAccountForm(formData);
      if (!parsed.success) return parsed.result;
      return createPaymentAccount(user.id, parsed.data.name);
    }
    case "deletePaymentAccount": {
      const parsed = validateExpenseDelete(formData);
      if (!parsed.success) return parsed.result;
      return deletePaymentAccount(user.id, parsed.id);
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
  const asOf = parseDateKey(loaderData.asOfDate);
  const paidChargeKeys = buildPaidChargeKeys(loaderData.chargeRecords);
  const balance = summarizeBalances(loaderData.balanceSnapshots);
  // Committed window: the remainder of the current pay period. Bills on the next payday are
  // funded by that paycheck, so the boundary is the first payday strictly after today.
  const nextPayday = hasPaySchedule ? getNextPaydayAfter(loaderData.paySchedule!, asOf) : null;
  const billsBeforePaydayCents = nextPayday
    ? getBillsBeforePayday(loaderData.userExpenses, asOf, nextPayday, paidChargeKeys).reduce((sum, bill) => sum + bill.amountCents, 0)
    : null;
  const billsThroughKey = nextPayday ? formatDateKey(new Date(nextPayday.getTime() - 86_400_000)) : null;
  const lastPayDate = hasPaySchedule ? getMostRecentPayDate(loaderData.paySchedule!, asOf) : null;
  const lastPayDateKey = lastPayDate ? formatDateKey(lastPayDate) : null;
  const paydaySinceLastCheck = Boolean(
    balance.oldestBalanceDate && lastPayDateKey && lastPayDateKey > balance.oldestBalanceDate
  );
  const annualGrossIncomeCents = (loaderData.userIncome?.annualGrossIncome ?? 0) * 100;
  const taxDeductionPercentage = loaderData.userIncome?.taxDeductionPercentage ?? 0;
  const { netRemainingYearly, netRemainingMonthly } = useIncomeCalculations(
    annualGrossIncomeCents,
    taxDeductionPercentage,
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
          <button type="button" onClick={openAddExpense} className="flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <PlusIcon className="h-5 w-5" /> Add Expense
          </button>
        </header>

        <FinanceSubnav />

        {feedback && <div role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite" className={`mb-6 flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${feedback.kind === "error" ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}><span>{feedback.message}</span><button type="button" onClick={() => setFeedback(null)} className="font-semibold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-current">Dismiss</button></div>}

        <ExpenseSummaryCards totalMonthlyCost={totalMonthlyCost} totalYearlyCost={totalYearlyCost} annualGrossIncomeCents={annualGrossIncomeCents} taxDeductionPercentage={taxDeductionPercentage} netRemainingMonthly={netRemainingMonthly} netRemainingYearly={netRemainingYearly} />

        {balance.totalBalanceCents !== 0 || balance.latestByAccount.size > 0 ? (
          <BalanceSummary
            totalBalanceCents={balance.totalBalanceCents}
            accountCount={balance.latestByAccount.size}
            daysSinceLastCheck={balance.oldestBalanceDate ? getDaysSince(balance.oldestBalanceDate, loaderData.asOfDate) : 0}
            billsBeforePaydayCents={billsBeforePaydayCents}
            billsThroughKey={billsThroughKey}
            remainingAfterBillsCents={billsBeforePaydayCents == null ? null : balance.totalBalanceCents - billsBeforePaydayCents}
            paydaySinceLastCheck={paydaySinceLastCheck}
            lastPayDateKey={lastPayDateKey}
          />
        ) : null}

        {hasPaySchedule ? <PaycheckCashFlow schedule={loaderData.paySchedule!} annualGrossIncome={loaderData.userIncome?.annualGrossIncome} taxDeductionPercentage={loaderData.userIncome?.taxDeductionPercentage} expenses={loaderData.userExpenses} asOfDate={loaderData.asOfDate} paymentAccounts={loaderData.paymentAccounts} chargeRecords={loaderData.chargeRecords} /> : <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4 sm:flex-row sm:items-center dark:border-gray-700 dark:bg-gray-800/70"><p className="text-sm text-gray-700 dark:text-gray-300">Add a primary pay schedule to plan bills by paycheck.</p><Link to="/finance/income" className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Set up pay schedule</Link></div>}

        <ExpensesCategoryFilter distinctCategories={distinctCategories} filterCategories={filterCategories} onToggleCategory={toggleCategory} onClearFilters={clearFilters} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} status={statusFilter} onStatusChange={setStatusFilter} sort={sort} onSortChange={setSort} />
        <ExpensesTable filteredExpenses={filteredExpenses} totalExpenseCount={loaderData.userExpenses.length} totalMonthlyCost={totalMonthlyCost} filteredMonthlyCost={filteredMonthlyCost} filteredYearlyCost={filteredYearlyCost} filteredActiveCount={filteredActiveCount} hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} onAddExpense={openAddExpense} fetcher={fetcher} paymentAccounts={loaderData.paymentAccounts} asOfDate={loaderData.asOfDate} chargeRecords={loaderData.chargeRecords} onEditExpense={(expense) => { setEditingExpense(expense); setIsModalOpen(false); setModalSubmissionPending(false); }} />
        <PaymentAccountsPanel accounts={loaderData.paymentAccounts} fetcher={fetcher} asOfDate={loaderData.asOfDate} balanceSnapshots={loaderData.balanceSnapshots} />
      </div>

      <AddExpenseModal isOpen={isModalOpen} distinctCategories={distinctCategories} paymentAccounts={loaderData.paymentAccounts} onClose={closeModals} fetcher={fetcher} submissionAttempted={modalSubmissionPending} onSubmit={() => setModalSubmissionPending(true)} />
      <EditExpenseModal expense={editingExpense} distinctCategories={distinctCategories} paymentAccounts={loaderData.paymentAccounts} onClose={closeModals} fetcher={fetcher} submissionAttempted={modalSubmissionPending} onSubmit={() => setModalSubmissionPending(true)} />
    </div>
  );
}
