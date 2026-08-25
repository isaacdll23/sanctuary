import { db } from "~/db";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
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
      return await updateTaskDetails(formData, user.id);

    case "setTaskReminder":
      return await setTaskReminder(formData, user.id);

    case "updateCategory":
      return await updateCategory(formData, user.id);

    case "completeTask":
      return await completeTask(formData, user.id);

    case "incompleteTask":
      return await incompleteTask(formData, user.id);

    case "deleteTask":
      return await deleteTask(formData, user.id);

    case "addStep":
      return await addStep(formData, user.id);

    case "completeStep":
      return await completeStep(formData, user.id);

    case "deleteStep":
      return await deleteStep(formData, user.id);

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
  formData: FormData,
  userId: number
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
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

  return { success: true, message: "Task updated successfully" };
}

async function setTaskReminder(
  formData: FormData,
  userId: number
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
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

  return { success: true, message: "Reminder set successfully" };
}

async function updateCategory(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("updateCategory"));
  const category = (formData.get("category") as string) || null;

  await db
    .update(tasksTable)
    .set({ category })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

  return { success: true, message: "Category updated successfully" };
}

async function completeTask(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("completeTask"));

  if (!taskId) {
    return { success: false, error: "Task ID is required" };
  }

  await db
    .update(tasksTable)
    .set({ completedAt: new Date() })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

  return { success: true, message: "Task marked as complete" };
}

async function incompleteTask(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("incompleteTask"));

  if (!taskId) {
    return { success: false, error: "Task ID is required" };
  }

  await db
    .update(tasksTable)
    .set({ completedAt: null })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

  // Mark all task steps as incomplete
  await db
    .update(taskStepsTable)
    .set({ completedAt: null })
    .where(
      and(
        eq(taskStepsTable.taskId, taskId),
        eq(taskStepsTable.userId, userId)
      )
    );

  return { success: true, message: "Task marked as incomplete" };
}

async function deleteTask(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const taskId = Number(formData.get("deleteTask"));

  if (!taskId) {
    return { success: false, error: "Task ID is required" };
  }

  // Delete all task steps first
  await db
    .delete(taskStepsTable)
    .where(and(eq(taskStepsTable.taskId, taskId), eq(taskStepsTable.userId, userId)));
  await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

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

  const task = await db
    .select({ id: tasksTable.id })
    .from(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))
    .limit(1);
  if (task.length === 0) {
    return { success: false, error: "Task not found or permission denied" };
  }

  await db.insert(taskStepsTable).values({
    taskId,
    userId,
    description: stepDescription.trim(),
    createdAt: new Date(),
  });

  return { success: true, message: "Step added successfully" };
}

async function completeStep(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const stepId = Number(formData.get("completeStep"));
  const isChecked = formData.get("isChecked") === "true";

  if (!stepId) {
    return { success: false, error: "Step ID is required" };
  }

  // Update step completion status (step must belong to a task owned by the user)
  await db
    .update(taskStepsTable)
    .set({ completedAt: isChecked ? new Date() : null })
    .where(
      and(
        eq(taskStepsTable.id, stepId),
        eq(taskStepsTable.userId, userId)
      )
    );

  // Update parent task completion based on all steps
  const [stepRecord] = await db
    .select()
    .from(taskStepsTable)
    .where(
      and(
        eq(taskStepsTable.id, stepId),
        eq(taskStepsTable.userId, userId)
      )
    );

  if (stepRecord) {
    const allSteps = await db
      .select()
      .from(taskStepsTable)
      .where(
        and(
          eq(taskStepsTable.taskId, stepRecord.taskId),
          eq(taskStepsTable.userId, userId)
        )
      );

    const allComplete =
      allSteps.length > 0 && allSteps.every((s) => s.completedAt !== null);

    await db
      .update(tasksTable)
      .set({ completedAt: allComplete ? new Date() : null })
      .where(
        and(
          eq(tasksTable.id, stepRecord.taskId),
          eq(tasksTable.userId, userId)
        )
      );
  }

  return { success: true, message: "Step updated successfully" };
}

async function deleteStep(
  formData: FormData,
  userId: number
): Promise<TaskActionResponse> {
  const stepId = Number(formData.get("deleteStep"));

  if (!stepId) {
    return { success: false, error: "Step ID is required" };
  }

  await db
    .delete(taskStepsTable)
    .where(and(eq(taskStepsTable.id, stepId), eq(taskStepsTable.userId, userId)));

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
    return await deleteStep(formData, userId);
  }

  const deleteTaskValue = formData.get("deleteTask");
  if (deleteTaskValue && typeof deleteTaskValue === "string" && deleteTaskValue.trim()) {
    return await deleteTask(formData, userId);
  }

  const completeTaskValue = formData.get("completeTask");
  if (completeTaskValue && typeof completeTaskValue === "string" && completeTaskValue.trim()) {
    return await completeTask(formData, userId);
  }

  const incompleteTaskValue = formData.get("incompleteTask");
  if (incompleteTaskValue && typeof incompleteTaskValue === "string" && incompleteTaskValue.trim()) {
    return await incompleteTask(formData, userId);
  }

  const completeStepLegacy = formData.get("completeStep");
  const isChecked = formData.get("isChecked");
  if (
    completeStepLegacy &&
    typeof completeStepLegacy === "string" &&
    completeStepLegacy.trim() &&
    typeof isChecked === "string"
  ) {
    return await completeStep(formData, userId);
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
    return await updateCategory(formData, userId);
  }

  return { success: false, error: "No valid action found" };
}
