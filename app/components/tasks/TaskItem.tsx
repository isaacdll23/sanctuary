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
  isCompactView?: boolean; // New: Add isCompactView prop
}

export default function TaskItem({
  task,
  taskSteps,
  distinctCategories,
  isCompactView, // New: Destructure isCompactView
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
          bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg 
          transition-all duration-300 ease-in-out cursor-pointer group
          hover:border-purple-500/70 hover:shadow-purple-500/20 hover:shadow-xl hover:scale-[1.02]
          ${task.completedAt ? 'opacity-60 hover:opacity-80' : ''}
          ${isCompactView ? 'p-3 md:p-4' : 'p-5 md:p-6'} // New: Adjust padding for compact view
        `}
      >
        <div className="flex flex-col h-full">
          {/* Task Header: Title and Category */}
          <div className={`${isCompactView ? 'mb-2' : 'mb-3'}`}> {/* New: Adjust margin for compact view */}
            <h3 className={`font-semibold text-slate-100 group-hover:text-purple-400 transition-colors duration-300 truncate ${isCompactView ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}> {/* New: Adjust font size for compact view */}
              {task.title}
            </h3>
            {task.category && !isCompactView && ( // New: Hide category in compact view
              <div className="flex items-center text-xs text-purple-400 group-hover:text-purple-300 mt-1">
                <TagIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{task.category}</span>
              </div>
            )}
          </div>

          {/* Task Description (truncated) */}
          {task.description && !isCompactView && ( // New: Hide description in compact view
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Spacer to push content below to the bottom if description is short */}
          {!task.description && !isCompactView && <div className="mb-4"></div>} {/* New: Hide spacer in compact view */}

          {/* Progress Bar (if applicable) */}
          {totalSteps > 0 && (
            <div className={`${isCompactView ? 'mb-2' : 'mb-4'}`}> {/* New: Adjust margin for compact view */}
              <ProgressBar
                progressPercentage={progressPercentage}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
                size={isCompactView ? "small" : "default"} // Changed: Use "small" for compact and "default" for standard
              />
            </div>
          )}

          <div className="mt-auto"> {/* Pushes content below to the bottom */}
            {/* Dates and Status */}
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 ${isCompactView ? 'mb-2 text-[0.7rem]' : 'mb-4'}`}> {/* New: Adjust margin and font size for compact view */}
              <div className="flex items-center mb-1 sm:mb-0">
                <CalendarDaysIcon className={`mr-1.5 flex-shrink-0 text-slate-400 ${isCompactView ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} /> {/* New: Adjust icon size for compact view */}
                <span>Created: {format(new Date(task.createdAt), isCompactView ? "MM/dd/yy" : "MMM d, yyyy")}</span> {/* New: Adjust date format for compact view */}
              </div>
              {task.completedAt && (
                <div className={`flex items-center ${isCompactView ? 'text-green-600' : 'text-green-500'}`}> {/* New: Adjust text color for compact view */}
                  <CheckCircleIcon className={`mr-1.5 flex-shrink-0 ${isCompactView ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} /> {/* New: Adjust icon size for compact view */}
                  <span>Completed: {format(new Date(task.completedAt), isCompactView ? "MM/dd/yy" : "MMM d, yyyy")}</span> {/* New: Adjust date format for compact view */}
                </div>
              )}
            </div>

            {/* Actions: Simplified to a "View Details" prompt */}
            {!isCompactView && ( // New: Hide View Details in compact view
              <div className="flex justify-end items-center pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-purple-400 group-hover:text-purple-300 flex items-center">
                      View Details <EllipsisHorizontalIcon className="h-5 w-5 ml-1" />
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
          isCompactView={isCompactView} // New: Pass isCompactView to TaskModal
        />
      )}
    </>
  );
}
