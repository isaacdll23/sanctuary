import { CheckCircleIcon, CheckIcon } from "@heroicons/react/24/outline";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

type SyncStatus = {
  syncStatus: "synced" | "pending" | "conflict";
  conflictResolution: string | null;
  googleEventId: string;
};

type TaskPreviewTooltipProps = {
  task: Task;
  syncStatus?: SyncStatus;
};

export default function TaskPreviewTooltip({
  task,
  syncStatus,
}: TaskPreviewTooltipProps) {
  const isCompleted = !!task.completedAt;

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  function calculateEndTime(
    startTime: string,
    durationMinutes: number
  ): string {
    const [hours, minutes] = startTime.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const ampm = endHours >= 12 ? "PM" : "AM";
    const displayHour = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
    return `${displayHour}:${String(endMinutes).padStart(2, "0")} ${ampm}`;
  }

  const endTime = calculateEndTime(task.startTime, task.durationMinutes);

  return (
    <div className="pointer-events-none group relative">
      {/* Tooltip */}
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64">
        <div className="bg-gray-900 dark:bg-gray-950 text-white dark:text-gray-100 rounded-lg shadow-lg p-3 space-y-2">
          {/* Title and Status */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p
                className={`font-semibold text-sm ${
                  isCompleted ? "line-through text-gray-400 dark:text-gray-500" : ""
                }`}
              >
                {task.title}
              </p>
            </div>
            {isCompleted && (
              <div className="flex-shrink-0">
                <CheckIcon className="w-4 h-4 text-green-400" />
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-300 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Time Info */}
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
            <p>
              <span className="font-medium text-gray-300 dark:text-gray-400">Time:</span>{" "}
              {formatTime(task.startTime)} → {endTime}
            </p>
            <p>
              <span className="font-medium text-gray-300 dark:text-gray-400">
                Duration:
              </span>{" "}
              {task.durationMinutes < 60
                ? `${task.durationMinutes}m`
                : `${Math.floor(task.durationMinutes / 60)}h ${
                    task.durationMinutes % 60
                  }m`}
            </p>
          </div>

          {/* Sync Status */}
          {syncStatus && (
            <div className="pt-1.5 border-t border-gray-700 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircleIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-400 dark:text-gray-500">
                  {syncStatus.syncStatus === "synced"
                    ? "Synced with Google Calendar"
                    : syncStatus.syncStatus === "pending"
                    ? "Sync in progress..."
                    : "Sync conflict"}
                </span>
              </div>
            </div>
          )}

          {/* Chevron indicator */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="h-2 w-2 bg-gray-900 dark:bg-gray-950 transform rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
