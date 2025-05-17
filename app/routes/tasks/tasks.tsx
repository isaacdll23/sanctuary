import { useState, useEffect } from "react";
import { eq, desc } from "drizzle-orm";
import { useFetcher, useSearchParams, useLoaderData } from "react-router";
import TaskItem from "~/components/tasks/TaskItem";
import { PlusIcon, AdjustmentsHorizontalIcon, EyeSlashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { pageAccessLoader, pageAccessAction } from "~/modules/middleware/pageAccess";

export function meta() {
  return [{ title: "Tasks" }];
}

export const loader = pageAccessLoader("tasks", async (user, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { db } = await import("~/db");
  const { tasksTable, taskStepsTable } = await import("~/db/schema");

  // Pagination params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
  const offset = (page - 1) * pageSize;

  // Get all user tasks (for filtering, but slice for pagination)
  const allUserTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, user.id))
    .orderBy(desc(tasksTable.createdAt));

  // Paginate
  const userTasks = allUserTasks.slice(offset, offset + pageSize);
  const totalTasks = allUserTasks.length;

  const userTaskSteps = await db
    .select()
    .from(taskStepsTable)
    .where(eq(taskStepsTable.userId, user.id))
    .orderBy(desc(taskStepsTable.createdAt));

  return { userTasks, userTaskSteps, totalTasks, page, pageSize };
});

export const action = pageAccessAction("tasks", async (user, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { handleTaskAction } = await import("~/modules/services/TaskService");
  
  // Ensure the result of handleTaskAction is returned
  return handleTaskAction(request);
});

export default function Tasks() {
  const loaderData = useLoaderData<{ userTasks: any[], userTaskSteps: any[], totalTasks: number, page: number, pageSize: number }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHide = searchParams.get("hideCompletedTasks") === "true";
  const initialCategory = searchParams.get("filterCategory") || "";
  const initialPage = parseInt(searchParams.get("page") || loaderData.page?.toString() || "1", 10);
  const pageSize = loaderData.pageSize || 10;
  const [hideCompletedTasks, setHideCompletedTasks] = useState(initialHide);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(initialPage);
  let fetcher = useFetcher();

  const distinctCategories = Array.from(
    new Set(loaderData.userTasks.map((task) => task.category).filter(Boolean))
  ) as string[];

  // Filtering is done on the paginated slice, not the full set
  const filteredTasks = loaderData.userTasks.filter((task) => {
    if (hideCompletedTasks && task.completedAt !== null) return false;
    if (filterCategory && task.category !== filterCategory) return false;
    return true;
  });

  const openTasks = loaderData.userTasks.filter(
    (task) => task.completedAt === null && (filterCategory === "" || task.category === filterCategory)
  );

  // Pagination logic
  const totalTasks = loaderData.totalTasks;
  const totalPages = Math.ceil(totalTasks / pageSize);

  // When filters or page changes, update search params
  useEffect(() => {
    setSearchParams({
      hideCompletedTasks: hideCompletedTasks.toString(),
      filterCategory: filterCategory,
      page: page.toString(),
    });
  }, [hideCompletedTasks, filterCategory, page, setSearchParams]);

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

  // Pagination controls
  function goToPage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center sm:text-left">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                My Tasks
              </span>
            </h1>
            <p className="mt-2 text-lg text-slate-400 text-center sm:text-left">
              Organize, track, and complete your work.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Task
          </button>
        </header>

        {/* Filters and Open Tasks Count */}
        <div className="mb-8 p-4 bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-300 font-medium">
            {openTasks.length}{" "}
            <span className="font-normal text-slate-400">
              Open Task{openTasks.length !== 1 ? "s" : ""}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {hideCompletedTasks ? (
                <EyeIcon className="h-4 w-4" />
              ) : (
                <EyeSlashIcon className="h-4 w-4" />
              )}
              {hideCompletedTasks ? "Show Completed" : "Hide Completed"}
            </button>
            <div className="relative">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-200 appearance-none"
              >
                <option value="">All Categories</option>
                {distinctCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 text-slate-500 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
            <p className="text-slate-400 text-lg">
              No tasks match your current filters.
            </p>
            <p className="text-slate-500 text-sm">
              Try adjusting your filters or adding a new task.
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-4 md:space-y-6">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  taskSteps={loaderData.userTaskSteps.filter(
                    (step) => step.taskId === task.id
                  )}
                  distinctCategories={distinctCategories}
                />
              ))}
            </ul>
            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-slate-700 text-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1 rounded ${p === page ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"}`}
                  disabled={p === page}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-slate-700 text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-pop-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Add New Task
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <fetcher.Form method="post" className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  placeholder="What needs to be done?"
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  id="description"
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-300 mb-1"
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
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                />
                <datalist id="categories-datalist">
                  {distinctCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full flex-1 bg-slate-600 hover:bg-slate-500 text-slate-100 font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75"
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
