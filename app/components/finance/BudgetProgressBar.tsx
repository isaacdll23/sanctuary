interface BudgetProgressBarProps {
  total: number;
  spent: number;
}

export default function BudgetProgressBar({
  total,
  spent,
}: BudgetProgressBarProps) {
  const percent = Math.min(
    100,
    total > 0 ? Math.round((spent / total) * 100) : 0
  );
  let barColor = "bg-gray-400";
  if (percent > 90) barColor = "bg-gray-600";
  else if (percent > 75) barColor = "bg-gray-500";

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">
          Spent: ${spent.toFixed(2)}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          Budget: ${total.toFixed(2)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-2 ${barColor} transition-all duration-150 rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-600 dark:text-gray-400 mt-1">
        {percent}%
      </div>
    </div>
  );
}
