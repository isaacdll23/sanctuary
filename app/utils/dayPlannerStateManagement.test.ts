import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDayPlannerActions,
  initializeDayPlannerState,
} from "./dayPlannerStateManagement";

type SetterCall = { fn: string; value: unknown };

function createSetterRecorder() {
  const calls: SetterCall[] = [];

  const setters = {
    setShowAddModal: (value: boolean) => calls.push({ fn: "setShowAddModal", value }),
    setShowEditModal: (value: boolean) => calls.push({ fn: "setShowEditModal", value }),
    setShowConflictModal: (value: boolean) =>
      calls.push({ fn: "setShowConflictModal", value }),
    setDefaultStartTime: (value: string | undefined) =>
      calls.push({ fn: "setDefaultStartTime", value }),
    setTaskToEdit: (value: unknown) => calls.push({ fn: "setTaskToEdit", value }),
    setFocusMode: (value: boolean) => calls.push({ fn: "setFocusMode", value }),
    setRefreshKey: (value: number) => calls.push({ fn: "setRefreshKey", value }),
  };

  return { calls, setters };
}

describe("dayPlannerStateManagement", () => {
  it("initializes expected default state", () => {
    assert.deepEqual(initializeDayPlannerState(), {
      showAddModal: false,
      showEditModal: false,
      showConflictModal: false,
      defaultStartTime: undefined,
      taskToEdit: null,
      focusMode: false,
      refreshKey: 0,
    });
  });

  it("creates action handlers that orchestrate state setters", () => {
    const { calls, setters } = createSetterRecorder();
    const actions = createDayPlannerActions(setters);

    actions.handleAddTask("09:00");
    actions.closeAddModal();

    const task = {
      id: "t1",
      title: "Task",
      description: null,
      startTime: "10:00",
      durationMinutes: 30,
      completedAt: null,
    };
    actions.handleEditTask(task);
    actions.closeEditModal();

    assert.deepEqual(calls, [
      { fn: "setDefaultStartTime", value: "09:00" },
      { fn: "setShowAddModal", value: true },
      { fn: "setShowAddModal", value: false },
      { fn: "setDefaultStartTime", value: undefined },
      { fn: "setTaskToEdit", value: task },
      { fn: "setShowEditModal", value: true },
      { fn: "setShowEditModal", value: false },
      { fn: "setTaskToEdit", value: null },
    ]);
  });
});
