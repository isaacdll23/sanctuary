import { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useFetcher } from "react-router";

type QuickAddTaskBarProps = {
  planId: string;
  onTaskAdded?: () => void;
};

export default function QuickAddTaskBar({
  planId,
  onTaskAdded,
}: QuickAddTaskBarProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [color, setColor] = useState("indigo");
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const colorPresets = [
    { name: "Indigo", value: "indigo", bg: "bg-indigo-500" },
    { name: "Blue", value: "blue", bg: "bg-blue-500" },
    { name: "Purple", value: "purple", bg: "bg-purple-500" },
    { name: "Green", value: "green", bg: "bg-green-500" },
    { name: "Red", value: "red", bg: "bg-red-500" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLastSubmitTime(Date.now());
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const startTime = `${hours}:${minutes}:00`;

    fetcher.submit(
      {
        intent: "createTask",
        planId,
        title: title.trim(),
        description: "",
        startTime,
        durationMinutes: durationMinutes.toString(),
        color,
      },
      { method: "post" }
    );

    // Reset form on success
    if (fetcher.data?.success) {
      setTitle("");
      setIsExpanded(false);
      setDurationMinutes(30);
      setColor("indigo");
      setLastSubmitTime(0);
      onTaskAdded?.();
    }
  }

  // Auto-close and reset on success
  if (fetcher.data?.success && lastSubmitTime > 0) {
    setTimeout(() => {
      setTitle("");
      setIsExpanded(false);
      setDurationMinutes(30);
      setColor("indigo");
      setLastSubmitTime(0);
    }, 300);
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Quick Input Row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex gap-2 items-center">
            <PlusIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Quick add task... (or click add task)"
              className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-0 py-2 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
            {title && (
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setIsExpanded(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={!title.trim() || fetcher.state === "submitting"}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium text-sm rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            {fetcher.state === "submitting" ? "Adding..." : "Add"}
          </button>
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Color
                </label>
                <div className="flex gap-1">
                  {colorPresets.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded transition-all ${
                        c.bg
                      } ${
                        color === c.value
                          ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 dark:ring-gray-600 scale-110"
                          : "hover:scale-105"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {fetcher.data && !fetcher.data.success && (
              <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded text-xs text-red-700 dark:text-red-200">
                {fetcher.data.message}
              </div>
            )}

            {/* Hint */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Click "Add Task" below to add description or adjust time
            </p>
          </div>
        )}

        {/* Success Message */}
        {fetcher.data?.success && (
          <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded text-xs text-green-700 dark:text-green-200 animate-in fade-in duration-200">
            ✓ Task created! Click the quick add field to add another.
          </div>
        )}
      </form>
    </div>
  );
}
