import { useState, useEffect } from "react";
import { eq, desc } from "drizzle-orm";
import { useFetcher, useSearchParams, useLoaderData } from "react-router";
import TaskItem from "~/components/tasks/TaskItem";
import {
  PlusIcon,
  AdjustmentsHorizontalIcon,
  EyeSlashIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import {
  pageAccessLoader,
  pageAccessAction,
} from "~/modules/middleware/pageAccess";

export function meta() {
  return [{ title: "Tasks" }];
}

export const loader = pageAccessLoader("tasks", async (user, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { db } = await import("~/db");
  const { tasksTable, taskStepsTable } = await import("~/db/schema");

  const userTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, user.id))
    .orderBy(desc(tasksTable.createdAt));

  const userTaskSteps = await db
    .select()
    .from(taskStepsTable)
    .where(eq(taskStepsTable.userId, user.id))
    .orderBy(desc(taskStepsTable.createdAt));

  return { userTasks, userTaskSteps };
});

export const action = pageAccessAction("tasks", async (user, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { handleTaskAction } = await import("~/modules/services/TaskService");

  // Ensure the result of handleTaskAction is returned
  return handleTaskAction(request);
});

export default function Tasks() {
  const loaderData = useLoaderData<{
    userTasks: any[];
    userTaskSteps: any[];
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHide = searchParams.get("hideCompletedTasks") === "true";
  const initialCategory = searchParams.get("filterCategory") || "";
  const initialCompactView = searchParams.get("compactView") === "true"; // New: Initialize compact view state
  const [hideCompletedTasks, setHideCompletedTasks] = useState(initialHide);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [isCompactView, setIsCompactView] = useState(initialCompactView); // New: Compact view state
  const [isModalOpen, setIsModalOpen] = useState(false);
  let fetcher = useFetcher();

  const distinctCategories = Array.from(
    new Set(loaderData.userTasks.map((task) => task.category).filter(Boolean))
  ) as string[];

  const filteredTasks = loaderData.userTasks.filter((task) => {
    if (hideCompletedTasks && task.completedAt !== null) return false;
    if (filterCategory && task.category !== filterCategory) return false;
    return true;
  });

  const openTasks = loaderData.userTasks.filter(
    (task) =>
      task.completedAt === null &&
      (filterCategory === "" || task.category === filterCategory)
  );

  useEffect(() => {
    setSearchParams({
      hideCompletedTasks: hideCompletedTasks.toString(),
      filterCategory: filterCategory,
      compactView: isCompactView.toString(),
    });
  }, [hideCompletedTasks, filterCategory, isCompactView, setSearchParams]);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true &&
      isModalOpen
    ) {
      setIsModalOpen(false);
      fetcher.data = null;
    }
  }, [fetcher.state, fetcher.data, isModalOpen]);

  return (
    <div
      className={`min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${
        isCompactView ? "p-2 md:p-4" : "p-4 md:p-8"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header
          className={`mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-center gap-4 ${
            isCompactView ? "mb-4 md:mb-6" : ""
          }`}
        >
          <div>
            <h1
              className={`text-4xl sm:text-5xl font-extrabold tracking-tight text-center sm:text-left ${
                isCompactView ? "text-3xl sm:text-4xl" : ""
              }`}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                My Tasks
              </span>
            </h1>
            {!isCompactView && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Organize, track, and complete your work.
              </p>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 ${
              isCompactView ? "py-2 px-4 text-sm" : "py-2.5 px-6"
            }`}
          >
            <PlusIcon className={`h-5 w-5 ${isCompactView ? "h-4 w-4" : ""}`} />
            Add New Task
          </button>
        </header>

        {/* Filters and Open Tasks Count */}
        <div
          className={`mb-8 p-4 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 ${
            isCompactView ? "mb-4 p-2 text-sm" : ""
          }`}
        >
          <p
            className={`text-gray-700 dark:text-gray-300 font-medium ${
              isCompactView ? "text-xs" : "text-sm"
            }`}
          >
            {openTasks.length}{" "}
            <span
              className={`font-normal text-gray-500 dark:text-gray-400 ${
                isCompactView ? "" : ""
              }`}
            >
              Open Task{openTasks.length !== 1 ? "s" : ""}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
              className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-lg transition-colors duration-200 ${
                isCompactView
                  ? "px-3 py-1.5 text-xs"
                  : "px-4 py-2 text-xs sm:text-sm"
              }`}
            >
              {hideCompletedTasks ? (
                <EyeIcon
                  className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`}
                />
              ) : (
                <EyeSlashIcon
                  className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`}
                />
              )}
              {hideCompletedTasks ? "Show Completed" : "Hide Completed"}
            </button>
            <div className="relative">
              <AdjustmentsHorizontalIcon
                className={`text-gray-500 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isCompactView ? "h-4 w-4 left-2" : "h-5 w-5"
                }`}
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-200 appearance-none bg-white dark:bg-gray-700/50 ${
                  isCompactView
                    ? "pl-8 pr-3 py-1.5 text-xs"
                    : "pl-10 pr-4 py-2 text-xs sm:text-sm"
                }`}
              >
                <option value="">All Categories</option>
                {distinctCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {/* New Compact View Toggle Button */}
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-lg transition-colors duration-200 ${
                isCompactView
                  ? "px-3 py-1.5 text-xs"
                  : "px-4 py-2 text-xs sm:text-sm"
              }`}
            >
              {isCompactView ? (
                <ArrowsPointingOutIcon
                  className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`}
                />
              ) : (
                <ArrowsPointingInIcon
                  className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`}
                />
              )}
              {isCompactView ? "Standard View" : "Compact View"}
            </button>
          </div>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className={`text-center ${isCompactView ? "py-5" : "py-10"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`text-gray-500 dark:text-gray-500 mx-auto mb-4 ${
                isCompactView ? "w-12 h-12 mb-2" : "w-16 h-16"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
            <p
              className={`text-gray-600 dark:text-gray-400 ${
                isCompactView ? "text-base" : "text-lg"
              }`}
            >
              No tasks match your current filters.
            </p>
            {!isCompactView && (
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Try adjusting your filters or adding a new task.
              </p>
            )}
          </div>
        ) : (
          <ul
            className={`space-y-4 md:space-y-6 ${
              isCompactView ? "space-y-2 md:space-y-3" : ""
            }`}
          >
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                taskSteps={loaderData.userTaskSteps.filter(
                  (step) => step.taskId === task.id
                )}
                distinctCategories={distinctCategories}
                isCompactView={isCompactView} // Pass compact view state to TaskItem
              />
            ))}
          </ul>
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
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
                className={`text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 ${
                  isCompactView ? "text-xl" : ""
                }`}
              >
                Add New Task
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-6 h-6 ${isCompactView ? "w-5 h-5" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <fetcher.Form
              method="post"
              className={`space-y-4 ${isCompactView ? "space-y-3" : ""}`}
            >
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
                  className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 ${
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
                  className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 ${
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
                  className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 ${
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
                  className={`w-full flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 ${
                    isCompactView ? "py-2 px-4 text-sm" : "py-2.5 px-5"
                  }`}
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`w-full flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 ${
                    isCompactView ? "py-2 px-4 text-sm" : "py-2.5 px-5"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this to your app.css or a global stylesheet for the modal animation
/*
@keyframes modal-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-modal-pop-in {
  animation: modal-pop-in 0.3s ease-out forwards;
}
*/
