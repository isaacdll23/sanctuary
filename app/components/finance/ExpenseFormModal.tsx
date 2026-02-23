import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Expense {
  id: number;
  name: string;
  monthlyCost: number;
  chargeDay: number;
  category: string;
}

interface ExpenseFormModalProps {
  isAddModalOpen: boolean;
  isEditingExpense: Expense | null;
  distinctCategories: string[];
  onAddModalClose: () => void;
  onEditingExpenseClose: () => void;
  onLastSubmitTimeChange: (time: number) => void;
  lastSubmitTime: number;
}

export function AddExpenseModal({
  isOpen,
  distinctCategories,
  onClose,
  fetcher,
  onLastSubmitTimeChange,
  lastSubmitTime,
}: {
  isOpen: boolean;
  distinctCategories: string[];
  onClose: () => void;
  fetcher: any;
  onLastSubmitTimeChange: (time: number) => void;
  lastSubmitTime: number;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4"
      style={{
        paddingTop: "max(0.75rem, var(--safe-area-inset-top))",
        paddingBottom: "max(0.75rem, var(--safe-area-inset-bottom))",
      }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto transform transition-all duration-150">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Add New Expense
          </h2>
          <button
            onClick={() => {
              onClose();
              onLastSubmitTimeChange(0);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <fetcher.Form method="post" className="p-4 sm:p-6 space-y-4">
          <input type="hidden" name="_action" value="add" />

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Expense Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="e.g., Netflix, Rent, Groceries"
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label
              htmlFor="monthlyCost"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Monthly Cost
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                name="monthlyCost"
                id="monthlyCost"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="chargeDay"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Day of Month Charged
            </label>
            <input
              type="number"
              name="chargeDay"
              id="chargeDay"
              placeholder="1-31"
              min="1"
              max="31"
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
              required
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Enter the day of the month when this expense is charged.
            </p>
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Category
            </label>
            <input
              type="text"
              name="category"
              id="category"
              placeholder="e.g., Entertainment, Housing, Food"
              list="categories"
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
              required
            />
            <datalist id="categories">
              {distinctCategories
                .filter((cat): cat is string => cat !== null)
                .map((cat) => (
                  <option key={cat} value={cat} />
                ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Enter an existing category or create a new one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              onClick={() => onLastSubmitTimeChange(Date.now())}
              className="flex-1 inline-flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-700 text-white dark:text-gray-100 font-medium py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
            >
              {fetcher.state === "submitting" ? (
                <>
                  <ArrowPathIcon className="animate-spin w-4 h-4" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Add Expense
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLastSubmitTimeChange(0);
              }}
              className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}

export function EditExpenseModal({
  expense,
  distinctCategories,
  onClose,
  fetcher,
  onLastSubmitTimeChange,
  lastSubmitTime,
}: {
  expense: Expense | null;
  distinctCategories: string[];
  onClose: () => void;
  fetcher: any;
  onLastSubmitTimeChange: (time: number) => void;
  lastSubmitTime: number;
}) {
  if (!expense) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4"
      style={{
        paddingTop: "max(0.75rem, var(--safe-area-inset-top))",
        paddingBottom: "max(0.75rem, var(--safe-area-inset-bottom))",
      }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto transform transition-all duration-150">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Edit Expense
          </h2>
          <button
            onClick={() => {
              onClose();
              onLastSubmitTimeChange(0);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <fetcher.Form method="post" className="p-4 sm:p-6 space-y-4">
          <input type="hidden" name="_action" value="update" />
          <input type="hidden" name="id" value={expense.id} />

          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Expense Name
            </label>
            <input
              type="text"
              name="name"
              id="edit-name"
              defaultValue={expense.name}
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label
              htmlFor="edit-monthlyCost"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Monthly Cost
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                name="monthlyCost"
                id="edit-monthlyCost"
                defaultValue={(expense.monthlyCost / 100).toFixed(2)}
                className="w-full pl-8 pr-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-chargeDay"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Day of Month Charged
            </label>
            <input
              type="number"
              name="chargeDay"
              id="edit-chargeDay"
              defaultValue={expense.chargeDay}
              min="1"
              max="31"
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label
              htmlFor="edit-category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Category
            </label>
            <input
              type="text"
              name="category"
              id="edit-category"
              defaultValue={expense.category}
              list="edit-categories"
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
            />
            <datalist id="edit-categories">
              {distinctCategories
                .filter((cat): cat is string => cat !== null)
                .map((cat) => (
                  <option key={cat} value={cat} />
                ))}
            </datalist>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              onClick={() => onLastSubmitTimeChange(Date.now())}
              className="flex-1 inline-flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-700 text-white dark:text-gray-100 font-medium py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
            >
              {fetcher.state === "submitting" ? (
                <>
                  <ArrowPathIcon className="animate-spin w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <PencilIcon className="w-4 h-4" />
                  Update Expense
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLastSubmitTimeChange(0);
              }}
              className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
