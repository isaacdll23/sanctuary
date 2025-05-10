import { db } from "~/db";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";

export async function handleTaskAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle 'updateTaskDetails' intent
  if (intent === "updateTaskDetails") {
    const taskId = Number(formData.get("taskId"));
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;

    if (!taskId || !title) {
      // Or handle more gracefully
      throw new Error("Task ID and Title are required for updating.");
    }

    await db
      .update(tasksTable)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        // Potentially add updatedAt: new Date() here if you have such a field
      })
      .where(eq(tasksTable.id, taskId));
    return { success: true, message: "Task details updated." }; // Optional: return a response
  }

  // Update category branch
  if (formData.get("updateCategory")) {
    const taskId = Number(formData.get("updateCategory"));
    const category = (formData.get("category") as string) || null;
    await db
      .update(tasksTable)
      .set({ category })
      .where(eq(tasksTable.id, taskId));
    return;
  }

  // Delete step branch
  const deleteStep = formData.get("deleteStep");
  if (typeof deleteStep === "string" && deleteStep.trim()) {
    const stepId = parseInt(deleteStep, 10);
    await db.delete(taskStepsTable).where(eq(taskStepsTable.id, stepId));
    return;
  }

  // Delete task branch
  const deleteTask = formData.get("deleteTask");
  if (typeof deleteTask === "string" && deleteTask.trim()) {
    const taskId = parseInt(deleteTask, 10);
    // Delete any task steps associated with the task
    await db.delete(taskStepsTable).where(eq(taskStepsTable.taskId, taskId));
    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
    return;
  }

  // Complete task branch
  const completeTask = formData.get("completeTask");
  if (typeof completeTask === "string" && completeTask.trim()) {
    const taskId = parseInt(completeTask, 10);
    await db
      .update(tasksTable)
      .set({ completedAt: new Date() })
      .where(eq(tasksTable.id, taskId));
    return;
  }

  // Incomplete task branch
  const incompleteTask = formData.get("incompleteTask");
  if (typeof incompleteTask === "string" && incompleteTask.trim()) {
    const taskId = parseInt(incompleteTask, 10);
    await db
      .update(tasksTable)
      .set({ completedAt: null })
      .where(eq(tasksTable.id, taskId));

    // Incomplete all task steps associated with the task
    await db
      .update(taskStepsTable)
      .set({ completedAt: null })
      .where(eq(taskStepsTable.taskId, taskId));
    return;
  }

  // Update step branch (complete/uncomplete)
  const completeStep = formData.get("completeStep");
  const isChecked = formData.get("isChecked");
  if (
    typeof completeStep === "string" &&
    completeStep.trim() &&
    typeof isChecked === "string"
  ) {
    const stepId = parseInt(completeStep, 10);
    if (isChecked === "true") {
      await db
        .update(taskStepsTable)
        .set({ completedAt: new Date() })
        .where(eq(taskStepsTable.id, stepId));
    } else {
      await db
        .update(taskStepsTable)
        .set({ completedAt: null })
        .where(eq(taskStepsTable.id, stepId));
    }

    // Determine the related task and update its completedAt status
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
      if (allComplete) {
        await db
          .update(tasksTable)
          .set({ completedAt: new Date() })
          .where(eq(tasksTable.id, stepRecord.taskId));
      } else {
        await db
          .update(tasksTable)
          .set({ completedAt: null })
          .where(eq(tasksTable.id, stepRecord.taskId));
      }
    }
    return;
  }

  // Create a new task step branch
  const stepDescription = formData.get("stepDescription");
  const taskIdForStep = formData.get("taskId");
  if (
    typeof stepDescription === "string" &&
    stepDescription.trim() &&
    typeof taskIdForStep === "string"
  ) {
    const taskId = parseInt(taskIdForStep, 10);
    await db.insert(taskStepsTable).values({
      taskId,
      userId: user.id,
      description: stepDescription.trim(),
      createdAt: new Date(),
    });
    return;
  }

  // Create task branch for new tasks
  const titleFromForm = formData.get("title"); // Renamed to avoid conflict with title in updateTaskDetails
  if (typeof titleFromForm !== "string" || !titleFromForm.trim()) {
    return { error: "Invalid task title provided" };
  }

  const descriptionFromForm = formData.get("description"); // Renamed
  const taskCategoryFromForm = formData.get("category"); // Renamed

  await db.insert(tasksTable).values({
    title: titleFromForm.trim(),
    userId: user.id,
    description: String(descriptionFromForm)?.trim(),
    category: String(taskCategoryFromForm)?.trim(),
    createdAt: new Date(),
  });
}
