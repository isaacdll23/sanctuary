import { useFetcher } from "react-router";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type AddTaskModalProps = {
  planId: string;
  onClose: () => void;
  defaultStartTime?: string;
};

export default function AddTaskModal({
  planId,
  onClose,
  defaultStartTime,
}: AddTaskModalProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(defaultStartTime || "09:00");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [color, setColor] = useState("indigo");

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
    fetcher.submit(
      {
        intent: "createTask",
        planId,
        title,
        description,
        startTime: `${startTime}:00`,
        durationMinutes: durationMinutes.toString(),
        color,
      },
      { method: "post" }
    );
  }

  // Close modal after successful submission
  if (fetcher.data?.success) {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Add New Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What do you need to do?"
              className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes) *
              </label>
              <select
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(parseInt(e.target.value, 10))
                }
                required
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  } transition-all ${
                    color === colorOption.value
                      ? "ring-4 ring-gray-400 dark:ring-gray-500 scale-110"
                      : "hover:scale-105"
                  }`}
                  title={colorOption.name}
                  aria-label={`Select ${colorOption.name}`}
                />
              ))}
            </div>
          </div>

          {fetcher.data && !fetcher.data.success && (
            <p className="text-red-400 text-sm">{fetcher.data.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {fetcher.state === "submitting" ? "Creating..." : "Create Task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
