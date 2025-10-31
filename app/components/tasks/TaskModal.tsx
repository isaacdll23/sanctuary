import { useState, useEffect } from "react";
import type { FetcherWithComponents } from "react-router";
import type { Task, TaskStep as TaskStepType } from "~/types/task.types";
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

interface TaskModalProps {
  task: Task;
  taskSteps?: TaskStepType[];
  fetcher: FetcherWithComponents<any>;
  onClose: () => void;
  distinctCategories?: string[];
  isCompactView?: boolean;
}

export default function TaskModal({
  task,
  taskSteps = [],
  fetcher,
  onClose,
  distinctCategories = [],
  isCompactView,
}: TaskModalProps) {
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

  // Auto-close modal when delete or complete/incomplete actions succeed
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true
    ) {
      // Check if it was a delete, complete, or incomplete action
      const message = (fetcher.data as any).message || "";
      if (
        message.includes("deleted") ||
        message.includes("complete") ||
        message.includes("incomplete")
      ) {
        onClose();
      }
    }
  }, [fetcher.state, fetcher.data, onClose]);

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
        className={`bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${
          isCompactView ? "max-w-md" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex justify-between items-center border-b border-gray-300 dark:border-gray-600 ${
            isCompactView ? "p-3 md:p-4" : "p-5 md:p-6"
          }`}
        >
          {isEditingDetails ? (
            <input
              type="text"
              name="title"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className={`font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 flex-grow mr-4 focus:ring-2 focus:ring-purple-500 ${
                isCompactView ? "text-lg md:text-xl" : "text-xl md:text-2xl"
              }`}
              form="updateTaskDetailsForm"
            />
          ) : (
            <h2
              className={`font-semibold text-gray-900 dark:text-gray-100 truncate pr-4 ${
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
                className={`text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-md transition-colors ${
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
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 p-2 rounded-md transition-colors"
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
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 dark:text-gray-300 gap-2 sm:gap-4">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400 dark:text-gray-300 flex-shrink-0" />
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
            {/* Reminder Date Field */}
            <div>
              <label
                htmlFor="reminderDate"
                className={`block font-medium text-gray-700 dark:text-gray-200 mb-1 ${
                  isCompactView ? "text-xs" : "text-sm"
                }`}
              >
                Reminder
              </label>
              {isEditingDetails ? (
                <input
                  type="datetime-local"
                  name="reminderDate"
                  id="reminderDate"
                  defaultValue={
                    task.reminderDate
                      ? format(
                          new Date(task.reminderDate),
                          "yyyy-MM-dd'T'HH:mm"
                        )
                      : ""
                  }
                  className={`w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isCompactView ? "text-xs py-2" : "text-sm py-2.5"
                  }`}
                />
              ) : (
                <p
                  className={`min-h-[40px] ${
                    isCompactView
                      ? "text-xs text-gray-500 dark:text-gray-300"
                      : "text-sm text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {task.reminderDate ? (
                    <>
                      <CalendarDaysIcon className="inline-block w-4 h-4 mr-1 text-blue-600 dark:text-blue-400 align-text-bottom" />
                      {format(new Date(task.reminderDate), "MMM d, yyyy, p")}
                    </>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-300 italic">
                      No reminder set.
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="taskDescription"
                className={`block font-medium text-gray-700 dark:text-gray-200 mb-1 ${
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
                  className={`w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isCompactView ? "text-xs" : "text-sm"
                  }`} // New: Adjust font size for compact view
                  placeholder="Add more details..."
                />
              ) : (
                <p
                  className={`whitespace-pre-wrap min-h-[40px] ${
                    isCompactView
                      ? "text-xs text-gray-500 dark:text-gray-300"
                      : "text-sm text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {task.description || (
                    <span className="text-gray-400 dark:text-gray-300 italic">
                      No description provided.
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="taskCategory"
                className={`block font-medium text-gray-700 dark:text-gray-200 mb-1 ${
                  isCompactView ? "text-xs" : "text-sm"
                }`}
              >
                Category
              </label>
              {isEditingDetails ? (
                <div className="relative">
                  <TagIcon
                    className={`text-gray-500 dark:text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
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
                    className={`w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
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
                      ? "text-xs text-gray-500 dark:text-gray-300"
                      : "text-sm text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {task.category ? (
                    <>
                      <TagIcon
                        className={`mr-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0 ${
                          isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"
                        }`}
                      />
                      {task.category}
                    </>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-300 italic">
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
                  className={`bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors ${
                    isCompactView ? "py-1.5 px-3 text-xs" : "py-2 px-4 text-sm"
                  }`} // New: Adjust padding and font size for compact view
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
              className={`pt-4 border-t border-gray-300 dark:border-gray-600/50 ${
                isCompactView ? "pt-3" : ""
              }`}
            >
              <h3
                className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 ${
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
              totalSteps > 0
                ? "border-t border-gray-300 dark:border-gray-600/50"
                : ""
            } ${isCompactView ? "pt-3" : "pt-4"}`}
          >
            <h3
              className={`font-semibold text-gray-900 dark:text-gray-100 mb-3 ${
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
                className={`flex-grow bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isCompactView ? "p-2 text-xs" : "p-2.5 text-sm"
                }`} // New: Adjust padding and font size for compact view
                required
              />
              <button
                type="submit"
                className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
          className={`border-t border-gray-300 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-100/50 dark:bg-gray-700/50 rounded-b-2xl ${
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
