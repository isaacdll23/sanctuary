import type { FetcherWithComponents } from "react-router";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

interface AddTaskModalProps {
  fetcher: FetcherWithComponents<any>;
  onClose: () => void;
  distinctCategories: string[];
  filterCategory?: string;
  isCompactView?: boolean;
}

export default function AddTaskModal({
  fetcher,
  onClose,
  distinctCategories,
  filterCategory = "",
  isCompactView = false,
}: AddTaskModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-pop-in ${
          isCompactView ? "p-4" : ""
        }`}
      >
        <div
          className={`flex justify-between items-center mb-6 ${
            isCompactView ? "mb-4" : ""
          }`}
        >
          <h2
            className={`text-2xl font-semibold text-gray-900 dark:text-gray-100 ${
              isCompactView ? "text-xl" : ""
            }`}
          >
            Add New Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon
              className={`w-6 h-6 ${isCompactView ? "w-5 h-5" : ""}`}
            />
          </button>
        </div>
        <fetcher.Form
          method="post"
          className={`space-y-4 ${isCompactView ? "space-y-3" : ""}`}
        >
          <input type="hidden" name="intent" value="createTask" />
          <div>
            <label
              htmlFor="title"
              className={`block font-medium text-gray-700 dark:text-gray-300 mb-1 ${
                isCompactView ? "text-xs" : "text-sm"
              }`}
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="What needs to be done?"
              className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 ${
                isCompactView ? "text-xs p-2" : "text-sm"
              }`}
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className={`block font-medium text-gray-700 dark:text-gray-300 mb-1 ${
                isCompactView ? "text-xs" : "text-sm"
              }`}
            >
              Description (Optional)
            </label>
            <textarea
              name="description"
              id="description"
              placeholder="Add more details..."
              rows={isCompactView ? 2 : 3}
              className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 ${
                isCompactView ? "text-xs p-2" : "text-sm"
              }`}
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className={`block font-medium text-gray-700 dark:text-gray-300 mb-1 ${
                isCompactView ? "text-xs" : "text-sm"
              }`}
            >
              Category (Optional)
            </label>
            <input
              type="text"
              name="category"
              id="category"
              placeholder="e.g., Work, Personal, Project X"
              defaultValue={filterCategory || ""}
              list="categories-datalist"
              className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 ${
                isCompactView ? "text-xs p-2" : "text-sm"
              }`}
            />
            <datalist id="categories-datalist">
              {distinctCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div
            className={`flex flex-col sm:flex-row gap-3 pt-2 ${
              isCompactView ? "pt-1" : ""
            }`}
          >
            <button
              type="submit"
              className={`w-full flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isCompactView ? "py-2 px-4 text-sm" : "py-2.5 px-5"
              }`}
            >
              <PlusIcon className={`inline-block mr-2 ${isCompactView ? "h-4 w-4" : "h-5 w-5"}`} />
              Add Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`w-full flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                isCompactView ? "py-2 px-4 text-sm" : "py-2.5 px-5"
              }`}
            >
              Cancel
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
