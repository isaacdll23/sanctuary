import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ClockIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

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
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setIsExpanded(true);
      }
    };

    setIsMobileViewport(mediaQuery.matches);
    setIsExpanded(!mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
  const utilization =
    totalAvailableMinutes > 0
      ? Math.round((totalScheduledMinutes / totalAvailableMinutes) * 100)
      : 0;

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

  const insightsGrid = (
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
  );

  if (isMobileViewport) {
    return (
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-3.5 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Day Insights
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-100 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Details
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-150 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Progress
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {completionPercentage}%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/70">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Utilization
            </p>
            <p className={`mt-1 text-lg font-semibold ${utilizationStatus.color}`}>
              {utilization}%
            </p>
          </div>
        </div>

        {isExpanded && <div className="mt-4">{insightsGrid}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 md:p-5 mb-6">
      {insightsGrid}
    </div>
  );
}
