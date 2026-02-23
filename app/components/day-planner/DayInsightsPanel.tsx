import { ClockIcon, CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

type DayInsightsPanelProps = {
  tasks: Task[];
  viewStartTime: string;
  viewEndTime: string;
};

export default function DayInsightsPanel({
  tasks,
  viewStartTime,
  viewEndTime,
}: DayInsightsPanelProps) {
  const completedCount = tasks.filter((t) => t.completedAt).length;
  const totalCount = tasks.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate total scheduled time
  const totalScheduledMinutes = tasks.reduce(
    (sum, task) => sum + task.durationMinutes,
    0
  );

  // Calculate total available time
  const [startHour, startMin] = viewStartTime.split(":").map(Number);
  const [endHour, endMin] = viewEndTime.split(":").map(Number);
  const totalAvailableMinutes =
    endHour * 60 + endMin - (startHour * 60 + startMin);

  // Calculate free time
  const freeMinutes = totalAvailableMinutes - totalScheduledMinutes;
  const utilization = Math.round(
    ((totalScheduledMinutes / totalAvailableMinutes) * 100) | 0
  );

  // Format minutes to hours and minutes
  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  // Determine utilization status
  function getUtilizationStatus() {
    if (utilization >= 90) return { label: "Packed", color: "text-red-600 dark:text-red-400" };
    if (utilization >= 75) return { label: "Busy", color: "text-orange-600 dark:text-orange-400" };
    if (utilization >= 50) return { label: "Balanced", color: "text-blue-600 dark:text-blue-400" };
    return { label: "Relaxed", color: "text-green-600 dark:text-green-400" };
  }

  const utilizationStatus = getUtilizationStatus();

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 md:p-5 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completion Progress */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <CheckIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Progress
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completionPercentage}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount}/{totalCount}
            </span>
          </div>
          {totalCount > 0 && (
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gray-900 dark:bg-gray-800 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Scheduled Time */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <ClockIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Scheduled
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatTime(totalScheduledMinutes)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              of {formatTime(totalAvailableMinutes)}
            </span>
          </div>
        </div>

        {/* Free Time */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <SparklesIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Free Time
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatTime(Math.max(0, freeMinutes))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {freeMinutes < 0 ? "Over-scheduled" : "Available"}
          </div>
        </div>

        {/* Utilization Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="w-4 h-4 rounded-full border-2 border-gray-700 dark:border-gray-300" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Utilization
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${utilizationStatus.color}`}>
              {utilization}%
            </span>
            <span className={`text-xs font-medium ${utilizationStatus.color}`}>
              {utilizationStatus.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
