import { useFetcher } from "react-router";
import { CheckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

type TimeSlotCardProps = {
  section: {
    id: string;
    startTime: string;
    endTime: string;
    description: string | null;
    completedAt: string | null;
  };
};

export default function TimeSlotCard({ section }: TimeSlotCardProps) {
  const updateFetcher = useFetcher();
  const completeFetcher = useFetcher();
  const moveFetcher = useFetcher();
  const [description, setDescription] = useState(section.description || "");
  const [isCompleted, setIsCompleted] = useState(!!section.completedAt);

  // Debounced save for description
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (description !== (section.description || "")) {
        updateFetcher.submit(
          {
            intent: "updateSection",
            sectionId: section.id,
            description,
          },
          { method: "post" }
        );
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line
  }, [description]);

  function handleToggleComplete() {
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    completeFetcher.submit(
      {
        intent: "toggleSectionComplete",
        sectionId: section.id,
        completed: newCompleted.toString(),
      },
      { method: "post" }
    );
  }

  function handleMoveToNextDay() {
    moveFetcher.submit(
      {
        intent: "moveSectionToNextDay",
        sectionId: section.id,
      },
      { method: "post" }
    );
  }

  // Format time for display (e.g., "09:00:00" -> "9:00 AM")
  function formatTime(time: string) {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isCompleted
          ? "bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 opacity-70"
          : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
              isCompleted
                ? "bg-green-500 border-green-500"
                : "border-gray-300 dark:border-gray-600 hover:border-green-500"
            }`}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
          </button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatTime(section.startTime)} - {formatTime(section.endTime)}
          </span>
        </div>
        {!isCompleted && description && (
          <button
            type="button"
            onClick={handleMoveToNextDay}
            disabled={moveFetcher.state === "submitting"}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
            title="Move to next day"
          >
            <ArrowRightIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Next Day</span>
          </button>
        )}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What will you do during this time?"
        className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded p-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
        rows={2}
        disabled={updateFetcher.state === "submitting"}
      />
      {updateFetcher.state === "submitting" && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Saving...
        </span>
      )}
    </div>
  );
}
