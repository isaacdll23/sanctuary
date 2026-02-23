import { useFetcher } from "react-router";
import { XMarkIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  color?: string;
  completedAt: string | null;
};

type EditTaskModalProps = {
  task: Task;
  onClose: () => void;
  existingTasks?: Array<{ id: string; title: string; startTime: string; durationMinutes: number; completedAt: string | null }>;
};

export default function EditTaskModal({ task, onClose, existingTasks = [] }: EditTaskModalProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [startTime, setStartTime] = useState(
    task.startTime.substring(0, 5) // Remove seconds
  );
  const [durationMinutes, setDurationMinutes] = useState(task.durationMinutes);
  const [color, setColor] = useState(task.color || "indigo");
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Detect conflicts with existing tasks (excluding this task)
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictingTasks, setConflictingTasks] = useState<
    Array<{ title: string; startTime: string; durationMinutes: number }>
  >([]);

  // Reset state when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStartTime(task.startTime.substring(0, 5));
    setDurationMinutes(task.durationMinutes);
    setColor(task.color || "indigo");
    setLastSubmitTime(0);
  }, [task]);

  // Check for time conflicts
  useEffect(() => {
    function timeToMinutes(timeStr: string): number {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    }

    const newTaskStart = timeToMinutes(startTime);
    const newTaskEnd = newTaskStart + durationMinutes;

    const conflicts = existingTasks.filter((existingTask) => {
      // Skip this task and completed tasks in conflict detection
      if (existingTask.id === task.id || existingTask.completedAt) return false;

      const taskStart = timeToMinutes(existingTask.startTime);
      const taskEnd = taskStart + existingTask.durationMinutes;

      // Check for overlap
      return !(newTaskEnd <= taskStart || newTaskStart >= taskEnd);
    });

    setHasConflict(conflicts.length > 0);
    setConflictingTasks(
      conflicts.map((t) => ({
        title: t.title,
        startTime: t.startTime,
        durationMinutes: t.durationMinutes,
      }))
    );
  }, [startTime, durationMinutes, existingTasks, task.id]);

  // Handle successful submission
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true &&
      lastSubmitTime > 0
    ) {
      onClose();
      setLastSubmitTime(0);
    }
  }, [fetcher.state, fetcher.data, lastSubmitTime, onClose]);

  const colorOptions = [
    {
      name: "Indigo",
      value: "indigo",
      bg: "bg-indigo-500",
      border: "border-indigo-500",
    },
    {
      name: "Blue",
      value: "blue",
      bg: "bg-blue-500",
      border: "border-blue-500",
    },
    {
      name: "Purple",
      value: "purple",
      bg: "bg-purple-500",
      border: "border-purple-500",
    },
    {
      name: "Pink",
      value: "pink",
      bg: "bg-pink-500",
      border: "border-pink-500",
    },
    { name: "Red", value: "red", bg: "bg-red-500", border: "border-red-500" },
    {
      name: "Orange",
      value: "orange",
      bg: "bg-orange-500",
      border: "border-orange-500",
    },
    {
      name: "Amber",
      value: "amber",
      bg: "bg-amber-500",
      border: "border-amber-500",
    },
    {
      name: "Yellow",
      value: "yellow",
      bg: "bg-yellow-500",
      border: "border-yellow-500",
    },
    {
      name: "Lime",
      value: "lime",
      bg: "bg-lime-500",
      border: "border-lime-500",
    },
    {
      name: "Green",
      value: "green",
      bg: "bg-green-500",
      border: "border-green-500",
    },
    {
      name: "Emerald",
      value: "emerald",
      bg: "bg-emerald-500",
      border: "border-emerald-500",
    },
    {
      name: "Teal",
      value: "teal",
      bg: "bg-teal-500",
      border: "border-teal-500",
    },
    {
      name: "Cyan",
      value: "cyan",
      bg: "bg-cyan-500",
      border: "border-cyan-500",
    },
    { name: "Sky", value: "sky", bg: "bg-sky-500", border: "border-sky-500" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLastSubmitTime(Date.now());
    fetcher.submit(
      {
        intent: "updateTask",
        taskId: task.id,
        title,
        description,
        startTime: `${startTime}:00`,
        durationMinutes: durationMinutes.toString(),
        color,
      },
      { method: "post" }
    );
  }

  function handleDelete() {
    if (
      confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      setLastSubmitTime(Date.now());
      fetcher.submit(
        {
          intent: "deleteTask",
          taskId: task.id,
        },
        { method: "post" }
      );
    }
  }

  // Close modal after successful submission
  useEffect(() => {
    if (fetcher.data?.success) {
      onClose();
    }
  }, [fetcher.data, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What do you need to do?"
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm resize-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(parseInt(e.target.value, 10))
                }
                required
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Task Color
            </label>
            <div className="grid grid-cols-7 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`w-10 h-10 rounded-lg ${
                    colorOption.bg
                  } transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 dark:focus-visible:ring-offset-gray-800 dark:focus-visible:ring-gray-600 ${
                    color === colorOption.value
                      ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 dark:ring-gray-600 scale-110"
                      : "hover:scale-105"
                  }`}
                  title={colorOption.name}
                  aria-label={`Select ${colorOption.name}`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {fetcher.data && !fetcher.data.success && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-200">
                {fetcher.data.message}
              </p>
            </div>
          )}

          {/* Conflict Warning */}
          {hasConflict && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-200 mb-2">
                ⚠️ Time Conflict Detected
              </p>
              <div className="space-y-1 text-xs text-orange-600 dark:text-orange-300">
                {conflictingTasks.map((conflictTask, idx) => {
                  const [hours, minutes] = conflictTask.startTime.split(":").map(Number);
                  const ampm = hours >= 12 ? "PM" : "AM";
                  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                  const timeStr = `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`;
                  return (
                    <p key={idx}>
                      • <strong>{conflictTask.title}</strong> at {timeStr} ({conflictTask.durationMinutes}m)
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-300 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-200 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
          <div className="flex-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold text-sm rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              <CheckIcon className="w-4 h-4" />
              {fetcher.state === "submitting" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
