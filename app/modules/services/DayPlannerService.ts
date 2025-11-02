import { db } from "~/db";
import { dayPlansTable, dayPlanSectionsTable, dayPlannerGoogleSyncMappingTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromSession } from "../auth.server";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  timeZone: string;
};

export async function handleDayPlannerAction(request: Request) {
  const user = await getUserFromSession(request);
  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "createOrUpdatePlan") {
    return createOrUpdatePlan(user, formData);
  }

  if (intent === "createTask") {
    return createTask(user, formData);
  }

  if (intent === "updateTask") {
    return updateTask(user, formData);
  }

  if (intent === "deleteTask") {
    return deleteTask(user, formData);
  }

  if (intent === "toggleTaskComplete") {
    return toggleTaskComplete(user, formData);
  }

  if (intent === "moveTask") {
    return moveTask(user, formData);
  }

  if (intent === "deletePlan") {
    return deletePlan(user, formData);
  }

  return { success: false, message: "Invalid intent" };
}

async function createOrUpdatePlan(user: User, formData: FormData) {
  const planDate = formData.get("planDate") as string;
  const viewStartTime = (formData.get("viewStartTime") as string) || "06:00:00";
  const viewEndTime = (formData.get("viewEndTime") as string) || "22:00:00";
  const timeZone = (formData.get("timeZone") as string) || user.timeZone;

  if (!planDate) {
    return { success: false, message: "Missing plan date" };
  }

  // Check if plan already exists
  const existingPlan = await db
    .select()
    .from(dayPlansTable)
    .where(
      and(
        eq(dayPlansTable.userId, user.id),
        eq(dayPlansTable.planDate, planDate)
      )
    )
    .limit(1);

  let planId: string;

  if (existingPlan.length > 0) {
    // Update existing plan
    planId = existingPlan[0].id;
    await db
      .update(dayPlansTable)
      .set({
        viewStartTime,
        viewEndTime,
        timeZone,
        updatedAt: new Date(),
      })
      .where(eq(dayPlansTable.id, planId));
  } else {
    // Create new plan (no tasks yet)
    const [newPlan] = await db
      .insert(dayPlansTable)
      .values({
        userId: user.id,
        planDate,
        viewStartTime,
        viewEndTime,
        timeZone,
      })
      .returning();

    planId = newPlan.id;
  }

  return { success: true, message: "Plan created successfully", planId };
}

async function createTask(user: User, formData: FormData) {
  const planId = formData.get("planId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startTime = formData.get("startTime") as string;
  const color = (formData.get("color") as string) || "indigo";
  const durationMinutes = parseInt(
    formData.get("durationMinutes") as string,
    10
  );

  if (!planId || !title || !startTime || !durationMinutes) {
    return { success: false, message: "Missing required fields" };
  }

  // Verify plan belongs to user
  const [plan] = await db
    .select()
    .from(dayPlansTable)
    .where(and(eq(dayPlansTable.id, planId), eq(dayPlansTable.userId, user.id)))
    .limit(1);

  if (!plan) {
    return { success: false, message: "Plan not found" };
  }

  // Create task
  const [task] = await db
    .insert(dayPlanSectionsTable)
    .values({
      userId: user.id,
      planId,
      title,
      description: description || null,
      startTime,
      durationMinutes,
      color,
      completedAt: null,
    })
    .returning();

  // Trigger auto-sync to Google Calendar if enabled
  const { triggerAutoSync } = await import("./GoogleCalendarService");
  const planDate = new Date(plan.planDate).toISOString().split("T")[0];
  const syncResult = await triggerAutoSync(user.id, planDate);

  return {
    success: true,
    message: "Task created",
    task,
    syncStatus: {
      attempted: syncResult.syncAttempted,
      message: syncResult.message,
    },
  };
}

async function updateTask(user: User, formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startTime = formData.get("startTime") as string;
  const color = formData.get("color") as string;
  const durationMinutes = formData.get("durationMinutes")
    ? parseInt(formData.get("durationMinutes") as string, 10)
    : undefined;

  if (!taskId) {
    return { success: false, message: "Missing task ID" };
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description || null;
  if (startTime !== undefined) updateData.startTime = startTime;
  if (color !== undefined) updateData.color = color;
  if (durationMinutes !== undefined)
    updateData.durationMinutes = durationMinutes;

  await db
    .update(dayPlanSectionsTable)
    .set(updateData)
    .where(
      and(
        eq(dayPlanSectionsTable.id, taskId),
        eq(dayPlanSectionsTable.userId, user.id)
      )
    );

  return { success: true, message: "Task updated" };
}

async function deleteTask(user: User, formData: FormData) {
  const taskId = formData.get("taskId") as string;

  if (!taskId) {
    return { success: false, message: "Missing task ID" };
  }

  // Get the sync mapping if it exists
  const mappings = await db
    .select()
    .from(dayPlannerGoogleSyncMappingTable)
    .where(eq(dayPlannerGoogleSyncMappingTable.dayPlanSectionId, taskId));

  // If there's a Google Calendar sync, delete the event from Google Calendar first
  if (mappings.length > 0) {
    try {
      const { getValidAccessToken, getGoogleCalendarAccount } = await import(
        "./GoogleCalendarService"
      );
      const mapping = mappings[0];
      const account = await getGoogleCalendarAccount(user.id);
      
      if (account) {
        const accessToken = await getValidAccessToken(user.id);
        if (accessToken) {
          const { googleCalendarApiClient } = await import(
            "./GoogleCalendarApiClient"
          );
          await googleCalendarApiClient.deleteEvent(
            account.googleCalendarId,
            mapping.googleEventId,
            accessToken
          );
        }
      }
    } catch (error) {
      // Log the error but continue with local deletion
      console.error("Error deleting Google Calendar event:", error);
    }
  }

  // Delete the sync mapping
  await db
    .delete(dayPlannerGoogleSyncMappingTable)
    .where(eq(dayPlannerGoogleSyncMappingTable.dayPlanSectionId, taskId));

  // Then delete the task itself
  await db
    .delete(dayPlanSectionsTable)
    .where(
      and(
        eq(dayPlanSectionsTable.id, taskId),
        eq(dayPlanSectionsTable.userId, user.id)
      )
    );

  return { success: true, message: "Task deleted" };
}

async function toggleTaskComplete(user: User, formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const completed = formData.get("completed") === "true";

  if (!taskId) {
    return { success: false, message: "Missing task ID" };
  }

  await db
    .update(dayPlanSectionsTable)
    .set({
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dayPlanSectionsTable.id, taskId),
        eq(dayPlanSectionsTable.userId, user.id)
      )
    );

  return {
    success: true,
    message: completed ? "Task completed" : "Task marked incomplete",
  };
}

async function moveTask(user: User, formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const newStartTime = formData.get("newStartTime") as string;

  if (!taskId || !newStartTime) {
    return { success: false, message: "Missing required fields" };
  }

  await db
    .update(dayPlanSectionsTable)
    .set({
      startTime: newStartTime,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dayPlanSectionsTable.id, taskId),
        eq(dayPlanSectionsTable.userId, user.id)
      )
    );

  return { success: true, message: "Task moved" };
}

