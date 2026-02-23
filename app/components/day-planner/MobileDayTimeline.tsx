import { useMemo, useState } from "react";
import { useFetcher } from "react-router";
import {
  CheckIcon,
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import SyncStatusBadge from "./SyncStatusBadge";

interface Task {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
}

interface TaskSyncStatus {
  syncStatus: "synced" | "pending" | "conflict";
  conflictResolution: string | null;
  googleEventId: string;
}

interface MobileDayTimelineProps {
  tasks: Task[];
  viewStartTime: string;
  viewEndTime: string;
  taskSyncStatus: Record<string, TaskSyncStatus>;
  onAddTask: (startTime?: string) => void;
  onEditTask: (task: Task) => void;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatTaskRange(task: Task) {
  const startMinutes = toMinutes(task.startTime);
  const endMinutes = startMinutes + task.durationMinutes;
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;
  const endTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(
    2,
    "0"
  )}`;

  return `${formatTime(task.startTime)} - ${formatTime(endTime)}`;
}

export default function MobileDayTimeline({
  tasks,
  viewStartTime,
  viewEndTime,
  taskSyncStatus,
  onAddTask,
  onEditTask,
}: MobileDayTimelineProps) {
  const fetcher = useFetcher();
  const [showCompleted, setShowCompleted] = useState(false);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const timeDifference = toMinutes(a.startTime) - toMinutes(b.startTime);
        if (timeDifference !== 0) return timeDifference;
        return a.durationMinutes - b.durationMinutes;
      }),
    [tasks]
  );

  const openTasks = useMemo(
    () => sortedTasks.filter((task) => !task.completedAt),
    [sortedTasks]
  );
  const completedTasks = useMemo(
    () => sortedTasks.filter((task) => !!task.completedAt),
    [sortedTasks]
  );

  const quickHours = useMemo(() => {
    const startHour = parseInt(viewStartTime.split(":")[0], 10);
    const endHour = parseInt(viewEndTime.split(":")[0], 10);
    const result: string[] = [];

    for (let hour = startHour; hour <= endHour; hour += 2) {
      result.push(`${String(hour).padStart(2, "0")}:00`);
    }

    if (result.length === 0 || result[result.length - 1] !== `${String(endHour).padStart(2, "0")}:00`) {
      result.push(`${String(endHour).padStart(2, "0")}:00`);
    }

    return result;
  }, [viewStartTime, viewEndTime]);

  return (
    <div className="md:hidden">
      <div className="rounded-lg border border-gray-300 bg-white p-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Timeline
          </h3>
          <button
            type="button"
            onClick={() => onAddTask()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="mt-3 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
            {quickHours.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => onAddTask(time)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {openTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No tasks scheduled
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tap a time chip above to add your first task.
            </p>
          </div>
        ) : (
          openTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-lg border border-gray-300 bg-white p-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-900/60"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="min-w-0 text-left"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {formatTaskRange(task)} • {task.durationMinutes}m
                  </p>
                </button>

                <SyncStatusBadge
                  status={taskSyncStatus[task.id]?.syncStatus}
                  conflictResolution={taskSyncStatus[task.id]?.conflictResolution}
                  tooltipText={
                    taskSyncStatus[task.id]?.syncStatus === "synced"
                      ? "Synced with Google Calendar"
                      : taskSyncStatus[task.id]?.syncStatus === "pending"
                      ? "Sync in progress"
                      : taskSyncStatus[task.id]?.syncStatus === "conflict"
                      ? "Sync conflict detected"
                      : undefined
                  }
                />
              </div>

              {task.description && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-end gap-2">
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="toggleTaskComplete" />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="completed" value="true" />
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    aria-label="Mark complete"
                    title="Mark complete"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                </fetcher.Form>

                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Edit task"
                  title="Edit task"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>

                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="deleteTask" />
                  <input type="hidden" name="taskId" value={task.id} />
                  <button
                    type="submit"
                    onClick={(event) => {
                      if (!confirm("Are you sure you want to delete this task?")) {
                        event.preventDefault();
                      }
                    }}
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    aria-label="Delete task"
                    title="Delete task"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </fetcher.Form>
              </div>
            </article>
          ))
        )}
      </div>

      {completedTasks.length > 0 && (
        <section className="mt-4 rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            className="flex w-full items-center justify-between px-3.5 py-3 text-left"
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Completed ({completedTasks.length})
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-500 transition-transform ${
                showCompleted ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCompleted && (
            <div className="space-y-2 border-t border-gray-200 px-3.5 py-3 dark:border-gray-700">
              {completedTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="text-left min-w-0"
                    >
                      <p className="truncate text-sm font-medium text-gray-500 line-through dark:text-gray-400">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {formatTaskRange(task)}
                      </p>
                    </button>
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="toggleTaskComplete" />
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="completed" value="false" />
                      <button
                        type="submit"
                        className="inline-flex min-h-[36px] items-center rounded-md border border-gray-300 px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Reopen
                      </button>
                    </fetcher.Form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
