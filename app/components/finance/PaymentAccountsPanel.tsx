import { CreditCardIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import type { FetcherWithComponents } from "react-router";
import type { ExpenseActionResult } from "~/types/expense";

export interface PaymentAccountOption {
  id: number;
  name: string;
}

export default function PaymentAccountsPanel({ accounts, fetcher }: { accounts: PaymentAccountOption[]; fetcher: FetcherWithComponents<ExpenseActionResult> }) {
  const addFormRef = useRef<HTMLFormElement>(null);
  const handledResultRef = useRef<ExpenseActionResult | undefined>(undefined);

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
            <ul className="flex flex-wrap gap-2" aria-label="Payment accounts">
              {accounts.map((account) => (
                <li key={account.id} className="inline-flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                  <span>{account.name}</span>
                  <fetcher.Form method="post" onSubmit={(event) => { if (!window.confirm(`Remove ${account.name}? Linked expenses will be left unassigned.`)) event.preventDefault(); }}>
                    <input type="hidden" name="_action" value="deletePaymentAccount" />
                    <input type="hidden" name="id" value={account.id} />
                    <button type="submit" disabled={fetcher.state !== "idle"} aria-label={`Remove ${account.name}`} className="rounded-full p-1 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 dark:hover:bg-gray-600 dark:focus:ring-gray-500">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </fetcher.Form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a checking account, card, or cash account to assign expenses.</p>
          )}
        </div>
        <fetcher.Form ref={addFormRef} method="post" className="flex gap-2">
          <input type="hidden" name="_action" value="addPaymentAccount" />
          <label className="sr-only" htmlFor="payment-account-name">New payment account</label>
          <input id="payment-account-name" name="name" required maxLength={255} placeholder="e.g., Visa ending 1234" className="min-w-0 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-gray-600" />
          <button type="submit" disabled={fetcher.state !== "idle"} className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600">
            <PlusIcon className="h-4 w-4" />Add
          </button>
        </fetcher.Form>
      </div>
    </details>
  );
}