async function deletePlan(user: User, formData: FormData) {
  const planId = formData.get("planId") as string;

  if (!planId) {
    return { success: false, message: "Missing plan ID" };
  }

  // Get all task IDs for this plan to clean up sync mappings
  const tasks = await db
    .select({ id: dayPlanSectionsTable.id })
    .from(dayPlanSectionsTable)
    .where(
      and(
        eq(dayPlanSectionsTable.planId, planId),
        eq(dayPlanSectionsTable.userId, user.id)
      )
    );

  // Delete Google Calendar sync mappings and events for all tasks in this plan
  try {
    const { getValidAccessToken, getGoogleCalendarAccount } = await import(
      "./GoogleCalendarService"
    );
    const account = await getGoogleCalendarAccount(user.id);
    
    if (account) {
      const accessToken = await getValidAccessToken(user.id);
      if (accessToken) {
        const { googleCalendarApiClient } = await import(
          "./GoogleCalendarApiClient"
        );
        
        for (const task of tasks) {
          const mappings = await db
            .select()
            .from(dayPlannerGoogleSyncMappingTable)
            .where(eq(dayPlannerGoogleSyncMappingTable.dayPlanSectionId, task.id));
          
          for (const mapping of mappings) {
            try {
              await googleCalendarApiClient.deleteEvent(
                account.googleCalendarId,
                mapping.googleEventId,
                accessToken
              );
            } catch (error) {
              // Event might have already been deleted on Google
              console.error("Error deleting Google Calendar event:", error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error deleting Google Calendar events during plan deletion:", error);
  }

  // Delete all sync mappings for tasks in this plan
  for (const task of tasks) {
    await db
      .delete(dayPlannerGoogleSyncMappingTable)
      .where(eq(dayPlannerGoogleSyncMappingTable.dayPlanSectionId, task.id));
  }

  // Delete tasks
  await db
    .delete(dayPlanSectionsTable)
    .where(
      and(
        eq(dayPlanSectionsTable.planId, planId),
        eq(dayPlanSectionsTable.userId, user.id)
      )
    );

  // Delete plan
  await db
    .delete(dayPlansTable)
    .where(
      and(eq(dayPlansTable.id, planId), eq(dayPlansTable.userId, user.id))
    );

  return { success: true, message: "Plan deleted successfully" };
}

export async function getDayPlan(userId: number, planDate: string) {
  const [plan] = await db
    .select()
    .from(dayPlansTable)
    .where(
      and(
        eq(dayPlansTable.userId, userId),
        eq(dayPlansTable.planDate, planDate)
      )
    )
    .limit(1);

  if (!plan) {
    return null;
  }

  const tasks = await db
    .select()
    .from(dayPlanSectionsTable)
    .where(eq(dayPlanSectionsTable.planId, plan.id))
    .orderBy(dayPlanSectionsTable.startTime);

  return {
    ...plan,
    tasks,
  };
}
