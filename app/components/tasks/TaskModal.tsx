import { useState, useEffect } from "react";
import type { FetcherWithComponents } from "react-router";
import type { tasksTable, taskStepsTable } from "~/db/schema";
import ProgressBar from "~/components/tasks/ProgressBar";
import TaskStep from "./TaskStep";
import { format } from "date-fns";
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  TagIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

export default function TaskModal({
  task,
  taskSteps = [],
  fetcher,
  onClose,
  distinctCategories = [],
  isCompactView,
}: {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: (typeof taskStepsTable.$inferSelect)[];
  fetcher: FetcherWithComponents<any>;
  onClose: () => void;
  distinctCategories?: string[];
  isCompactView?: boolean;
}) {
  const [editableTitle, setEditableTitle] = useState(task.title);
  const [editableDescription, setEditableDescription] = useState(
    task.description || ""
  );
  const [editableCategory, setEditableCategory] = useState(task.category || "");
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  useEffect(() => {
    setEditableTitle(task.title);
    setEditableDescription(task.description || "");
    setEditableCategory(task.category || "");
    setIsEditingDetails(false);
  }, [task]);

  const completedSteps = taskSteps.filter(
    (step) => step.completedAt !== null
  ).length;
  const totalSteps = taskSteps.length;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleDetailsSave = () => {
    setIsEditingDetails(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-pop-in"
      onClick={onClose}
    >
      <div
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${
          isCompactView ? "max-w-md" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex justify-between items-center border-b border-slate-700 ${
            isCompactView ? "p-3 md:p-4" : "p-5 md:p-6"
          }`}
        >
          {isEditingDetails ? (
            <input
              type="text"
              name="title"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className={`font-semibold bg-slate-700 text-slate-100 rounded-md p-2 flex-grow mr-4 focus:ring-2 focus:ring-purple-500 ${
                isCompactView ? "text-lg md:text-xl" : "text-xl md:text-2xl"
              }`}
              form="updateTaskDetailsForm"
            />
          ) : (
            <h2
              className={`font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 truncate pr-4 ${
                isCompactView ? "text-lg md:text-xl" : "text-xl md:text-2xl"
              }`}
            >
              {task.title}
            </h2>
          )}
          <div className="flex items-center">
            {!isEditingDetails && (
              <button
                onClick={() => setIsEditingDetails(true)}
                className={`text-slate-400 hover:text-purple-400 p-2 rounded-md transition-colors ${
                  isCompactView ? "mr-1" : "mr-2"
                }`}
                aria-label="Edit task details"
              >
                <PencilIcon
                  className={`${isCompactView ? "h-4 w-4" : "h-5 w-5"}`}
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon
                className={`${isCompactView ? "h-5 w-5" : "h-6 w-6"}`}
              />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          className={`space-y-6 overflow-y-auto flex-grow ${
            isCompactView ? "p-3 md:p-4 space-y-4" : "p-5 md:p-6"
          }`}
        >
          {/* Task Metadata (Created/Completed Dates) */}
          {!isCompactView && ( // New: Hide metadata in compact view
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-slate-400 gap-2 sm:gap-4">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-slate-500 flex-shrink-0" />
                <span>
                  Created: {format(new Date(task.createdAt), "MMM d, yyyy, p")}
                </span>
              </div>
              {task.completedAt && (
                <div className="flex items-center text-green-400">
                  <CheckCircleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span>
                    Completed:{" "}
                    {format(new Date(task.completedAt), "MMM d, yyyy, p")}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Description and Category - Editable within a form */}
          <fetcher.Form
            method="post"
            onSubmit={handleDetailsSave}
            id="updateTaskDetailsForm"
            className={`${isCompactView ? "space-y-3" : "space-y-4"}`}
          >
            <input type="hidden" name="intent" value="updateTaskDetails" />
            <input type="hidden" name="taskId" value={task.id} />
            {isEditingDetails && (
              <input type="hidden" name="title" value={editableTitle} />
            )}
            <div>
              <label
                htmlFor="taskDescription"
                className={`block font-medium text-slate-300 mb-1 ${
                  isCompactView ? "text-xs" : "text-sm"
                }`}
              >
                Description
              </label>
              {isEditingDetails ? (
                <textarea
                  name="description"
                  id="taskDescription"
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  rows={isCompactView ? 2 : 3} // New: Adjust rows for compact view
                  className={`w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                    isCompactView ? "text-xs" : "text-sm"
                  }`} // New: Adjust font size for compact view
                  placeholder="Add more details..."
                />
              ) : (
                <p
                  className={`whitespace-pre-wrap min-h-[40px] ${
                    isCompactView
                      ? "text-xs text-slate-400"
                      : "text-sm text-slate-300"
                  }`}
                >
                  {task.description || (
                    <span className="text-slate-500 italic">
                      No description provided.
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="taskCategory"
                className={`block font-medium text-slate-300 mb-1 ${
                  isCompactView ? "text-xs" : "text-sm"
                }`}
              >
                Category
              </label>
              {isEditingDetails ? (
                <div className="relative">
                  <TagIcon
                    className={`text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isCompactView ? "h-4 w-4" : "h-5 w-5"
                    }`}
                  />
                  <input
                    type="text"
                    name="category"
                    id="taskCategory"
                    value={editableCategory}
                    onChange={(e) => setEditableCategory(e.target.value)}
                    list="modal-categories-datalist"
                    className={`w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                      isCompactView
                        ? "pl-9 pr-3 py-2 text-xs"
                        : "pl-10 pr-4 py-2.5 text-sm"
                    }`} // New: Adjust padding and font size for compact view
                    placeholder="e.g., Work, Personal"
                  />
                  <datalist id="modal-categories-datalist">
                    {distinctCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <div
                  className={`flex items-center min-h-[40px] ${
                    isCompactView
                      ? "text-xs text-slate-400"
                      : "text-sm text-slate-300"
                  }`}
                >
                  {task.category ? (
                    <>
                      <TagIcon
                        className={`mr-1.5 text-purple-400 flex-shrink-0 ${
                          isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"
                        }`}
                      />
                      {task.category}
                    </>
                  ) : (
                    <span className="text-slate-500 italic">
                      No category assigned.
                    </span>
                  )}
                </div>
              )}
            </div>
            {isEditingDetails && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDetails(false);
                    setEditableTitle(task.title);
                    setEditableDescription(task.description || "");
                    setEditableCategory(task.category || "");
                  }}
                  className={`bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold rounded-lg transition-colors ${
                    isCompactView ? "py-1.5 px-3 text-xs" : "py-2 px-4 text-sm"
                  }`} // New: Adjust padding and font size for compact view
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                    isCompactView ? "py-1.5 px-3 text-xs" : "py-2 px-4 text-sm"
                  }`} // New: Adjust padding and font size for compact view
                >
                  <CheckIcon
                    className={`${isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                  />{" "}
                  Save Changes
                </button>
              </div>
            )}
          </fetcher.Form>
          {/* Progress Section */}
          {totalSteps > 0 && (
            <div
              className={`pt-4 border-t border-slate-700/50 ${
                isCompactView ? "pt-3" : ""
              }`}
            >
              <h3
                className={`font-semibold text-slate-200 mb-2 ${
                  isCompactView ? "text-sm" : "text-md"
                }`}
              >
                Progress
              </h3>
              <ProgressBar
                progressPercentage={progressPercentage}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
                size={isCompactView ? "small" : "default"} // New: Adjust size for compact view
              />
            </div>
          )}
          {/* Task Steps Section */}
          <div
            className={`${
              totalSteps > 0 ? "border-t border-slate-700/50" : ""
            } ${isCompactView ? "pt-3" : "pt-4"}`}
          >
            <h3
              className={`font-semibold text-slate-200 mb-3 ${
                isCompactView ? "text-sm mb-2" : "text-md"
              }`}
            >
              Steps ({completedSteps}/{totalSteps})
            </h3>
            {taskSteps.length > 0 && (
              <ul
                className={`space-y-2 mb-4 max-h-60 overflow-y-auto pr-2 ${
                  isCompactView ? "max-h-40 space-y-1.5 mb-3" : ""
                }`}
              >
                {taskSteps.map((step) => (
                  <TaskStep
                    key={step.id}
                    taskStep={step}
                    fetcher={fetcher}
                    isCompactView={isCompactView}
                  /> // New: Pass isCompactView to TaskStep
                ))}
              </ul>
            )}
            <fetcher.Form method="post" className="flex items-center gap-2">
              <input type="hidden" name="intent" value="addStep" />
              <input type="hidden" name="taskId" value={task.id} />
              <input
                type="text"
                name="stepDescription"
                placeholder="Add a new step..."
                className={`flex-grow bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  isCompactView ? "p-2 text-xs" : "p-2.5 text-sm"
                }`} // New: Adjust padding and font size for compact view
                required
              />
              <button
                type="submit"
                className={`bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center ${
                  isCompactView ? "p-2" : "p-2.5"
                }`} // New: Adjust padding for compact view
                aria-label="Add step"
              >
                <PlusIcon
                  className={`${isCompactView ? "h-4 w-4" : "h-5 w-5"}`}
                />
              </button>
            </fetcher.Form>
          </div>
        </div>

        {/* Modal Footer - Actions */}
        <div
          className={`border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-800/50 rounded-b-2xl ${
            isCompactView ? "p-3 md:p-4" : "p-5 md:p-6"
          }`}
        >
          <fetcher.Form method="post" className="w-full sm:w-auto">
            <input type="hidden" name="deleteTask" value={task.id} />
            <button
              type="submit"
              onClick={(e) => {
                if (
                  !confirm(
                    "Are you sure you want to delete this task? This action cannot be undone."
                  )
                ) {
                  e.preventDefault();
                }
              }}
              className={`w-full text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 ${
                isCompactView ? "py-2 px-4 text-xs" : "py-2.5 px-5 text-sm"
              }`} // New: Adjust padding and font size for compact view
            >
              <TrashIcon
                className={`${isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"}`}
              />{" "}
              Delete Task
            </button>
          </fetcher.Form>
          <fetcher.Form method="post" className="w-full">
            <input
              type="hidden"
              name={task.completedAt ? "incompleteTask" : "completeTask"}
              value={task.id}
            />
            <button
              type="submit"
              className={`w-full text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 ${
                isCompactView ? "py-2 px-4 text-xs" : "py-2.5 px-5 text-sm"
              }`} // New: Adjust padding and font size for compact view
            >
              {task.completedAt ? (
                <ArrowUturnLeftIcon
                  className={`${isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                /> // New: Adjust icon size for compact view
              ) : (
                <CheckCircleIcon
                  className={`${isCompactView ? "h-4 w-4" : "h-5 w-5"}`}
                /> // New: Adjust icon size for compact view
              )}
              {task.completedAt ? "Mark as Incomplete" : "Mark as Complete"}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
