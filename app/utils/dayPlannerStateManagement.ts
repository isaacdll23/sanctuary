/**
 * Day Planner State Management Utilities
 * Handles initialization and management of complex day planner state
 */

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

export interface DayPlannerState {
  showAddModal: boolean;
  showEditModal: boolean;
  showConflictModal: boolean;
  defaultStartTime: string | undefined;
  taskToEdit: Task | null;
  focusMode: boolean;
  refreshKey: number;
}

export interface DayPlannerStateActions {
  setShowAddModal: (value: boolean) => void;
  setShowEditModal: (value: boolean) => void;
  setShowConflictModal: (value: boolean) => void;
  setDefaultStartTime: (time: string | undefined) => void;
  setTaskToEdit: (task: Task | null) => void;
  setFocusMode: (enabled: boolean) => void;
  setRefreshKey: (key: number) => void;
  handleAddTask: (startTime?: string) => void;
  handleEditTask: (task: Task) => void;
  closeAddModal: () => void;
  closeEditModal: () => void;
}

/**
 * Initialize day planner state
 */
export function initializeDayPlannerState(): DayPlannerState {
  return {
    showAddModal: false,
    showEditModal: false,
    showConflictModal: false,
    defaultStartTime: undefined,
    taskToEdit: null,
    focusMode: false,
    refreshKey: 0,
  };
}

/**
 * Create action handlers for day planner state
 */
export function createDayPlannerActions(
  setState: {
    setShowAddModal: (value: boolean) => void;
    setShowEditModal: (value: boolean) => void;
    setShowConflictModal: (value: boolean) => void;
    setDefaultStartTime: (time: string | undefined) => void;
    setTaskToEdit: (task: Task | null) => void;
    setFocusMode: (enabled: boolean) => void;
    setRefreshKey: (key: number) => void;
  }
): DayPlannerStateActions {
  return {
    setShowAddModal: setState.setShowAddModal,
    setShowEditModal: setState.setShowEditModal,
    setShowConflictModal: setState.setShowConflictModal,
    setDefaultStartTime: setState.setDefaultStartTime,
    setTaskToEdit: setState.setTaskToEdit,
    setFocusMode: setState.setFocusMode,
    setRefreshKey: setState.setRefreshKey,
    handleAddTask: (startTime?: string) => {
      setState.setDefaultStartTime(startTime);
      setState.setShowAddModal(true);
    },
    handleEditTask: (task: Task) => {
      setState.setTaskToEdit(task);
      setState.setShowEditModal(true);
    },
    closeAddModal: () => {
      setState.setShowAddModal(false);
      setState.setDefaultStartTime(undefined);
    },
    closeEditModal: () => {
      setState.setShowEditModal(false);
      setState.setTaskToEdit(null);
    },
  };
}
