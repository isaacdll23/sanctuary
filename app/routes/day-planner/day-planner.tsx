import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import CalendarView from "~/components/day-planner/CalendarView";
import DayInsightsPanel from "~/components/day-planner/DayInsightsPanel";
import QuickUpcomingTasksSidebar from "~/components/day-planner/QuickUpcomingTasksSidebar";
import QuickAddTaskBar from "~/components/day-planner/QuickAddTaskBar";
import AddTaskModal from "~/components/day-planner/AddTaskModal";
import EditTaskModal from "~/components/day-planner/EditTaskModal";
import GoogleCalendarButton from "~/components/day-planner/GoogleCalendarButton";
import ConflictResolutionModal from "~/components/day-planner/ConflictResolutionModal";
import { useEffect, useContext, useState, useRef } from "react";
import { ToastContext } from "~/context/ToastContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export function meta() {
  return [{ title: "Day Planner - Sanctuary" }];
}

export const loader = pageAccessLoader("day-planner", async (user, request) => {
  const { getDayPlan } = await import("~/modules/services/DayPlannerService");
  const { getGoogleCalendarAccount, getTaskSyncStatus, triggerAutoSync } = await import(
    "~/modules/services/GoogleCalendarService"
  );
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  // Get current date in user's timezone (or default to today)
  const today = new Date().toISOString().split("T")[0];
  const planDate = dateParam || today;

  const plan = await getDayPlan(user.id, planDate);
  const googleCalendarAccount = await getGoogleCalendarAccount(user.id);
  const taskSyncStatus = await getTaskSyncStatus(user.id, planDate);

  // Auto-sync on page load if conditions are met
  let autoSyncStatus = { syncAttempted: false, message: "Not triggered" };
  if (googleCalendarAccount && googleCalendarAccount.isSyncEnabled === 1) {
    // Check if last sync was more than 5 minutes ago (debounce to avoid excessive syncing)
    const now = new Date();
    const lastSync = googleCalendarAccount.lastSyncAt
      ? new Date(googleCalendarAccount.lastSyncAt)
      : null;
    const shouldSync =
      !lastSync || now.getTime() - lastSync.getTime() > 5 * 60 * 1000;

    if (shouldSync) {
      autoSyncStatus = await triggerAutoSync(user.id, planDate);
    } else {
      // Sync was done recently, skip to avoid excessive API calls
      autoSyncStatus = {
        syncAttempted: false,
        message: "Sync skipped - recent sync within 5 minutes",
      };
    }
  }

  return {
    user,
    plan,
    planDate,
    googleCalendarAccount,
    taskSyncStatus: Object.fromEntries(taskSyncStatus),
    autoSyncStatus,
  };
});

export const action = async ({ request }: any) => {
  const { handleDayPlannerAction } = await import(
    "~/modules/services/DayPlannerService"
  );
  const { handleGoogleCalendarAction } = await import(
    "~/modules/services/GoogleCalendarService"
  );

  const formData = await request.clone().formData();
  const intent = formData.get("intent") as string;

  // Route Google Calendar intents to the appropriate service
  if (
    intent === "manualSyncGoogleCalendar" ||
    intent === "resolveSyncConflict"
  ) {
    return handleGoogleCalendarAction(request);
  }

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
  googleCalendarAccount: {
    id: string;
    userId: number;
    isSyncEnabled: number;
    syncDirection: "pull-only" | "push-only" | "bidirectional";
  } | null;
  taskSyncStatus: Record<
    string,
    {
      syncStatus: "synced" | "pending" | "conflict";
      conflictResolution: string | null;
      googleEventId: string;
    }
  >;
  autoSyncStatus: {
    syncAttempted: boolean;
    message: string;
  };
};

