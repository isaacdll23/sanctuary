import { useState, useEffect } from "react"; // Added useState and useEffect
import type { FetcherWithComponents } from "react-router"; // Added for fetcher type
import type { tasksTable, taskStepsTable } from "~/db/schema";
import ProgressBar from "~/components/tasks/ProgressBar";
import TaskStep from "./TaskStep";
import { format } from 'date-fns';
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  TagIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowUturnLeftIcon
} from "@heroicons/react/24/outline";

export default function TaskModal({
  task,
  taskSteps = [], // Default to empty array
  fetcher,
  onClose,
  distinctCategories = [],
}: {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: (typeof taskStepsTable.$inferSelect)[];
  fetcher: FetcherWithComponents<any>; // Typed fetcher
  onClose: () => void;
  distinctCategories?: string[];
}) {
  const [editableTitle, setEditableTitle] = useState(task.title);
  const [editableDescription, setEditableDescription] = useState(task.description || "");
  const [editableCategory, setEditableCategory] = useState(task.category || "");
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Reset editable fields if task changes (e.g. navigating between tasks quickly if modal was reused)
  useEffect(() => {
    setEditableTitle(task.title);
    setEditableDescription(task.description || "");
    setEditableCategory(task.category || "");
    setIsEditingDetails(false); // Reset editing state
  }, [task]);

  const completedSteps = taskSteps.filter((step) => step.completedAt !== null).length;
  const totalSteps = taskSteps.length;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleDetailsSave = () => {
    // This function would be called by a submit button within a fetcher.Form for updating details
    // For now, we toggle edit state. The actual submission will be via a form.
    setIsEditingDetails(false);
    // The fetcher.Form submit will handle the data
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-pop-in"
      onClick={onClose} // Close if backdrop is clicked
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()} // Prevent closing when modal content is clicked
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-700">
          {isEditingDetails ? (
            <input 
              type="text" 
              name="title" // Name for form submission
              value={editableTitle} 
              onChange={(e) => setEditableTitle(e.target.value)}
              className="text-xl md:text-2xl font-semibold bg-slate-700 text-slate-100 rounded-md p-2 flex-grow mr-4 focus:ring-2 focus:ring-purple-500"
              form="updateTaskDetailsForm" // Associate with the form
            />
          ) : (
            <h2 className="text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 truncate pr-4">
              {task.title}
            </h2>
          )}
          <div className="flex items-center">
            {!isEditingDetails && (
                <button 
                    onClick={() => setIsEditingDetails(true)} 
                    className="text-slate-400 hover:text-purple-400 p-2 rounded-md transition-colors mr-2"
                    aria-label="Edit task details"
                >
                    <PencilIcon className="h-5 w-5" />
                </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow">
          {/* Task Metadata (Created/Completed Dates) */}
          <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-slate-400 gap-2 sm:gap-4">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-slate-500 flex-shrink-0" />
              <span>Created: {format(new Date(task.createdAt), "MMM d, yyyy, p")}</span>
            </div>
            {task.completedAt && (
              <div className="flex items-center text-green-400">
                <CheckCircleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>Completed: {format(new Date(task.completedAt), "MMM d, yyyy, p")}</span>
              </div>
            )}
          </div>

          {/* Description and Category - Editable within a form */}
          <fetcher.Form method="post" onSubmit={handleDetailsSave} id="updateTaskDetailsForm" className="space-y-4">
            <input type="hidden" name="intent" value="updateTaskDetails" />
            <input type="hidden" name="taskId" value={task.id} />
            {/* Title is handled in header, but part of this form */} 
            {/* Hidden input for title if not directly in form, or rely on the one in header with form="id" */} 
            {isEditingDetails && <input type="hidden" name="title" value={editableTitle} />} 

            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              {isEditingDetails ? (
                <textarea
                  name="description" // Name for form submission
                  id="taskDescription"
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Add more details..."
                />
              ) : (
                <p className="text-sm text-slate-300 whitespace-pre-wrap min-h-[40px]">
                  {task.description || <span className="text-slate-500 italic">No description provided.</span>}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="taskCategory" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              {isEditingDetails ? (
                <div className="relative">
                  <TagIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="category" // Name for form submission
                    id="taskCategory"
                    value={editableCategory}
                    onChange={(e) => setEditableCategory(e.target.value)}
                    list="modal-categories-datalist"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="e.g., Work, Personal"
                  />
                  <datalist id="modal-categories-datalist">
                    {distinctCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <div className="flex items-center text-sm text-slate-300 min-h-[40px]">
                  {task.category ? (
                    <>
                      <TagIcon className="h-4 w-4 mr-1.5 text-purple-400 flex-shrink-0" /> 
                      {task.category}
                    </>
                  ) : (
                    <span className="text-slate-500 italic">No category assigned.</span>
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
                    // Reset fields to original task values if canceling edit
                    setEditableTitle(task.title);
                    setEditableDescription(task.description || "");
                    setEditableCategory(task.category || "");
                  }}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <CheckIcon className="h-4 w-4"/> Save Changes
                </button>
              </div>
            )}
          </fetcher.Form>

          {/* Progress Section */}
          {totalSteps > 0 && (
            <div className="pt-4 border-t border-slate-700/50">
              <h3 className="text-md font-semibold text-slate-200 mb-2">Progress</h3>
              <ProgressBar
                progressPercentage={progressPercentage}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
                size="default" // Use default size for modal
              />
            </div>
          )}

          {/* Task Steps Section */}
          <div className={totalSteps > 0 ? "pt-4 border-t border-slate-700/50" : ""}>
            <h3 className="text-md font-semibold text-slate-200 mb-3">Steps ({completedSteps}/{totalSteps})</h3>
            {taskSteps.length > 0 && (
              <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {taskSteps.map((step) => (
                  <TaskStep key={step.id} taskStep={step} fetcher={fetcher} />
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
                className="flex-grow bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold p-2.5 rounded-lg transition-colors flex items-center justify-center"
                aria-label="Add step"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </fetcher.Form>
          </div>
        </div>

        {/* Modal Footer - Actions */}
        <div className="p-5 md:p-6 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-800/50 rounded-b-2xl">
          <fetcher.Form method="post" className="w-full sm:w-auto">
            <input type="hidden" name="deleteTask" value={task.id} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
                  e.preventDefault();
                }
              }}
              className="w-full text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 text-sm flex items-center justify-center gap-2"
            >
              <TrashIcon className="h-4 w-4"/> Delete Task
            </button>
          </fetcher.Form>

          <fetcher.Form
            method="post"
            className="w-full"
          >
            {/* Correctly structure the hidden input for complete/incomplete actions */}
            <input
              type="hidden"
              name={task.completedAt ? "incompleteTask" : "completeTask"}
              value={task.id}
            />
            <button
              type="submit"
              className="w-full text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 text-sm flex items-center justify-center gap-2"
            >
              {task.completedAt ? (
                <ArrowUturnLeftIcon className="h-4 w-4" /> 
              ) : (
                <CheckCircleIcon className="h-5 w-5" />
              )}
              {task.completedAt ? "Mark as Incomplete" : "Mark as Complete"}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
