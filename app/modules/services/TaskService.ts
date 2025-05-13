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
    return { success: true, message: "Category updated." };
  }

  // Delete step branch
  const deleteStep = formData.get("deleteStep");
  if (typeof deleteStep === "string" && deleteStep.trim()) {
    const stepId = parseInt(deleteStep, 10);
    await db.delete(taskStepsTable).where(eq(taskStepsTable.id, stepId));
    return { success: true, message: "Step deleted." };
  }

  // Delete task branch
  const deleteTask = formData.get("deleteTask");
  if (typeof deleteTask === "string" && deleteTask.trim()) {
    const taskId = parseInt(deleteTask, 10);
    // Delete any task steps associated with the task
    await db.delete(taskStepsTable).where(eq(taskStepsTable.taskId, taskId));
    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
    return { success: true, message: "Task deleted." };
  }

  // Complete task branch
  const completeTask = formData.get("completeTask");
  if (typeof completeTask === "string" && completeTask.trim()) {
    const taskId = parseInt(completeTask, 10);
    await db
      .update(tasksTable)
      .set({ completedAt: new Date() })
      .where(eq(tasksTable.id, taskId));
    return { success: true, message: "Task marked as complete." };
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
    return { success: true, message: "Task marked as incomplete." };
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
    return { success: true, message: "Step updated." };
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
    return { success: true, message: "Step added." };
  }

  // This is the fallback create task logic if no specific intent matches for other actions.
  // It is also hit if the "Add New Task" form (from tasks.tsx) is submitted,
  // assuming it sends an "intent=createTask" or similar, or if it's the only remaining action.
  // Given the previous changes, tasks.tsx sends intent=createTask.
  // We should ensure this block correctly handles that or that there's an explicit intent === 'createTask' block.

  // For now, let's assume this is the intended creation path if `intent` was `createTask` or not handled above.
  if (intent === "createTask") { // Explicitly check for createTask intent
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;

    if (!title || !title.trim()) {
      return { success: false, error: "Invalid task title provided" };
    }

    await db.insert(tasksTable).values({
      title: title.trim(),
      userId: user.id,
      description: description?.trim() || null,
      category: category?.trim() || null,
      createdAt: new Date(),
    });
    return { success: true, type: "taskCreation", message: "Task created." };
  }
  
  // Fallback for the original create task logic if no intent matched and it wasn't createTask
  // This part might be redundant if all actions are intent-driven.
  const titleFromForm = formData.get("title");
  if (typeof titleFromForm === "string" && titleFromForm.trim()) {
    // This will only be hit if no other condition was met, and there was no 'createTask' intent,
    // but a 'title' was still present. This maintains previous behavior for any non-intent based submissions
    // that might have only sent a title.
    const descriptionFromForm = formData.get("description"); 
    const taskCategoryFromForm = formData.get("category"); 

    await db.insert(tasksTable).values({
      title: titleFromForm.trim(),
      userId: user.id,
      description: String(descriptionFromForm)?.trim() || null,
      category: String(taskCategoryFromForm)?.trim() || null,
      createdAt: new Date(),
    });
    // This specific return helps differentiate if needed, but generally, a success is a success.
    return { success: true, type: "taskCreation_fallback", message: "Task created (fallback)." };
  }

  // If no action was taken, and no title for fallback creation, return a generic response or error
  return { success: false, error: "No action taken or invalid request." };
}
