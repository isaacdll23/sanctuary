import { useEffect, useId, useRef } from "react";
import type { FormEvent, ReactNode } from "react";
import type { FetcherWithComponents } from "react-router";
import { ArrowPathIcon, PencilIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Expense, ExpenseActionResult, ExpenseFormErrors } from "~/types/expense";

type ModalProps = {
  distinctCategories: string[];
  onClose: () => void;
  fetcher: FetcherWithComponents<ExpenseActionResult>;
  submissionAttempted: boolean;
  onSubmit: () => void;
};

export function AddExpenseModal({ isOpen, ...props }: ModalProps & { isOpen: boolean }) {
  if (!isOpen) return null;
  return <ExpenseModal title="Add New Expense" submitLabel="Add Expense" action="add" {...props} />;
}

export function EditExpenseModal({ expense, ...props }: ModalProps & { expense: Expense | null }) {
  if (!expense) return null;
  return <ExpenseModal title="Edit Expense" submitLabel="Update Expense" action="update" expense={expense} {...props} />;
}

function ExpenseModal({ title, submitLabel, action, expense, distinctCategories, onClose, fetcher, submissionAttempted, onSubmit }: ModalProps & {
  title: string;
  submitLabel: string;
  action: "add" | "update";
  expense?: Expense;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const categoryListId = useId();
  const errors = submissionAttempted && fetcher.data && !fetcher.data.ok ? fetcher.data : undefined;

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    initialFocusRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const fieldError = (name: keyof ExpenseFormErrors) => errors?.fieldErrors?.[name];
  const inputClass = (name: keyof ExpenseFormErrors) =>
    `w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-gray-100 ${fieldError(name) ? "border-red-500 focus:ring-red-400 dark:border-red-400" : "border-gray-300 focus:ring-gray-400 dark:border-gray-600 dark:focus:ring-gray-600"}`;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (event.currentTarget.checkValidity()) onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} style={{ paddingTop: "max(0.75rem, var(--safe-area-inset-top))", paddingBottom: "max(0.75rem, var(--safe-area-inset-bottom))" }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-300 p-4 sm:p-6 dark:border-gray-700">
          <h2 id={titleId} className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close expense form"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <fetcher.Form method="post" className="space-y-4 p-4 sm:p-6" onSubmit={submit}>
          <input type="hidden" name="_action" value={action} />
          {expense && <input type="hidden" name="id" value={expense.id} />}
          {errors && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{errors.error}</p>}
          <Field id="expense-name" label="Expense Name" error={fieldError("name")}>
            <input ref={initialFocusRef} id="expense-name" type="text" name="name" defaultValue={expense?.name} maxLength={255} required aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "expense-name-error" : undefined} className={inputClass("name")} placeholder="e.g., Netflix, Rent, Groceries" />
          </Field>
          <Field id="expense-monthly-cost" label="Monthly Cost" error={fieldError("monthlyCost")}>
            <div className="relative"><span aria-hidden="true" className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">$</span><input id="expense-monthly-cost" type="number" name="monthlyCost" defaultValue={expense ? (expense.monthlyCost / 100).toFixed(2) : undefined} min="0.01" step="0.01" inputMode="decimal" required aria-invalid={Boolean(fieldError("monthlyCost"))} aria-describedby={fieldError("monthlyCost") ? "expense-monthly-cost-error" : undefined} className={`${inputClass("monthlyCost")} pl-8`} placeholder="0.00" /></div>
          </Field>
          <Field id="expense-charge-day" label="Day of Month Charged" error={fieldError("chargeDay")} help="Enter the day of the month when this expense is charged.">
            <input id="expense-charge-day" type="number" name="chargeDay" defaultValue={expense?.chargeDay} min="1" max="31" step="1" required aria-invalid={Boolean(fieldError("chargeDay"))} aria-describedby={fieldError("chargeDay") ? "expense-charge-day-error" : "expense-charge-day-help"} className={inputClass("chargeDay")} placeholder="1–31" />
          </Field>
          <Field id="expense-category" label="Category" error={fieldError("category")} help="Existing categories are suggested; names are normalized when saved.">
            <input id="expense-category" type="text" name="category" defaultValue={expense?.category} list={categoryListId} maxLength={255} required aria-invalid={Boolean(fieldError("category"))} aria-describedby={fieldError("category") ? "expense-category-error" : "expense-category-help"} className={inputClass("category")} placeholder="e.g., Entertainment, Housing, Food" />
            <datalist id={categoryListId}>{distinctCategories.map((category) => <option key={category} value={category} />)}</datalist>
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"><input type="checkbox" name="isActive" value="1" defaultChecked={expense ? expense.isActive !== 0 : true} className="rounded text-gray-900 focus:ring-2 focus:ring-gray-400" /><span><span className="font-medium">Include in totals</span><span className="block text-xs text-gray-600 dark:text-gray-400">Turn this off to pause the expense without deleting it.</span></span></label>
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button type="submit" disabled={fetcher.state === "submitting"} className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
              {fetcher.state === "submitting" ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving...</> : action === "add" ? <><PlusIcon className="h-4 w-4" /> {submitLabel}</> : <><PencilIcon className="h-4 w-4" /> {submitLabel}</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600">Cancel</button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}

function Field({ id, label, error, help, children }: { id: string; label: string; error?: string; help?: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>{children}{error ? <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p> : help ? <p id={`${id}-help`} className="mt-1 text-xs text-gray-600 dark:text-gray-400">{help}</p> : null}</div>;
}
