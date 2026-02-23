import { useState } from "react";
import { useFetcher } from "react-router";

const categories = [
  "Groceries",
  "Utilities",
  "Rent",
  "Dining",
  "Transport",
  "Entertainment",
  "Other",
];

interface BudgetTransactionFormProps {
  budgetId: string | number;
  memberName: string;
  onSuccess?: () => void;
}

export default function BudgetTransactionForm({
  budgetId,
  memberName,
  onSuccess,
}: BudgetTransactionFormProps) {
  const fetcher = useFetcher();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <fetcher.Form
      method="post"
      className="space-y-3"
      onSubmit={() => onSuccess && onSuccess()}
    >
      <input type="hidden" name="intent" value="addTransaction" />
      <input type="hidden" name="budgetId" value={budgetId} />
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1">
          Amount
        </label>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <input
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <input
          name="transactionDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Added by: {memberName}
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-semibold transition disabled:opacity-50"
        disabled={fetcher.state === "submitting"}
      >
        {fetcher.state === "submitting" ? "Adding..." : "Add Transaction"}
      </button>
    </fetcher.Form>
  );
}
