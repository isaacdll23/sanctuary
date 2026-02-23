import type { FetcherWithComponents } from "react-router";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

interface AddTaskModalProps {
  fetcher: FetcherWithComponents<any>;
  onClose: () => void;
  distinctCategories: string[];
  filterCategory?: string;
}

export default function AddTaskModal({
  fetcher,
  onClose,
  distinctCategories,
  filterCategory = "",
}: AddTaskModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg w-full max-w-md md:max-w-2xl transform transition-all duration-150 scale-100 opacity-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <fetcher.Form method="post" className="p-6 space-y-4 md:space-y-6 md:grid md:grid-cols-2 md:gap-6">
          <input type="hidden" name="intent" value="createTask" />

          {/* Title - Full Width on Desktop */}
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2"
            >
              Task Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="What needs to be done?"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-gray-400 dark:focus:border-gray-600 transition-colors duration-150"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              A clear, concise title for your task
            </p>
          </div>

          {/* Description - Full Width on Desktop */}
          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              placeholder="Add more details about this task..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-gray-400 dark:focus:border-gray-600 transition-colors duration-150 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Optional. Include any relevant notes or requirements
            </p>
          </div>

          {/* Category - Full Width on Desktop */}
          <div className="md:col-span-2">
            <label
              htmlFor="category"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2"
            >
              Category
            </label>
            <input
              type="text"
              name="category"
              id="category"
              placeholder="e.g., Work, Personal, Project..."
              defaultValue={filterCategory || ""}
              list="categories-datalist"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-gray-400 dark:focus:border-gray-600 transition-colors duration-150"
            />
            <datalist id="categories-datalist">
              {distinctCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Optional. Organize tasks by topic or project
            </p>
          </div>

          {/* Button Actions - Full Width on Desktop */}
          <div className="flex gap-3 pt-4 border-t border-gray-300 dark:border-gray-700 md:col-span-2 md:pt-6">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}