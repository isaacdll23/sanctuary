import { useState } from "react";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { useFetcher } from "react-router";
import TaskModal from "~/components/tasks/TaskModal";
import ProgressBar from "./ProgressBar";
import {
  CalendarDaysIcon,
  TagIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface TaskItemProps {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: (typeof taskStepsTable.$inferSelect)[];
  distinctCategories: string[];
  isCompactView?: boolean;
  onSelect?: (task: typeof tasksTable.$inferSelect) => void;
}

export default function TaskItem({
  task,
  taskSteps,
  distinctCategories,
  isCompactView,
  onSelect,
}: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetcher = useFetcher();

  const totalSteps = taskSteps ? taskSteps.length : 0;
  const completedSteps = taskSteps
    ? taskSteps.filter((step) => step.completedAt !== null).length
    : 0;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  let progressColor = "bg-red-500";
  if (progressPercentage >= 80) {
    progressColor = "bg-green-500";
  } else if (progressPercentage >= 50) {
    progressColor = "bg-yellow-500";
  }

  return (
    <>
      <li
        onClick={() => onSelect?.(task) || setIsModalOpen(true)}
        className={`
          bg-white/90 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg 
          transition-all duration-300 ease-in-out cursor-pointer group
          hover:border-purple-500/70 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-[1.02]
          ${task.completedAt ? "opacity-60 hover:opacity-80" : ""}
          ${isCompactView ? "p-3 md:p-4" : "p-5 md:p-6"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Task Header: Title and Category */}
          <div className={`${isCompactView ? "mb-2" : "mb-3"}`}>
            <h3
              className={`font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-400 transition-colors duration-300 truncate ${
                isCompactView ? "text-base sm:text-lg" : "text-lg sm:text-xl"
              }`}
            >
              {task.title}
            </h3>
            {task.category && !isCompactView && (
              <div className="flex items-center text-xs text-purple-400 group-hover:text-purple-300 mt-1">
                <TagIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{task.category}</span>
              </div>
            )}
          </div>
          {/* Task Description (truncated) */}
          {task.description && !isCompactView && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {task.description}
            </p>
          )}
          {/* Spacer to push content below to the bottom if description is short */}
          {!task.description && !isCompactView && <div className="mb-4"></div>}
          {/* Progress Bar (if applicable) */}
          {totalSteps > 0 && (
            <div className={`${isCompactView ? "mb-2" : "mb-4"}`}>
              <ProgressBar
                progressPercentage={progressPercentage}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
                size={isCompactView ? "small" : "default"}
              />
            </div>
          )}
          <div className="mt-auto">
            {/* Dates and Status */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-500 ${
                isCompactView ? "mb-2 text-[0.7rem]" : "mb-4"
              }`}
            >
              <div className="flex items-center mb-1 sm:mb-0">
                <CalendarDaysIcon
                  className={`mr-1.5 flex-shrink-0 text-gray-500 dark:text-gray-400 ${
                    isCompactView ? "h-3 w-3" : "h-3.5 w-3.5"
                  }`}
                />
                <span>
                  Created:{" "}
                  {format(
                    new Date(task.createdAt),
                    isCompactView ? "MM/dd/yy" : "MMM d, yyyy"
                  )}
                </span>
              </div>
              {/* Reminder Date */}
              {task.reminderDate && (
                <div className="flex items-center text-purple-400">
                  <CalendarDaysIcon
                    className={`mr-1.5 flex-shrink-0 ${
                      isCompactView ? "h-3 w-3" : "h-3.5 w-3.5"
                    }`}
                  />
                  <span>
                    Reminder:{" "}
                    {format(
                      new Date(task.reminderDate),
                      isCompactView ? "MM/dd/yy p" : "MMM d, yyyy, p"
                    )}
                  </span>
                </div>
              )}
              {task.completedAt && (
                <div
                  className={`flex items-center ${
                    isCompactView ? "text-green-600" : "text-green-500"
                  }`}
                >
                  <CheckCircleIcon
                    className={`mr-1.5 flex-shrink-0 ${
                      isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"
                    }`}
                  />
                  <span>
                    Completed:{" "}
                    {format(
                      new Date(task.completedAt),
                      isCompactView ? "MM/dd/yy" : "MMM d, yyyy"
                    )}
                  </span>
                </div>
              )}
            </div>
            {/* Actions: Simplified to a "View Details" prompt */}
            {!isCompactView && (
              <div className="flex justify-end items-center pt-2 border-t border-gray-200 dark:border-gray-700/50">
                <span className="text-xs text-purple-400 group-hover:text-purple-300 flex items-center">
                  View Details{" "}
                  <EllipsisHorizontalIcon className="h-5 w-5 ml-1" />
                </span>
              </div>
            )}
          </div>
        </div>
      </li>

      {isModalOpen && (
        <TaskModal
          task={task}
          taskSteps={taskSteps || []}
          fetcher={fetcher}
          onClose={() => setIsModalOpen(false)}
          distinctCategories={distinctCategories}
          isCompactView={isCompactView}
        />
      )}
    </>
  );
}
