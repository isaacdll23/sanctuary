import { db } from "~/db";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";
import type { TaskActionResponse } from "~/types/task.types";

export async function handleTaskAction(
  request: Request
): Promise<TaskActionResponse> {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Use switch-case for cleaner intent routing
  switch (intent) {
    case "createTask":
      return await createTask(formData, user.id);

    case "updateTaskDetails":
      return await updateTaskDetails(formData);

    case "setTaskReminder":
      return await setTaskReminder(formData);

    case "updateCategory":
      return await updateCategory(formData);

    case "completeTask":
      return await completeTask(formData);

    case "incompleteTask":
      return await incompleteTask(formData);

    case "deleteTask":
      return await deleteTask(formData);

    case "addStep":
      return await addStep(formData, user.id);

    case "completeStep":
      return await completeStep(formData);

    case "deleteStep":
      return await deleteStep(formData);

    default:
      return handleLegacyActions(formData, user.id);
  }
}

// Individual action handlers for better organization

async function createTask(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as string | null;

  if (!title || !title.trim()) {
    return { success: false, error: "Task title is required" };
  }

  await db.insert(tasksTable).values({
    title: title.trim(),
    userId,
    description: description?.trim() || null,
    category: category?.trim() || null,
    createdAt: new Date(),
  });

  return { success: true, message: "Task created successfully" };
}

async function updateTaskDetails(
  formData: FormData
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("taskId"));
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as string | null;
  const reminderDate = formData.get("reminderDate") as string | null;

  if (!taskId || !title) {
    return { success: false, error: "Task ID and title are required" };
  }

  await db
    .update(tasksTable)
    .set({
      title: title.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      ...(reminderDate
        ? { reminderDate: new Date(reminderDate), reminderSent: 0 }
        : {}),
    })
    .where(eq(tasksTable.id, taskId));

  return { success: true, message: "Task updated successfully" };
}

async function setTaskReminder(
  formData: FormData
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("taskId"));
  const reminderDate = formData.get("reminderDate") as string | null;

  if (!taskId || !reminderDate) {
    return { success: false, error: "Task ID and reminder date are required" };
  }

  await db
    .update(tasksTable)
    .set({
      reminderDate: new Date(reminderDate),
      reminderSent: 0,
    })
    .where(eq(tasksTable.id, taskId));

  return { success: true, message: "Reminder set successfully" };
}

async function updateCategory(formData: FormData): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("updateCategory"));
  const category = (formData.get("category") as string) || null;

  await db
    .update(tasksTable)
    .set({ category })
    .where(eq(tasksTable.id, taskId));

  return { success: true, message: "Category updated successfully" };
}

async function completeTask(formData: FormData): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("completeTask"));

  if (!taskId) {
    return { success: false, error: "Task ID is required" };
  }

  await db
    .update(tasksTable)
    .set({ completedAt: new Date() })
    .where(eq(tasksTable.id, taskId));

  return { success: true, message: "Task marked as complete" };
}

async function incompleteTask(formData: FormData): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("incompleteTask"));

  if (!taskId) {
    return { success: false, error: "Task ID is required" };
  }

  await db.update(tasksTable).set({ completedAt: null }).where(eq(tasksTable.id, taskId));

  // Mark all task steps as incomplete
  await db
    .update(taskStepsTable)
    .set({ completedAt: null })
    .where(eq(taskStepsTable.taskId, taskId));

  return { success: true, message: "Task marked as incomplete" };
}

async function deleteTask(formData: FormData): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("deleteTask"));

  if (!taskId) {
    return { success: false, error: "Task ID is required" };
  }

  // Delete all task steps first
  await db.delete(taskStepsTable).where(eq(taskStepsTable.taskId, taskId));
  await db.delete(tasksTable).where(eq(tasksTable.id, taskId));

  return { success: true, message: "Task deleted successfully" };
}

async function addStep(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("taskId"));
  const stepDescription = formData.get("stepDescription") as string;

  if (!taskId || !stepDescription?.trim()) {
    return { success: false, error: "Task ID and step description are required" };
  }

  await db.insert(taskStepsTable).values({
    taskId,
    userId,
    description: stepDescription.trim(),
    createdAt: new Date(),
  });

  return { success: true, message: "Step added successfully" };
}

async function completeStep(formData: FormData): Promise<TaskActionResponse> {
  const stepId = Number(formData.get("completeStep"));
  const isChecked = formData.get("isChecked") === "true";

  if (!stepId) {
    return { success: false, error: "Step ID is required" };
  }

  // Update step completion status
  await db
    .update(taskStepsTable)
    .set({ completedAt: isChecked ? new Date() : null })
    .where(eq(taskStepsTable.id, stepId));

  // Update parent task completion based on all steps
  const [stepRecord] = await db
    .select()
    .from(taskStepsTable)
    .where(eq(taskStepsTable.id, stepId));

  if (stepRecord) {
    const allSteps = await db
      .select()
      .from(taskStepsTable)
      .where(eq(taskStepsTable.taskId, stepRecord.taskId));

    const allComplete =
      allSteps.length > 0 && allSteps.every((s) => s.completedAt !== null);

    await db
      .update(tasksTable)
      .set({ completedAt: allComplete ? new Date() : null })
      .where(eq(tasksTable.id, stepRecord.taskId));
  }

  return { success: true, message: "Step updated successfully" };
}

async function deleteStep(formData: FormData): Promise<TaskActionResponse> {
  const stepId = Number(formData.get("deleteStep"));

  if (!stepId) {
    return { success: false, error: "Step ID is required" };
  }

  await db.delete(taskStepsTable).where(eq(taskStepsTable.id, stepId));

  return { success: true, message: "Step deleted successfully" };
}

// Legacy action handler for backwards compatibility
async function handleLegacyActions(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  // Handle legacy form submissions that don't use intent field
  const deleteStepValue = formData.get("deleteStep");
  if (deleteStepValue && typeof deleteStepValue === "string" && deleteStepValue.trim()) {
    return await deleteStep(formData);
  }

  const deleteTaskValue = formData.get("deleteTask");
  if (deleteTaskValue && typeof deleteTaskValue === "string" && deleteTaskValue.trim()) {
    return await deleteTask(formData);
  }

  const completeTaskValue = formData.get("completeTask");
  if (completeTaskValue && typeof completeTaskValue === "string" && completeTaskValue.trim()) {
    return await completeTask(formData);
  }

  const incompleteTaskValue = formData.get("incompleteTask");
  if (incompleteTaskValue && typeof incompleteTaskValue === "string" && incompleteTaskValue.trim()) {
    return await incompleteTask(formData);
  }

  const completeStepLegacy = formData.get("completeStep");
  const isChecked = formData.get("isChecked");
  if (
    completeStepLegacy &&
    typeof completeStepLegacy === "string" &&
    completeStepLegacy.trim() &&
    typeof isChecked === "string"
  ) {
    return await completeStep(formData);
  }

  const stepDescription = formData.get("stepDescription");
  const taskIdForStep = formData.get("taskId");
  if (
    stepDescription &&
    typeof stepDescription === "string" &&
    stepDescription.trim() &&
    taskIdForStep &&
    typeof taskIdForStep === "string"
  ) {
    return await addStep(formData, userId);
  }

  const updateCategoryValue = formData.get("updateCategory");
  if (updateCategoryValue) {
    return await updateCategory(formData);
  }

  return { success: false, error: "No valid action found" };
}
