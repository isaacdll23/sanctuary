import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

type QuickUpcomingTasksSidebarProps = {
  allTasks: Task[];
  currentDate: string;
};

export default function QuickUpcomingTasksSidebar({
  allTasks,
  currentDate,
}: QuickUpcomingTasksSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get tasks for the next 7 days (including today)
  function getUpcomingTasks() {
    const upcoming: { date: string; tasks: Task[] }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      // In a real app, you'd fetch tasks for each date
      // For now, we'll just show the structure
      upcoming.push({
        date: dateStr,
        tasks: i === 0 ? allTasks : [],
      });
    }

    return upcoming;
  }

  const upcomingTasks = getUpcomingTasks();
  const today = new Date(currentDate);
  const todayStr = today.toISOString().split("T")[0];

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const isToday = dateStr === todayStr;
    if (isToday) return "Today";

    const tomorrow = new Date(todayStr);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    if (dateStr === tomorrowStr) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  const hasUpcomingTasks = upcomingTasks.some((day) => day.tasks.length > 0);

  return (
    <div className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Next 7 Days
        </h3>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto max-h-96">
          {hasUpcomingTasks ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingTasks.map((day) =>
                day.tasks.length > 0 ? (
                  <div key={day.date} className="p-3">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      {formatDate(day.date)}
                    </h4>
                    <div className="space-y-1.5">
                      {day.tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {formatTime(task.startTime)} • {task.durationMinutes}m
                              </p>
                            </div>
                            {task.completedAt && (
                              <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-500 dark:border-green-600 flex-shrink-0 flex items-center justify-center mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {day.tasks.length > 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          +{day.tasks.length - 5} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div className="p-6 text-center flex flex-col items-center justify-center h-48">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tasks scheduled for the next 7 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
