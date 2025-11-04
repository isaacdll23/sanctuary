import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import DayInsightsPanel from "~/components/day-planner/DayInsightsPanel";
import GoogleCalendarButton from "~/components/day-planner/GoogleCalendarButton";
import TaskModalsContainer from "~/components/day-planner/TaskModalsContainer";
import DayPlannerContent from "~/components/day-planner/DayPlannerContent";
import EmptyPlanState from "~/components/day-planner/EmptyPlanState";
import { useEffect, useContext, useState } from "react";
import { ToastContext } from "~/context/ToastContext";
import { initializeDayPlannerState, createDayPlannerActions } from "~/utils/dayPlannerStateManagement";
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
  const { getDayPlan, calculateFocusedTask } = await import("~/modules/services/DayPlannerService");
  const { getGoogleCalendarAccount, getTaskSyncStatus, triggerAutoSync, getCalendarPreferences } = await import(
    "~/modules/services/GoogleCalendarService"
  );
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  // Get current date in user's timezone (or default to today)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: user.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(now);
  const planDate = dateParam || today;

  // Get user's calendar preferences
  const calendarPreferences = await getCalendarPreferences(user.id);
  const viewStartTime = calendarPreferences?.calendarViewStartTime || "06:00:00";
  const viewEndTime = calendarPreferences?.calendarViewEndTime || "22:00:00";

  const plan = await getDayPlan(user.id, planDate);
  const googleCalendarAccount = await getGoogleCalendarAccount(user.id);
  const taskSyncStatus = await getTaskSyncStatus(user.id, planDate);

  // Calculate the most relevant task for focusing
  let focusedTaskData = null;
  if (plan && plan.tasks.length > 0) {
    focusedTaskData = calculateFocusedTask(plan.tasks, viewStartTime, viewEndTime);
  }

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
    focusedTaskData,
    viewStartTime,
    viewEndTime,
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
  focusedTaskData: {
    taskId: string;
    scrollOffset: number;
  } | null;
  viewStartTime: string;
  viewEndTime: string;
};

export default function DayPlanner() {
  const { user, plan, planDate, googleCalendarAccount, taskSyncStatus, autoSyncStatus, focusedTaskData, viewStartTime, viewEndTime } =
    useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const toastCtx = useContext(ToastContext);
  const [toastShown, setToastShown] = useState(false);

  // Initialize state using utility function
  const initialState = initializeDayPlannerState();
  const [showAddModal, setShowAddModal] = useState(initialState.showAddModal);
  const [showEditModal, setShowEditModal] = useState(initialState.showEditModal);
  const [showConflictModal, setShowConflictModal] = useState(initialState.showConflictModal);
  const [defaultStartTime, setDefaultStartTime] = useState(initialState.defaultStartTime);
  const [taskToEdit, setTaskToEdit] = useState(initialState.taskToEdit);
  const [focusMode, setFocusMode] = useState(initialState.focusMode);
  const [refreshKey, setRefreshKey] = useState(initialState.refreshKey);
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

  // Create action handlers using utility function
  const actions = createDayPlannerActions({
    setShowAddModal,
    setShowEditModal,
    setShowConflictModal,
    setDefaultStartTime,
    setTaskToEdit,
    setFocusMode,
    setRefreshKey,
  });

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

  // Auto-scroll to focused task on page load
  useEffect(() => {
    if (focusedTaskData) {
      // Delay slightly to allow DOM to render
      const timer = setTimeout(() => {
        const focusedElement = document.getElementById(`task-${focusedTaskData.taskId}`);
        if (focusedElement) {
          // Scroll the task into view smoothly
          focusedElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Add visual highlight to the focused task
          focusedElement.classList.add("ring-2", "ring-yellow-400", "ring-opacity-75");
          
          // Remove highlight after 3 seconds
          const highlightTimer = setTimeout(() => {
            focusedElement.classList.remove("ring-2", "ring-yellow-400", "ring-opacity-75");
          }, 3000);

          return () => clearTimeout(highlightTimer);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [focusedTaskData, planDate]);

  function handleDateChange(newDate: string) {
    navigate(`/day-planner?date=${newDate}`);
  }

  function handleCreatePlan() {
    fetcher.submit(
      {
        intent: "createOrUpdatePlan",
        planDate,
        viewStartTime,
        viewEndTime,
        timeZone: user.timeZone,
      },
      { method: "post" }
    );
  }

  function handleAddTask(startTime?: string) {
    actions.handleAddTask(startTime);
  }

  function handleEditTask(task: Task) {
    actions.handleEditTask(task);
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

  // Calculate today's date in user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: user.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(now);
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
                viewStartTime={viewStartTime}
                viewEndTime={viewEndTime}
              />
            )}

            {/* Main Content Layout */}
            <DayPlannerContent
              tasks={plan.tasks}
              planDate={planDate}
              viewStartTime={viewStartTime}
              viewEndTime={viewEndTime}
              focusMode={focusMode}
              taskSyncStatus={taskSyncStatus}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
            />
          </>
        ) : (
          <EmptyPlanState
            planDate={planDate}
            onCreatePlan={handleCreatePlan}
            isLoading={fetcher.state === "submitting"}
          />
        )}

        {/* Modals */}
        <TaskModalsContainer
          showAddModal={showAddModal}
          showEditModal={showEditModal}
          showConflictModal={showConflictModal}
          plan={plan}
          defaultStartTime={defaultStartTime}
          taskToEdit={taskToEdit}
          conflictData={conflictData}
          onAddModalClose={() => {
            setShowAddModal(false);
            setDefaultStartTime(undefined);
          }}
          onEditModalClose={() => {
            setShowEditModal(false);
            setTaskToEdit(null);
          }}
          onConflictModalClose={() => {
            setShowConflictModal(false);
            setConflictData(null);
          }}
        />
      </div>
    </div>
  );
}
