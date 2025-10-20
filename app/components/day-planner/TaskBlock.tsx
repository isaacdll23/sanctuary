import { useFetcher } from "react-router";
import { CheckIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

type TaskBlockProps = {
  task: Task;
  onEdit: (task: Task) => void;
  viewStartHour: number;
};

export default function TaskBlock({
  task,
  onEdit,
  viewStartHour,
}: TaskBlockProps) {
  const completeFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const moveFetcher = useFetcher();
  const [isDragging, setIsDragging] = useState(false);

  const isCompleted = !!task.completedAt;

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
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  return (
    <div
      className={`absolute left-0 right-0 rounded-lg border-2 px-2 py-1.5 cursor-move transition-all flex flex-col ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${
        isCompleted
          ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600"
          : "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600"
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