export default function DayPlanner() {
  const { user, plan, planDate, googleCalendarAccount, taskSyncStatus, autoSyncStatus } =
    useLoaderData<LoaderData>();
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
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const [conflictData, setConflictData] = useState<{
    mappingId: string;
    taskId: string;
    localVersion: {
      title: string;
      description: string | null;
      startTime: string;
      durationMinutes: number;
    };
    googleVersion: {
      title: string;
      description?: string;
      startTime: string;
      durationMinutes: number;
    };
  } | null>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl + N for new task
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setShowAddModal(true);
      }

      // Arrow keys for date navigation
      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) {
        const prevDate = new Date(planDate);
        prevDate.setDate(prevDate.getDate() - 1);
        handleDateChange(prevDate.toISOString().split("T")[0]);
      }

      if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) {
        const nextDate = new Date(planDate);
        nextDate.setDate(nextDate.getDate() + 1);
        handleDateChange(nextDate.toISOString().split("T")[0]);
      }

      // Escape to close modals
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowEditModal(false);
        setTaskToEdit(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [planDate]);

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

  function handleManualSync() {
    fetcher.submit(
      {
        intent: "manualSyncGoogleCalendar",
        planDate,
      },
      { method: "post" }
    );
  }

  // Calculate completion stats
  const completionStats = plan
    ? {
        total: plan.tasks.length,
        completed: plan.tasks.filter((t) => t.completedAt).length,
      }
    : null;

  const today = new Date().toISOString().split("T")[0];
  const isSyncing = fetcher.state === "submitting";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-8">
          {/* Top Row: Title and Controls */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Day Planner
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Plan and organize your tasks visually
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2.5 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 ${
                  focusMode
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                title={focusMode ? "Exit focus mode" : "Enter focus mode"}
              >
                {focusMode ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              <GoogleCalendarButton
                isConnected={!!googleCalendarAccount && googleCalendarAccount.isSyncEnabled === 1}
                onManualSync={handleManualSync}
                isSyncing={isSyncing}
              />
            </div>
          </div>

          {/* Date Navigation Row */}
          <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const prevDate = new Date(planDate);
                prevDate.setDate(prevDate.getDate() - 1);
                handleDateChange(prevDate.toISOString().split("T")[0]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              title="Previous day (← arrow key)"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center gap-3">
              <input
                type="date"
                value={planDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {user.timeZone}
              </div>
              <button
                type="button"
                onClick={() => handleDateChange(today)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 ${
                  planDate === today
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextDate = new Date(planDate);
                nextDate.setDate(nextDate.getDate() + 1);
                handleDateChange(nextDate.toISOString().split("T")[0]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              title="Next day (→ arrow key)"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {plan ? (
          <>
            {/* Day Insights Panel */}
            {!focusMode && (
              <DayInsightsPanel
                tasks={plan.tasks}
                viewStartTime={plan.viewStartTime}
                viewEndTime={plan.viewEndTime}
              />
            )}

            {/* Quick Add Task Bar */}
            {/* {!focusMode && (
              <div ref={quickAddRef}>
                <QuickAddTaskBar
                  planId={plan.id}
                  onTaskAdded={() => setRefreshKey((k) => k + 1)}
                />
              </div>
            )} */}

            {/* Main Content Layout */}
            <div className="flex gap-6">
              {/* Calendar View - Main Content */}
              <div className="flex-1 min-w-0">
                <CalendarView
                  tasks={plan.tasks}
                  viewStartTime={plan.viewStartTime}
                  viewEndTime={plan.viewEndTime}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  taskSyncStatus={taskSyncStatus}
                />
              </div>

              {/* Quick Upcoming Tasks Sidebar */}
              {!focusMode && (
                <QuickUpcomingTasksSidebar
                  allTasks={plan.tasks}
                  currentDate={planDate}
                />
              )}
            </div>
          </>
        ) : (
          // Empty State - No Plan Created
          <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No Plan for {planDate}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Create a day plan to start scheduling your tasks visually on a
              calendar. You can drag and drop tasks to reorganize them.
            </p>

            <button
              type="button"
              onClick={handleCreatePlan}
              disabled={fetcher.state === "submitting"}
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 shadow-md hover:shadow-lg"
            >
              <CalendarIcon className="w-5 h-5" />
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
            existingTasks={plan.tasks}
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
            existingTasks={plan?.tasks || []}
            onClose={() => {
              setShowEditModal(false);
              setTaskToEdit(null);
            }}
          />
        )}

        {conflictData && (
          <ConflictResolutionModal
            isOpen={showConflictModal}
            mappingId={conflictData.mappingId}
            localVersion={conflictData.localVersion}
            googleVersion={conflictData.googleVersion}
            onClose={() => {
              setShowConflictModal(false);
              setConflictData(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
