import { useState, useEffect } from "react";
import type { FetcherWithComponents } from "react-router";
import type { Task, TaskStep as TaskStepType } from "~/types/task.types";
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
}

export default function TaskModal({
  task,
  taskSteps = [],
  fetcher,
  onClose,
  distinctCategories = [],
}: TaskModalProps) {
  const [editableTitle, setEditableTitle] = useState(task.title);
  const [editableDescription, setEditableDescription] = useState(
    task.description || ""
  );
  const [editableCategory, setEditableCategory] = useState(task.category || "");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  useEffect(() => {
    setEditableTitle(task.title);
    setEditableDescription(task.description || "");
    setEditableCategory(task.category || "");
    setIsEditingDetails(false);
  }, [task]);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true &&
      lastSubmitTime > 0
    ) {
      const message = (fetcher.data as any).message || "";
      if (
        message.includes("deleted") ||
        message.includes("complete") ||
        message.includes("incomplete")
      ) {
        onClose();
      }
      setLastSubmitTime(0);
    }
  }, [fetcher.state, fetcher.data, onClose, lastSubmitTime]);

  const completedSteps = taskSteps.filter(
    (step) => step.completedAt !== null
  ).length;
  const totalSteps = taskSteps.length;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
          {isEditingDetails ? (
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="text-2xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-3 flex-grow mr-4 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
            />
          ) : (
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
              {task.title}
            </h2>
          )}
          <div className="flex items-center gap-2">
            {!isEditingDetails && (
              <button
                onClick={() => setIsEditingDetails(true)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                title="Edit task details"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
              title="Close modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto flex-grow p-6 space-y-6">
          {/* Metadata */}
          <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span>
                Created: {format(new Date(task.createdAt), "MMM d, yyyy, p")}
              </span>
            </div>
            {task.completedAt && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CheckCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span>
                  Completed: {format(new Date(task.completedAt), "MMM d, yyyy, p")}
                </span>
              </div>
            )}
          </div>

          {/* Editable Fields */}
          <fetcher.Form
            method="post"
            id="updateTaskDetailsForm"
            className="space-y-4"
          >
            <input type="hidden" name="intent" value="updateTaskDetails" />
            <input type="hidden" name="taskId" value={task.id} />
            {isEditingDetails && (
              <input type="hidden" name="title" value={editableTitle} />
            )}

            {/* Reminder */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Reminder
              </label>
              {isEditingDetails ? (
                <input
                  type="datetime-local"
                  name="reminderDate"
                  defaultValue={
                    task.reminderDate
                      ? format(new Date(task.reminderDate), "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 min-h-[40px] flex items-center">
                  {task.reminderDate ? (
                    <>
                      <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      {format(new Date(task.reminderDate), "MMM d, yyyy, p")}
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      No reminder set
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              {isEditingDetails ? (
                <textarea
                  name="description"
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150 resize-none"
                  placeholder="Add more details..."
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[60px] py-2">
                  {task.description || (
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      No description provided
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              {isEditingDetails ? (
                <div className="relative">
                  <TagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    name="category"
                    value={editableCategory}
                    onChange={(e) => setEditableCategory(e.target.value)}
                    list="modal-categories-datalist"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                    placeholder="e.g., Work, Personal, Project..."
                  />
                  <datalist id="modal-categories-datalist">
                    {distinctCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <div className="flex items-center min-h-[40px] text-sm">
                  {task.category ? (
                    <>
                      <TagIcon className="h-4 w-4 mr-2.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {task.category}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      No category assigned
                    </span>
                  )}
                </div>
              )}
            </div>

            {isEditingDetails && (
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-300 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDetails(false);
                    setEditableTitle(task.title);
                    setEditableDescription(task.description || "");
                    setEditableCategory(task.category || "");
                  }}
                  className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold text-sm rounded-lg transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                >
                  <CheckIcon className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            )}
          </fetcher.Form>

          {/* Progress */}
          {totalSteps > 0 && (
            <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Progress
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {completedSteps}/{totalSteps}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {progressPercentage}% Complete
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Steps ({completedSteps}/{totalSteps})
            </h3>

            {taskSteps.length > 0 && (
              <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {taskSteps.map((step) => (
                  <TaskStep
                    key={step.id}
                    taskStep={step}
                    fetcher={fetcher}
                  />
                ))}
              </ul>
            )}

            <fetcher.Form method="post" className="flex gap-2">
              <input type="hidden" name="intent" value="addStep" />
              <input type="hidden" name="taskId" value={task.id} />
              <input
                type="text"
                name="stepDescription"
                placeholder="Add a new step..."
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                required
              />
              <button
                type="submit"
                className="px-3.5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                title="Add step"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </fetcher.Form>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="border-t border-gray-300 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
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
                } else {
                  setLastSubmitTime(Date.now());
                }
              }}
              className="w-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition-colors duration-150"
            >
              <TrashIcon className="h-4 w-4" />
              Delete Task
            </button>
          </fetcher.Form>
          <fetcher.Form method="post" className="w-full sm:flex-1">
            <input
              type="hidden"
              name={task.completedAt ? "incompleteTask" : "completeTask"}
              value={task.id}
            />
            <button
              type="submit"
              onClick={() => setLastSubmitTime(Date.now())}
              className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              {task.completedAt ? (
                <>
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                  Mark as Incomplete
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Mark as Complete
                </>
              )}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
