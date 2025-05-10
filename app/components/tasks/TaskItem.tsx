import { useState } from "react";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { useFetcher } from "react-router";
import TaskModal from "~/components/tasks/TaskModal"; // This will be the updated View/Edit modal
import ProgressBar from "./ProgressBar";
import { CalendarDaysIcon, TagIcon, CheckCircleIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { format } from 'date-fns'; // For date formatting

interface TaskItemProps {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: (typeof taskStepsTable.$inferSelect)[];
  distinctCategories: string[];
}

export default function TaskItem({
  task,
  taskSteps,
  distinctCategories,
}: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetcher = useFetcher();

  // Compute progress if task steps exist
  const totalSteps = taskSteps ? taskSteps.length : 0;
  const completedSteps = taskSteps
    ? taskSteps.filter((step) => step.completedAt !== null).length
    : 0;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Determine progress color
  let progressColor = "bg-red-500";
  if (progressPercentage >= 80) {
    progressColor = "bg-green-500";
  } else if (progressPercentage >= 50) {
    progressColor = "bg-yellow-500";
  }

  return (
    <>
      <li
        onClick={() => setIsModalOpen(true)}
        className={`
          bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-5 md:p-6 
          transition-all duration-300 ease-in-out cursor-pointer group
          hover:border-purple-500/70 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-[1.02]
          ${task.completedAt ? 'opacity-60 hover:opacity-80' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Task Header: Title and Category */}
          <div className="mb-3">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-100 group-hover:text-purple-400 transition-colors duration-300 truncate">
              {task.title}
            </h3>
            {task.category && (
              <div className="flex items-center text-xs text-purple-400 group-hover:text-purple-300 mt-1">
                <TagIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{task.category}</span>
              </div>
            )}
          </div>

          {/* Task Description (truncated) */}
          {task.description && (
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Spacer to push content below to the bottom if description is short */}
          {!task.description && <div className="mb-4"></div>}

          {/* Progress Bar (if applicable) */}
          {totalSteps > 0 && (
            <div className="mb-4">
              <ProgressBar
                progressPercentage={progressPercentage}
                // progressColor will be handled by ProgressBar based on percentage
                completedSteps={completedSteps}
                totalSteps={totalSteps}
                size="small"
              />
            </div>
          )}

          <div className="mt-auto"> {/* Pushes content below to the bottom */}
            {/* Dates and Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 mb-4">
              <div className="flex items-center mb-1 sm:mb-0">
                <CalendarDaysIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-slate-400" />
                <span>Created: {format(new Date(task.createdAt), "MMM d, yyyy")}</span>
              </div>
              {task.completedAt && (
                <div className="flex items-center text-green-500">
                  <CheckCircleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span>Completed: {format(new Date(task.completedAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Actions: Simplified to a "View Details" prompt */}
            <div className="flex justify-end items-center pt-2 border-t border-slate-700/50">
                <span className="text-xs text-purple-400 group-hover:text-purple-300 flex items-center">
                    View Details <EllipsisHorizontalIcon className="h-5 w-5 ml-1" />
                </span>
            </div>
          </div>
        </div>
      </li>

      {isModalOpen && (
        <TaskModal
          task={task}
          taskSteps={taskSteps || []} // Ensure taskSteps is not undefined
          // progressPercentage, progressColor, completedSteps, totalSteps are derived in TaskModal or passed if needed
          fetcher={fetcher} // Pass the fetcher
          onClose={() => setIsModalOpen(false)}
          distinctCategories={distinctCategories}
        />
      )}
    </>
  );
}
