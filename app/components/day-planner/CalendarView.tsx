import { useState } from "react";
import { useFetcher } from "react-router";
import TaskBlock from "./TaskBlock";
import { PlusIcon } from "@heroicons/react/24/outline";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

type CalendarViewProps = {
  tasks: Task[];
  viewStartTime: string;
  viewEndTime: string;
  onAddTask: (startTime?: string) => void;
  onEditTask: (task: Task) => void;
};

export default function CalendarView({
  tasks,
  viewStartTime,
  viewEndTime,
  onAddTask,
  onEditTask,
}: CalendarViewProps) {
  const moveFetcher = useFetcher();
  const [dragOverTime, setDragOverTime] = useState<number | null>(null);
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
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    // Only clear if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverTime(null);
    }
  }

  function handleDrop(e: React.DragEvent, hour: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTime(null);

    const taskId = e.dataTransfer.getData("text/plain"); // Match the format from TaskBlock
    if (!taskId) return;

    // Calculate minutes from the drop position within the hour slot
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const minuteOffset = Math.round(((relativeY / 120) * 60) / 15) * 15; // Snap to 15-min increments
    const totalMinutes = minuteOffset;
    const minutes = totalMinutes % 60;

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
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-300 dark:border-gray-700 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Day Schedule
        </h3>
        <button
          type="button"
          onClick={() => onAddTask()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="relative max-h-[600px] overflow-y-auto">
        {/* Time ruler and grid */}
        <div className="flex">
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 border-r border-gray-300 dark:border-gray-700">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[120px] border-b border-gray-200 dark:border-gray-800 flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Task area */}
          <div className="flex-1 relative">
            {/* Background grid */}
            {hours.map((hour, idx) => (
              <div
                key={hour}
                onClick={() => handleTimeSlotClick(hour)}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, hour)}
                className={`h-[120px] border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                  dragOverTime === hour
                    ? "bg-indigo-100 dark:bg-indigo-900/20"
                    : ""
                }`}
              >
                {/* 15-minute markers */}
                <div className="h-[30px] border-b border-gray-100 dark:border-gray-900" />
                <div className="h-[30px] border-b border-gray-100 dark:border-gray-900" />
                <div className="h-[30px] border-b border-gray-100 dark:border-gray-900" />
                <div className="h-[30px]" />
              </div>
            ))}

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
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p className="mb-4">No tasks scheduled yet.</p>
          <button
            type="button"
            onClick={() => onAddTask()}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            Click here or on a time slot to add your first task
          </button>
        </div>
      )}
    </div>
  );
}
