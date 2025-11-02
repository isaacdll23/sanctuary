import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import GoogleCalendarButton from "./GoogleCalendarButton";

type DayPlannerHeaderProps = {
  planDate: string;
  startTime: string;
  endTime: string;
  incrementMinutes: number;
  timeZone: string;
  onDateChange: (date: string) => void;
  googleCalendarConnected?: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
};

export default function DayPlannerHeader({
  planDate,
  startTime,
  endTime,
  incrementMinutes,
  timeZone,
  onDateChange,
  googleCalendarConnected = false,
  onManualSync,
  isSyncing = false,
}: DayPlannerHeaderProps) {
  const fetcher = useFetcher();
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const [localEndTime, setLocalEndTime] = useState(endTime);
  const [localIncrement, setLocalIncrement] = useState(incrementMinutes);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleIncrementChange(newIncrement: number) {
    if (newIncrement !== incrementMinutes) {
      setLocalIncrement(newIncrement);
      setShowConfirm(true);
    }
  }

  function confirmChanges() {
    fetcher.submit(
      {
        intent: "createOrUpdatePlan",
        planDate,
        startTime: localStartTime,
        endTime: localEndTime,
        incrementMinutes: localIncrement.toString(),
        timeZone,
      },
      { method: "post" }
    );
    setShowConfirm(false);
  }

  function cancelChanges() {
    setLocalStartTime(startTime);
    setLocalEndTime(endTime);
    setLocalIncrement(incrementMinutes);
    setShowConfirm(false);
  }

  // Get today's date in YYYY-MM-DD format
  function getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Day Planner
        </h1>
        <GoogleCalendarButton
          isConnected={googleCalendarConnected}
          onManualSync={onManualSync}
          isSyncing={isSyncing}
        />
      </div>

      {/* Date Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Plan Date
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={planDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => onDateChange(getTodayDate())}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={localEndTime}
            onChange={(e) => setLocalEndTime(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Increment Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Time Increment
        </label>
        <div className="flex gap-2">
          {[15, 30, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleIncrementChange(mins)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                localIncrement === mins
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-500"
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Update Plan Settings?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Changing the time range or increment will regenerate all time
              slots. Existing descriptions will be preserved where possible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmChanges}
                disabled={fetcher.state === "submitting"}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {fetcher.state === "submitting" ? "Updating..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={cancelChanges}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Changes Button for time range */}
      {(localStartTime !== startTime || localEndTime !== endTime) &&
        !showConfirm && (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Apply Changes
          </button>
        )}
    </div>
  );
}
