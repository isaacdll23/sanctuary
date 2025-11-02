import { useState, forwardRef } from "react";
import { useFetcher } from "react-router";
import TaskBlock from "./TaskBlock";
import { PlusIcon } from "@heroicons/react/24/outline";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  color?: string;
  completedAt: string | null;
};

type SyncStatus = {
  syncStatus: "synced" | "pending" | "conflict";
  conflictResolution: string | null;
  googleEventId: string;
};

type CalendarViewProps = {
  tasks: Task[];
  viewStartTime: string;
  viewEndTime: string;
  onAddTask: (startTime?: string) => void;
  onEditTask: (task: Task) => void;
  taskSyncStatus?: Record<string, SyncStatus>;
};

const CalendarView = forwardRef<HTMLDivElement, CalendarViewProps>(
  ({
    tasks,
    viewStartTime,
    viewEndTime,
    onAddTask,
    onEditTask,
    taskSyncStatus,
  }, ref) => {
  const moveFetcher = useFetcher();
  const [dragOverTime, setDragOverTime] = useState<number | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{
    top: number;
    hour: number;
    minutes: number;
  } | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  // Generate hour markers
  const startHour = parseInt(viewStartTime.split(":")[0], 10);
  const endHour = parseInt(viewEndTime.split(":")[0], 10);
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  // Calculate position for tasks
  function getTaskPosition(task: Task) {
    const [taskHour, taskMin] = task.startTime.split(":").map(Number);
    const taskMinutes = taskHour * 60 + taskMin;
    const startMinutes = startHour * 60;
    const relativeMinutes = taskMinutes - startMinutes;
    // Each hour = 120px
    const topPx = (relativeMinutes / 60) * 120;
    return topPx;
  }

  function formatHour(hour: number) {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${ampm}`;
  }

  function handleTimeSlotClick(hour: number) {
    const hourStr = String(hour).padStart(2, "0");
    onAddTask(`${hourStr}:00`);
  }

  function handleDragOver(e: React.DragEvent, hour: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverTime(hour);

    // Calculate snap preview position
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    // Convert pixel position to minutes (120px = 60 minutes)
    const exactMinutes = (relativeY / 120) * 60;

    // Snap to nearest 15-minute increment
    const snappedMinutes = Math.round(exactMinutes / 15) * 15;

    // Ensure minutes stay within 0-45 range
    const minutes = Math.min(Math.max(snappedMinutes, 0), 45);

    // Calculate top position in pixels
    const topPx = (minutes / 60) * 120;

    setDragPreviewPosition({ top: topPx, hour, minutes });
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    // Only clear if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverTime(null);
      setDragPreviewPosition(null);
    }
  }

  function handleDrop(e: React.DragEvent, hour: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTime(null);
    setDragPreviewPosition(null);
    setDraggedTask(null);

    const taskId = e.dataTransfer.getData("text/plain"); // Match the format from TaskBlock
    if (!taskId) return;

    // Calculate minutes from the drop position within the hour slot
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    // Convert pixel position to minutes (120px = 60 minutes)
    const exactMinutes = (relativeY / 120) * 60;

    // Snap to nearest 15-minute increment
    const snappedMinutes = Math.round(exactMinutes / 15) * 15;

    // Ensure minutes stay within 0-59 range
    const minutes = Math.min(Math.max(snappedMinutes, 0), 45);

    const newStartTime = `${String(hour).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:00`;

    moveFetcher.submit(
      {
        intent: "moveTask",
        taskId,
        newStartTime,
      },
      { method: "post" }
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-300 dark:border-gray-700 p-4 md:p-5 flex items-center justify-between bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Day Schedule
        </h3>
        <button
          type="button"
          onClick={() => onAddTask()}
          className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium text-sm py-2 px-3.5 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
        >
          <PlusIcon className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Calendar Grid */}
      <div ref={ref} className="relative max-h-[calc(100vh-400px)] md:max-h-[600px] overflow-y-auto bg-white dark:bg-gray-800">
        {/* Time ruler and grid */}
        <div className="flex">
          {/* Time labels - Sticky */}
          <div className="w-16 flex-shrink-0 border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky left-0 z-10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[120px] border-b border-gray-200 dark:border-gray-700 flex items-start justify-end pr-2 pt-2"
              >
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Task area */}
          <div className="flex-1 relative bg-white dark:bg-gray-800">
            {/* Background grid */}
            {hours.map((hour, idx) => (
              <div
                key={hour}
                onClick={() => handleTimeSlotClick(hour)}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, hour)}
                className={`h-[120px] border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors duration-150 ${
                  dragOverTime === hour
                    ? "bg-gray-100 dark:bg-gray-700/50"
                    : ""
                }`}
              >
                {/* 15-minute markers - Enhanced visibility */}
                <div className="h-[30px] border-b border-gray-100 dark:border-gray-700/50" />
                <div className="h-[30px] border-b border-gray-100 dark:border-gray-700/50" />
                <div className="h-[30px] border-b border-gray-100 dark:border-gray-700/50" />
                <div className="h-[30px]" />
              </div>
            ))}

            {/* Drag preview indicator - Enhanced */}
            {dragPreviewPosition && dragOverTime !== null && (
              <div
                className="absolute left-0 right-0 pointer-events-none transition-all duration-150"
                style={{
                  top: `${
                    (dragOverTime - startHour) * 120 + dragPreviewPosition.top
                  }px`,
                  height: draggedTask
                    ? `${(draggedTask.durationMinutes / 60) * 120}px`
                    : "30px",
                }}
              >
                <div className="mx-2 h-full border-2 border-dashed border-gray-400 dark:border-gray-500 bg-gray-100/50 dark:bg-gray-700/30 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {String(dragOverTime).padStart(2, "0")}:
                    {String(dragPreviewPosition.minutes).padStart(2, "0")}
                  </span>
                </div>
              </div>
            )}

            {/* Tasks overlay */}
            <div className="absolute inset-0 px-2 pointer-events-none">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="pointer-events-auto"
                  style={{
                    position: "absolute",
                    top: `${getTaskPosition(task)}px`,
                    left: "8px",
                    right: "8px",
                  }}
                >
                  <TaskBlock
                    task={task}
                    onEdit={onEditTask}
                    viewStartHour={startHour}
                    onDragStart={(task) => setDraggedTask(task)}
                    onDragEnd={() => setDraggedTask(null)}
                    syncStatus={taskSyncStatus?.[task.id]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
            <PlusIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No tasks scheduled yet.
          </p>
          <button
            type="button"
            onClick={() => onAddTask()}
            className="text-gray-900 dark:text-gray-100 font-semibold text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 rounded px-2 py-1"
          >
            Click here or on a time slot to add your first task
          </button>
        </div>
      )}
    </div>
  );
});

CalendarView.displayName = "CalendarView";

export default CalendarView;
