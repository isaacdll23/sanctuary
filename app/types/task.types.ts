import type { tasksTable, taskStepsTable } from "~/db/schema";

export type Task = typeof tasksTable.$inferSelect;
export type TaskStep = typeof taskStepsTable.$inferSelect;

export type ViewMode = "card" | "table";

export interface TaskWithSteps extends Task {
  steps: TaskStep[];
}

export interface TaskLoaderData {
  userTasks: Task[];
  userTaskSteps: TaskStep[];
}

export interface TaskActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  type?: string;
}

export type TaskIntent =
  | "createTask"
  | "updateTaskDetails"
  | "completeTask"
  | "incompleteTask"
  | "deleteTask"
  | "addStep"
  | "completeStep"
  | "deleteStep"
  | "updateCategory"
  | "setTaskReminder";
