import { CalendarIcon } from "@heroicons/react/24/outline";

interface EmptyPlanStateProps {
  planDate: string;
  onCreatePlan: () => void;
  isLoading?: boolean;
}

export default function EmptyPlanState({
  planDate,
  onCreatePlan,
  isLoading = false,
}: EmptyPlanStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
        <CalendarIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        No Plan for {planDate}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Create a day plan to start scheduling your tasks visually on a calendar.
        You can drag and drop tasks to reorganize them.
      </p>

      <button
        type="button"
        onClick={onCreatePlan}
        disabled={isLoading}
        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 shadow-md hover:shadow-lg"
      >
        <CalendarIcon className="w-5 h-5" />
        {isLoading ? "Creating Plan..." : "Create Day Plan"}
      </button>
    </div>
  );
}
