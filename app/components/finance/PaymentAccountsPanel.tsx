import { CreditCardIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import type { FetcherWithComponents } from "react-router";
import type { AccountBalanceSnapshot, ExpenseActionResult } from "~/types/expense";
import { describeBalanceAge, formatSignedMoney, getDaysSince, getLatestBalanceByAccount } from "~/modules/finance/balances";

export interface PaymentAccountOption {
  id: number;
  name: string;
}

interface PaymentAccountsPanelProps {
  accounts: PaymentAccountOption[];
  fetcher: FetcherWithComponents<ExpenseActionResult>;
  asOfDate: string;
  balanceSnapshots: AccountBalanceSnapshot[];
}

export default function PaymentAccountsPanel({ accounts, fetcher, asOfDate, balanceSnapshots }: PaymentAccountsPanelProps) {
  const addFormRef = useRef<HTMLFormElement>(null);
  const handledResultRef = useRef<ExpenseActionResult | undefined>(undefined);
  const latestByAccount = getLatestBalanceByAccount(balanceSnapshots);
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state !== "idle" || fetcher.data === handledResultRef.current) return;
    handledResultRef.current = fetcher.data;
    if (fetcher.data?.ok && fetcher.data.action === "addPaymentAccount") addFormRef.current?.reset();
  }, [fetcher.data, fetcher.state]);

  return (
    <details className="mb-4 rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-100 dark:focus:ring-gray-600">
        <CreditCardIcon className="h-5 w-5" />
        Payment accounts
        <span className="font-normal text-gray-600 dark:text-gray-400">({accounts.length})</span>
      </summary>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          {accounts.length ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700/60" aria-label="Payment accounts">
              {accounts.map((account) => {
                const latest = latestByAccount.get(account.id);
                return (
                  <li key={account.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</span>
                    {latest && <span className={`text-sm font-semibold ${latest.balanceCents < 0 ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}`}>{formatSignedMoney(latest.balanceCents)}</span>}
                    {latest && <span className="text-xs text-gray-600 dark:text-gray-400">{describeBalanceAge(getDaysSince(latest.balanceDate, asOfDate))}</span>}
                    <fetcher.Form method="post" className="ml-auto flex items-center gap-1">
                      <input type="hidden" name="_action" value="logBalance" />
                      <input type="hidden" name="accountId" value={account.id} />
                      <input type="hidden" name="balanceDate" value={asOfDate} />
                      <label className="sr-only" htmlFor={`balance-${account.id}`}>Current balance for {account.name} on {asOfDate}</label>
                      <input
                        id={`balance-${account.id}`}
                        name="balance"
                        type="number"
                        step="0.01"
                        required
                        placeholder={latest ? (latest.balanceCents / 100).toFixed(2) : "e.g., 1250.50"}
                        defaultValue={latest ? (latest.balanceCents / 100).toFixed(2) : undefined}
                        key={`${account.id}-${latest?.balanceCents ?? "none"}-${latest?.balanceDate ?? "none"}`}
                        disabled={isSubmitting}
                        className="w-28 min-w-0 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-gray-600"
                      />
                      <button type="submit" disabled={isSubmitting} className="inline-flex min-h-[40px] items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                        Log
                      </button>
                    </fetcher.Form>
                    <fetcher.Form method="post" onSubmit={(event) => { if (!window.confirm(`Remove ${account.name}? Linked expenses will be left unassigned.`)) event.preventDefault(); }}>
                      <input type="hidden" name="_action" value="deletePaymentAccount" />
                      <input type="hidden" name="id" value={account.id} />
                      <button type="submit" disabled={isSubmitting} aria-label={`Remove ${account.name}`} className="rounded-full p-1.5 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 dark:hover:bg-gray-600 dark:focus:ring-gray-500">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </fetcher.Form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a checking account, card, or cash account to assign expenses and log balances.</p>
          )}
        </div>
        <fetcher.Form ref={addFormRef} method="post" className="flex gap-2">
          <input type="hidden" name="_action" value="addPaymentAccount" />
          <label className="sr-only" htmlFor="payment-account-name">New payment account</label>
          <input id="payment-account-name" name="name" required maxLength={255} placeholder="e.g., Visa ending 1234" className="min-w-0 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-gray-600" />
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
            <PlusIcon className="h-4 w-4" />Add
          </button>
        </fetcher.Form>
      </div>
      {accounts.length > 0 && <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">Log a balance around each payday to keep the committed-vs-available view accurate. Same-day entries replace the earlier value.</p>}
    </details>
  );
}
