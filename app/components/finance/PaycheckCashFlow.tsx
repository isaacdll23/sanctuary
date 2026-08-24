import { BanknotesIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { Expense } from "~/types/expense";
import type { PaymentAccountOption } from "~/components/finance/PaymentAccountsPanel";
import { formatDateKey, parseDateKey } from "~/modules/finance/recurrence";
import { getExpectedPaycheckCents, getPayDatesAfter, getScheduledBillsInPayPeriod, type PrimaryPaySchedule } from "~/modules/finance/paySchedule";

export default function PaycheckCashFlow({ schedule, annualGrossIncome, taxDeductionPercentage, expenses, asOfDate, paymentAccounts }: { schedule: PrimaryPaySchedule; annualGrossIncome?: number; taxDeductionPercentage?: number; expenses: Expense[]; asOfDate: string; paymentAccounts: PaymentAccountOption[] }) {
  const payDates = getPayDatesAfter(schedule, parseDateKey(asOfDate), 3);
  const expected = getExpectedPaycheckCents(schedule, annualGrossIncome, taxDeductionPercentage);
  const beforePayday = getScheduledBillsInPayPeriod(expenses, parseDateKey(asOfDate), payDates[0]);
  const beforePaydayTotal = beforePayday.reduce((sum, bill) => sum + bill.amountCents, 0);
  const accountName = schedule.depositAccountId ? paymentAccounts.find((account) => account.id === schedule.depositAccountId)?.name : undefined;

  return <section className="mb-8" aria-label="Paycheck cash flow"><div className="mb-4 rounded-xl border border-gray-300 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="flex items-center gap-2"><BanknotesIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" /><div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Next payday: {formatDateKey(payDates[0])}</h2><p className="text-sm text-gray-600 dark:text-gray-400">Expected deposit ${formatMoney(expected.amountCents)}{expected.isEstimate ? " (estimate)" : ""}{accountName ? ` to ${accountName}` : ""}</p></div></div><p className="text-sm text-gray-600 dark:text-gray-400">{beforePayday.length} bill{beforePayday.length === 1 ? "" : "s"} · ${formatMoney(beforePaydayTotal)} due before payday</p></div></div>
    <div className="grid gap-4 lg:grid-cols-2">{payDates.slice(0, 2).map((payDate, index) => <PayPeriod key={formatDateKey(payDate)} payDate={payDate} nextPayDate={payDates[index + 1]} expected={expected} expenses={expenses} />)}</div>
  </section>;
}

function PayPeriod({ payDate, nextPayDate, expected, expenses }: { payDate: Date; nextPayDate: Date; expected: { amountCents: number; isEstimate: boolean }; expenses: Expense[] }) {
  const bills = getScheduledBillsInPayPeriod(expenses, payDate, nextPayDate);
  const total = bills.reduce((sum, bill) => sum + bill.amountCents, 0);
  const remaining = expected.amountCents - total;
  const committed = expected.amountCents ? (total / expected.amountCents) * 100 : null;
  return <article className="rounded-xl border border-gray-300 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-gray-900 dark:text-gray-100">Pay period starting {formatDateKey(payDate)}</h3><p className="text-sm text-gray-600 dark:text-gray-400">Through {formatDateKey(new Date(nextPayDate.getTime() - 86_400_000))}</p></div><span className="text-right text-sm font-semibold text-gray-900 dark:text-gray-100">${formatMoney(expected.amountCents)}{expected.isEstimate && <span className="block text-xs font-normal text-gray-600 dark:text-gray-400">estimate</span>}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-sm"><Metric label="Bills" value={`$${formatMoney(total)}`} /><Metric label="Committed" value={committed == null ? "—" : `${committed.toFixed(0)}%`} /><Metric label="Remaining" value={`$${formatMoney(remaining)}`} negative={remaining < 0} /></div>{remaining < 0 && <p role="alert" className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"><ExclamationTriangleIcon className="h-5 w-5 shrink-0" />Scheduled bills exceed this paycheck by ${formatMoney(Math.abs(remaining))}.</p>}<ul className="mt-4 divide-y divide-gray-200 text-sm dark:divide-gray-700">{bills.length ? bills.map((bill) => <li key={`${bill.expenseId}-${bill.chargeDate}`} className="flex justify-between gap-3 py-2 text-gray-700 dark:text-gray-300"><span>{bill.chargeDate} · {bill.name}</span><span className="font-medium">${formatMoney(bill.amountCents)}</span></li>) : <li className="py-2 text-gray-600 dark:text-gray-400">No scheduled bills in this period.</li>}</ul></article>;
}
function Metric({ label, value, negative }: { label: string; value: string; negative?: boolean }) { return <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700/60"><p className="text-xs text-gray-600 dark:text-gray-400">{label}</p><p className={`font-semibold ${negative ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}`}>{value}</p></div>; }
function formatMoney(cents: number) { return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
