import { useFetcher } from "react-router";
import { CheckIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  color?: string;
  completedAt: string | null;
};

type TaskBlockProps = {
  task: Task;
  onEdit: (task: Task) => void;
  viewStartHour: number;
  onDragStart?: (task: Task) => void;
  onDragEnd?: () => void;
};

export default function TaskBlock({
  task,
  onEdit,
  viewStartHour,
  onDragStart: onDragStartCallback,
  onDragEnd: onDragEndCallback,
}: TaskBlockProps) {
  const completeFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const moveFetcher = useFetcher();
  const [isDragging, setIsDragging] = useState(false);

  const isCompleted = !!task.completedAt;

  // Map color names to Tailwind classes
  function getColorClasses(colorName: string = "indigo") {
    const colorMap: Record<
      string,
      {
        bg: string;
        border: string;
        bgCompleted: string;
        borderCompleted: string;
      }
    > = {
      indigo: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        border: "border-indigo-400 dark:border-indigo-600",
        bgCompleted: "bg-indigo-200 dark:bg-indigo-900/50",
        borderCompleted: "border-indigo-500 dark:border-indigo-700",
      },
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-400 dark:border-blue-600",
        bgCompleted: "bg-blue-200 dark:bg-blue-900/50",
        borderCompleted: "border-blue-500 dark:border-blue-700",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        border: "border-purple-400 dark:border-purple-600",
        bgCompleted: "bg-purple-200 dark:bg-purple-900/50",
        borderCompleted: "border-purple-500 dark:border-purple-700",
      },
      pink: {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        border: "border-pink-400 dark:border-pink-600",
        bgCompleted: "bg-pink-200 dark:bg-pink-900/50",
        borderCompleted: "border-pink-500 dark:border-pink-700",
      },
      red: {
        bg: "bg-red-100 dark:bg-red-900/30",
        border: "border-red-400 dark:border-red-600",
        bgCompleted: "bg-red-200 dark:bg-red-900/50",
        borderCompleted: "border-red-500 dark:border-red-700",
      },
      orange: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-400 dark:border-orange-600",
        bgCompleted: "bg-orange-200 dark:bg-orange-900/50",
        borderCompleted: "border-orange-500 dark:border-orange-700",
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        border: "border-amber-400 dark:border-amber-600",
        bgCompleted: "bg-amber-200 dark:bg-amber-900/50",
        borderCompleted: "border-amber-500 dark:border-amber-700",
      },
      yellow: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        border: "border-yellow-400 dark:border-yellow-600",
        bgCompleted: "bg-yellow-200 dark:bg-yellow-900/50",
        borderCompleted: "border-yellow-500 dark:border-yellow-700",
      },
      lime: {
        bg: "bg-lime-100 dark:bg-lime-900/30",
        border: "border-lime-400 dark:border-lime-600",
        bgCompleted: "bg-lime-200 dark:bg-lime-900/50",
        borderCompleted: "border-lime-500 dark:border-lime-700",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-400 dark:border-green-600",
        bgCompleted: "bg-green-200 dark:bg-green-900/50",
        borderCompleted: "border-green-500 dark:border-green-700",
      },
      emerald: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        border: "border-emerald-400 dark:border-emerald-600",
        bgCompleted: "bg-emerald-200 dark:bg-emerald-900/50",
        borderCompleted: "border-emerald-500 dark:border-emerald-700",
      },
      teal: {
        bg: "bg-teal-100 dark:bg-teal-900/30",
        border: "border-teal-400 dark:border-teal-600",
        bgCompleted: "bg-teal-200 dark:bg-teal-900/50",
        borderCompleted: "border-teal-500 dark:border-teal-700",
      },
      cyan: {
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        border: "border-cyan-400 dark:border-cyan-600",
        bgCompleted: "bg-cyan-200 dark:bg-cyan-900/50",
        borderCompleted: "border-cyan-500 dark:border-cyan-700",
      },
      sky: {
        bg: "bg-sky-100 dark:bg-sky-900/30",
        border: "border-sky-400 dark:border-sky-600",
        bgCompleted: "bg-sky-200 dark:bg-sky-900/50",
        borderCompleted: "border-sky-500 dark:border-sky-700",
      },
    };
    return colorMap[colorName] || colorMap.indigo;
  }

  const colors = getColorClasses(task.color);

  function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    completeFetcher.submit(
      {
        intent: "toggleTaskComplete",
        taskId: task.id,
        completed: (!isCompleted).toString(),
      },
      { method: "post" }
    );
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteFetcher.submit(
        {
          intent: "deleteTask",
          taskId: task.id,
        },
        { method: "post" }
      );
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(task);
  }

  // Format time for display
  function formatTime(time: string) {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Calculate height based on duration (each hour = 120px)
  const heightPx = (task.durationMinutes / 60) * 120;

  function handleDragStart(e: React.DragEvent) {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", task.id); // Use text/plain for better compatibility
    e.dataTransfer.effectAllowed = "move";
    if (onDragStartCallback) {
      onDragStartCallback(task);
    }
  }

  function handleDragEnd() {
    setIsDragging(false);
    if (onDragEndCallback) {
      onDragEndCallback();
    }
  }

  return (
    <div
      className={`absolute left-0 right-0 rounded-lg border-2 px-2 py-1.5 cursor-move transition-all flex flex-col ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${
        isCompleted
          ? `${colors.bgCompleted} ${colors.borderCompleted}`
          : `${colors.bg} ${colors.border}`
      }`}
      style={{ height: `${heightPx}px` }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
            {task.title}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
            {formatTime(task.startTime)} • {task.durationMinutes}min
          </span>
        </div>
        <div className="flex gap-1 items-center flex-shrink-0">
          <button
            type="button"
            onClick={handleEdit}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border border-gray-400 dark:border-gray-500 hover:border-indigo-500 dark:hover:border-indigo-400 flex items-center justify-center transition-colors"
            aria-label="Edit task"
          >
            <PencilIcon className="w-2.5 h-2.5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={deleteFetcher.state === "submitting"}
            className="w-4 h-4 rounded border border-gray-400 dark:border-gray-500 hover:border-red-500 dark:hover:border-red-400 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Delete task"
          >
            <TrashIcon className="w-2.5 h-2.5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={handleToggleComplete}
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              isCompleted
                ? "bg-green-500 border-green-500"
                : "border-gray-400 dark:border-gray-500 hover:border-green-500"
            }`}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted && <CheckIcon className="w-2.5 h-2.5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
