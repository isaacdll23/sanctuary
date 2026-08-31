import { WalletIcon } from "@heroicons/react/24/outline";
import { describeBalanceAge, formatSignedMoney } from "~/modules/finance/balances";

interface BalanceSummaryProps {
  totalBalanceCents: number;
  accountCount: number;
  daysSinceLastCheck: number;
  billsBeforePaydayCents: number | null;
  billsThroughKey: string | null;
  remainingAfterBillsCents: number | null;
  paydaySinceLastCheck: boolean;
  lastPayDateKey: string | null;
}

/** Headline committed-vs-available view; rendered only when at least one balance has been logged. */
export default function BalanceSummary({ totalBalanceCents, accountCount, daysSinceLastCheck, billsBeforePaydayCents, billsThroughKey, remainingAfterBillsCents, paydaySinceLastCheck, lastPayDateKey }: BalanceSummaryProps) {
  const hasPaydayWindow = billsBeforePaydayCents != null && remainingAfterBillsCents != null;
  return (
    <section aria-label="Balance check-in" className="mb-4 rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <WalletIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Balance check-in</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">{describeBalanceAge(daysSinceLastCheck)}</span>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/60">
          <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">Available balance</dt>
          <dd className={`mt-1 text-lg font-semibold ${totalBalanceCents < 0 ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}`}>{formatSignedMoney(totalBalanceCents)}</dd>
          <p className="text-xs text-gray-600 dark:text-gray-400">across {accountCount} account{accountCount === 1 ? "" : "s"}</p>
        </div>
        {hasPaydayWindow ? (
          <>
            <div className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/60">
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">Bills before payday</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{formatSignedMoney(billsBeforePaydayCents)}</dd>
              <p className="text-xs text-gray-600 dark:text-gray-400">scheduled through {billsThroughKey}</p>
            </div>
            <div className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/60">
              <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">Remaining after bills</dt>
              <dd className={`mt-1 text-lg font-semibold ${remainingAfterBillsCents < 0 ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}`}>{formatSignedMoney(remainingAfterBillsCents)}</dd>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700/60">
            <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">Committed</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">—</dd>
            <p className="text-xs text-gray-600 dark:text-gray-400">Add a pay schedule to see bills due</p>
          </div>
        )}
      </dl>
      {paydaySinceLastCheck && lastPayDateKey && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">You were paid on {lastPayDateKey} — log your new balance for an accurate view.</p>}
    </section>
  );
}
