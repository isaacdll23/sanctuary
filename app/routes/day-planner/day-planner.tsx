import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import CalendarView from "~/components/day-planner/CalendarView";
import AddTaskModal from "~/components/day-planner/AddTaskModal";
import EditTaskModal from "~/components/day-planner/EditTaskModal";
import { useEffect, useContext, useState } from "react";
import { ToastContext } from "~/context/ToastContext";

export function meta() {
  return [{ title: "Day Planner - Sanctuary" }];
}

export const loader = pageAccessLoader("day-planner", async (user, request) => {
  const { getDayPlan } = await import("~/modules/services/DayPlannerService");
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  // Get current date in user's timezone (or default to today)
  const today = new Date().toISOString().split("T")[0];
  const planDate = dateParam || today;

  const plan = await getDayPlan(user.id, planDate);

  return {
    user,
    plan,
    planDate,
  };
});

export const action = async ({ request }: any) => {
  const { handleDayPlannerAction } = await import(
    "~/modules/services/DayPlannerService"
  );
  return handleDayPlannerAction(request);
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

type Plan = {
  id: string;
  userId: number;
  planDate: string;
  timeZone: string;
  viewStartTime: string;
  viewEndTime: string;
  tasks: Task[];
};

type LoaderData = {
  user: {
    id: number;
    username: string;
    email: string;
    timeZone: string;
  };
  plan: Plan | null;
  planDate: string;
};

export default function DayPlanner() {
  const { user, plan, planDate } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const toastCtx = useContext(ToastContext);
  const [toastShown, setToastShown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [defaultStartTime, setDefaultStartTime] = useState<
    string | undefined
  >();
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Show toast on successful actions
  useEffect(() => {
    if (fetcher.data && toastCtx && !toastShown) {
      if (fetcher.data.success) {
        toastCtx.addToast(fetcher.data.message, "success");
      } else if (fetcher.data.message) {
        toastCtx.addToast(fetcher.data.message, "error");
      }
      setToastShown(true);

      // Close modals on success
      if (fetcher.data.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        setTaskToEdit(null);
      }
    }
    if (!fetcher.data) {
      setToastShown(false);
    }
    // eslint-disable-next-line
  }, [fetcher.data, toastCtx, toastShown]);

  function handleDateChange(newDate: string) {
    navigate(`/day-planner?date=${newDate}`);
  }

  function handleCreatePlan() {
    fetcher.submit(
      {
        intent: "createOrUpdatePlan",
        planDate,
        viewStartTime: "06:00:00",
        viewEndTime: "22:00:00",
        timeZone: user.timeZone,
      },
      { method: "post" }
    );
  }

  function handleAddTask(startTime?: string) {
    setDefaultStartTime(startTime);
    setShowAddModal(true);
  }

  function handleEditTask(task: Task) {
    setTaskToEdit(task);
    setShowEditModal(true);
  }

  // Calculate completion stats
  const completionStats = plan
    ? {
        total: plan.tasks.length,
        completed: plan.tasks.filter((t) => t.completedAt).length,
      }
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Day Planner
          </h1>

          {/* Date Picker */}
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan Date
            </label>
            <input
              type="date"
              value={planDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="flex-1 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <button
              type="button"
              onClick={() =>
                handleDateChange(new Date().toISOString().split("T")[0])
              }
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-medium rounded-lg text-sm transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {plan ? (
          <>
            {/* Completion Stats */}
            {completionStats && completionStats.total > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progress
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {completionStats.completed} / {completionStats.total}{" "}
                    completed
                  </span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (completionStats.completed / completionStats.total) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Calendar View */}
            <CalendarView
              tasks={plan.tasks}
              viewStartTime={plan.viewStartTime}
              viewEndTime={plan.viewEndTime}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
            />
          </>
        ) : (
          // Empty State - No Plan Created
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              No Plan for {planDate}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Create a day plan to start scheduling your tasks visually on a
              calendar.
            </p>

            <button
              type="button"
              onClick={handleCreatePlan}
              disabled={fetcher.state === "submitting"}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {fetcher.state === "submitting"
                ? "Creating Plan..."
                : "Create Day Plan"}
            </button>
          </div>
        )}

        {/* Modals */}
        {showAddModal && plan && (
          <AddTaskModal
            planId={plan.id}
            onClose={() => {
              setShowAddModal(false);
              setDefaultStartTime(undefined);
            }}
            defaultStartTime={defaultStartTime}
          />
        )}

        {showEditModal && taskToEdit && (
          <EditTaskModal
            task={taskToEdit}
            onClose={() => {
              setShowEditModal(false);
              setTaskToEdit(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
