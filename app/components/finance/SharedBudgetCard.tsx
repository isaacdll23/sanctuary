import { Link } from "react-router";
import BudgetProgressBar from "./BudgetProgressBar";

interface SharedBudgetCardProps {
  id: string | number;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  period: string;
  members: Array<{
    id: string | number;
    name: string;
    role: string;
    email?: string;
  }>;
  currentUserId: string | number;
  role: string;
}

export default function SharedBudgetCard({
  id,
  name,
  description,
  totalAmount,
  spentAmount,
  period,
  members,
  currentUserId,
  role,
}: SharedBudgetCardProps) {
  const remainingAmount = totalAmount - spentAmount;
  const percentUsed =
    totalAmount > 0 ? Math.round((spentAmount / totalAmount) * 100) : 0;

  return (
    <Link
      to={`/finance/budgets/shared/${id}`}
      className="block bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow hover:shadow-lg transition-all p-5 mb-4"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {name}
          </h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-bold ml-3 ${
            role === "owner"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      </div>

      {/* Budget Stats */}
      <div className="grid grid-cols-3 gap-4 mb-3 text-center">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${totalAmount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Spent</div>
          <div className="text-sm font-semibold text-red-500">
            ${spentAmount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Remaining
          </div>
          <div className="text-sm font-semibold text-green-500">
            ${remainingAmount.toLocaleString()}
          </div>
        </div>
      </div>

      <BudgetProgressBar total={totalAmount} spent={spentAmount} />

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {period}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {percentUsed}% used
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            {members.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200 border-2 border-white dark:border-gray-900"
                title={m.name || m.email}
              >
                {m.name
                  ? m.name[0].toUpperCase()
                  : m.email
                  ? m.email[0].toUpperCase()
                  : "?"}
              </div>
            ))}
          </div>
          {members.length > 3 && (
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              +{members.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
