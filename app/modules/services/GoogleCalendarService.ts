import { db } from "~/db";
import {
  googleCalendarAccountsTable,
  dayPlannerGoogleSyncMappingTable,
  dayPlanSectionsTable,
  dayPlansTable,
  usersTable,
} from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromSession, refreshGoogleAccessToken } from "~/modules/auth.server";
import { googleCalendarApiClient } from "~/modules/services/GoogleCalendarApiClient";
import { encryptToken, decryptToken } from "~/modules/services/TokenEncryptionService";

type User = {
  id: number;
  username: string;
  email: string;
  timeZone: string;
  googleCalendarConnected: number;
  googleCalendarPreferences: unknown;
};

type DayPlanSection = {
  id: string;
  userId: number;
  planId: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  color: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface GoogleEventData {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

/**
 * GoogleCalendarService
 *
 * Handles all Google Calendar synchronization operations including:
 * - Account management (connect, disconnect)
 * - Event sync (pull from Google, push to Google)
 * - Event conversion (local task ↔ Google event)
 * - Conflict detection and resolution
 */

/**
 * Handles Google Calendar related actions from forms
 */
export async function handleGoogleCalendarAction(request: Request) {
  const user = await getUserFromSession(request);
  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "disconnectGoogleCalendar":
      return await disconnectGoogleCalendar(user.id);

    case "updateSyncPreferences":
      return await updateSyncPreferences(user.id, formData);

    case "manualSyncGoogleCalendar":
      return await manualSyncGoogleCalendar(user.id, formData);

    case "resolveSyncConflict":
      return await resolveSyncConflict(user.id, formData);

    default:
      return { success: false, message: "Invalid intent" };
  }
}

/**
 * Disconnects Google Calendar account
 */
export async function disconnectGoogleCalendar(userId: number) {
  try {
    const account = await db
      .select()
      .from(googleCalendarAccountsTable)
      .where(eq(googleCalendarAccountsTable.userId, userId));

    if (account.length === 0) {
      return { success: false, message: "No Google Calendar account found" };
    }

    // Update account to mark as disconnected
    await db
      .update(googleCalendarAccountsTable)
      .set({
        isSyncEnabled: 0,
        disconnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarAccountsTable.userId, userId));

    // Update user's googleCalendarConnected flag
    await db
      .update(usersTable)
      .set({
        googleCalendarConnected: 0,
      })
      .where(eq(usersTable.id, userId));

    return { success: true, message: "Google Calendar disconnected successfully" };
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return { success: false, message: "Failed to disconnect Google Calendar" };
  }
}

/**
 * Updates user's sync preferences
 */
export async function updateSyncPreferences(userId: number, formData: FormData) {
  try {
    const syncDirection = (formData.get("syncDirection") as string) || "bidirectional";
    const syncCalendarColors = formData.get("syncCalendarColors") === "true";
    const includeDescription = formData.get("includeDescription") === "true";

    const preferences = {
      syncCalendarColors,
      includeDescription,
    };

    await db
      .update(googleCalendarAccountsTable)
      .set({
        syncDirection: syncDirection as "pull-only" | "push-only" | "bidirectional",
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarAccountsTable.userId, userId));

    await db
      .update(usersTable)
      .set({
        googleCalendarPreferences: preferences,
      })
      .where(eq(usersTable.id, userId));

    return { success: true, message: "Sync preferences updated successfully" };
  } catch (error) {
    console.error("Error updating sync preferences:", error);
    return { success: false, message: "Failed to update sync preferences" };
  }
}

/**
 * Manually triggers sync for a specific date
 */
export async function manualSyncGoogleCalendar(userId: number, formData: FormData) {
  try {
    const planDate = (formData.get("planDate") as string) || new Date().toISOString().split("T")[0];

    // Get user's Google Calendar account
    const account = await getGoogleCalendarAccount(userId);
    if (!account) {
      return { success: false, message: "Google Calendar not connected" };
    }

    if (!account.isSyncEnabled) {
      return { success: false, message: "Google Calendar sync is disabled" };
    }

    // Sync based on direction preference
    switch (account.syncDirection) {
      case "pull-only":
        await syncGoogleEventsToLocalPlan(userId, planDate);
        break;
      case "push-only":
        await syncLocalTasksToGoogle(userId, planDate);
        break;
      case "bidirectional":
        await handleBidirectionalSync(userId, planDate);
        break;
    }

    // Update last sync timestamp
    await db
      .update(googleCalendarAccountsTable)
      .set({
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarAccountsTable.userId, userId));

    return { success: true, message: "Google Calendar synced successfully" };
  } catch (error) {
    console.error("Error during manual sync:", error);
    return { success: false, message: "Failed to sync with Google Calendar" };
  }
}

/**
 * Resolves a sync conflict
 */
export async function resolveSyncConflict(userId: number, formData: FormData) {
  try {
    const mappingId = formData.get("mappingId") as string;
    const resolution = (formData.get("resolution") as string) as "local-wins" | "remote-wins" | "manual";

    if (!mappingId || !resolution) {
      return { success: false, message: "Missing required fields" };
    }

    await db
      .update(dayPlannerGoogleSyncMappingTable)
      .set({
        conflictResolution: resolution,
        syncStatus: "synced",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dayPlannerGoogleSyncMappingTable.id, mappingId),
          eq(dayPlannerGoogleSyncMappingTable.userId, userId)
        )
      );

    return { success: true, message: "Conflict resolved successfully" };
  } catch (error) {
    console.error("Error resolving conflict:", error);
    return { success: false, message: "Failed to resolve conflict" };
  }
}

/**
 * Gets user's Google Calendar account details
 */
export async function getGoogleCalendarAccount(userId: number) {
  const accounts = await db
    .select()
    .from(googleCalendarAccountsTable)
    .where(eq(googleCalendarAccountsTable.userId, userId));

  return accounts.length > 0 ? accounts[0] : null;
}

/**
 * Checks if user's Google Calendar account is connected
 */
export async function isGoogleCalendarConnected(userId: number): Promise<boolean> {
  const account = await getGoogleCalendarAccount(userId);
  return !!account && account.isSyncEnabled === 1;
}

/**
 * Gets decrypted access token, refreshing if needed
 */
export async function getValidAccessToken(userId: number): Promise<string | null> {
  try {
    const account = await getGoogleCalendarAccount(userId);
    if (!account) return null;

    // Check if token has expired
    if (new Date(account.tokenExpiresAt) < new Date()) {
      // Refresh token
      const decryptedRefreshToken = decryptToken(account.refreshToken);
      const { accessToken, expiresIn } = await refreshGoogleAccessToken(decryptedRefreshToken);

      // Update database with new token
      const encryptedAccessToken = encryptToken(accessToken);
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      await db
        .update(googleCalendarAccountsTable)
        .set({
          accessToken: encryptedAccessToken,
          tokenExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(googleCalendarAccountsTable.userId, userId));

      return accessToken;
    }

    // Decrypt and return existing token
    return decryptToken(account.accessToken);
  } catch (error) {
    console.error("Error getting valid access token:", error);
    return null;
  }
}

/**
 * Converts a Day Planner section to a Google Calendar event
 */
/**
 * Converts a local task to a Google Calendar event with proper timezone handling
 */
export function convertLocalTaskToGoogleEvent(
  task: DayPlanSection,
  planDate: string,
  timeZone: string
): GoogleEventData {
  // Extract just HH:MM from startTime (handles both "HH:MM" and "HH:MM:SS" PostgreSQL time format)
  const timeOnly = task.startTime.substring(0, 5); // "HH:MM"
  
  // Create the start datetime string in ISO format
  // This represents the local time in the user's timezone
  const startDateTime = `${planDate}T${timeOnly}:00`;
  
  // Calculate end time by adding duration minutes to the start time
  // We must do this in local time (using the HH:MM representation), not UTC
  const [hours, minutes] = timeOnly.split(":").map(Number);
  let endHours = hours;
  let endMinutes = minutes + task.durationMinutes;
  
  // Handle minute overflow
  if (endMinutes >= 60) {
    endHours += Math.floor(endMinutes / 60);
    endMinutes = endMinutes % 60;
  }
  
  // Handle hour overflow (shouldn't happen for a day planner, but be safe)
  endHours = endHours % 24;
  
  const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`;
  const endDateTime = `${planDate}T${endTimeStr}`;

  return {
    summary: task.title,
    description: task.description || undefined,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
  };
}

/**
 * Converts a Google Calendar event to a Day Planner section with proper timezone handling
 */
export function convertGoogleEventToLocalTask(
  event: any,
  planId: string,
  userId: number,
  userTimeZone?: string
): Partial<DayPlanSection> {
  const startTime = event.start?.dateTime || event.start?.date;
  const endTime = event.end?.dateTime || event.end?.date;

  if (!startTime) {
    throw new Error("Event must have a start time");
  }

  // If the event has a timeZone field, use it; otherwise use the user's timezone
  const eventTimeZone = event.start?.timeZone || userTimeZone || "UTC";

  // Parse the time - if it's a date string like "2025-11-02", it's an all-day event
  let startDate: Date;
  let endDate: Date;

  if (startTime.includes("T")) {
    // DateTime format - already has time information
    startDate = new Date(startTime);
    endDate = new Date(endTime || startTime);
  } else {
    // Date-only format (all-day event) - treat as midnight in the event's timezone
    startDate = new Date(`${startTime}T00:00:00`);
    endDate = new Date(`${endTime || startTime}T23:59:59`);
  }

  // Extract time in HH:MM format
  // If the event has a timeZone, we need to convert it to that timezone
  // For now, we extract from the dateTime which should already be in the correct format
  let timeStr: string;

  if (startTime.includes("T")) {
    // Extract time part directly from the ISO string
    timeStr = startTime.split("T")[1].substring(0, 5);
  } else {
    // All-day event - use midnight
    timeStr = "00:00";
  }

  const durationMinutes = Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

  return {
    planId,
    userId,
    title: event.summary || "Untitled Event",
    description: event.description || null,
    startTime: timeStr,
    durationMinutes,
  };
}

/**
 * Syncs Google Calendar events to local Day Plan (pull)
 */
export async function syncGoogleEventsToLocalPlan(userId: number, planDate: string) {
  try {
    const account = await getGoogleCalendarAccount(userId);
    if (!account) return;

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return;

    // Get user for timezone info
    const userRecords = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (userRecords.length === 0) return;
    const userTimeZone = userRecords[0].timeZone;

    // Get or create the day plan for this date
    let dayPlan = await db
      .select()
      .from(dayPlansTable)
      .where(
        and(
          eq(dayPlansTable.userId, userId),
          eq(dayPlansTable.planDate, planDate)
        )
      )
      .limit(1);

    if (dayPlan.length === 0) {
      const [newPlan] = await db
        .insert(dayPlansTable)
        .values({
          userId,
          planDate,
          timeZone: userTimeZone,
          viewStartTime: "06:00:00",
          viewEndTime: "22:00:00",
        })
        .returning();

      dayPlan = [newPlan];
    }

    const planId = dayPlan[0].id;

    // Fetch Google events for the date
    const startOfDay = new Date(`${planDate}T00:00:00`).toISOString();
    const endOfDay = new Date(`${planDate}T23:59:59`).toISOString();

    const googleEvents = await googleCalendarApiClient.listEvents(
      account.googleCalendarId,
      accessToken,
      startOfDay,
      endOfDay
    );

    if (!googleEvents.items || googleEvents.items.length === 0) {
      return;
    }

    // For each Google event, create or update mapping
    for (const event of googleEvents.items) {
      // Check if mapping already exists
      const existingMapping = await db
        .select()
        .from(dayPlannerGoogleSyncMappingTable)
        .where(
          and(
            eq(dayPlannerGoogleSyncMappingTable.userId, userId),
            eq(dayPlannerGoogleSyncMappingTable.googleEventId, event.id)
          )
        );

      if (existingMapping.length === 0) {
        // Convert Google event to local task
        const localTaskData = convertGoogleEventToLocalTask(event, planId, userId, userTimeZone);

        // Create the local task
        const [localTask] = await db
          .insert(dayPlanSectionsTable)
          .values({
            userId,
            planId,
            title: localTaskData.title!,
            description: localTaskData.description || null,
            startTime: localTaskData.startTime!,
            durationMinutes: localTaskData.durationMinutes!,
            color: "indigo",
          })
          .returning();

        // Create mapping with the new local task ID
        await db.insert(dayPlannerGoogleSyncMappingTable).values({
          userId,
          dayPlanSectionId: localTask.id,
          googleEventId: event.id,
          googleCalendarId: account.googleCalendarId,
          googleLastModified: new Date(event.updated),
          syncStatus: "synced",
        });
      }
    }
  } catch (error) {
    console.error("Error syncing Google events to local plan:", error);
    throw error;
  }
}

/**
 * Syncs local Day Planner tasks to Google Calendar (push)
 */
export async function syncLocalTasksToGoogle(userId: number, planDate: string) {
  try {
    const account = await getGoogleCalendarAccount(userId);
    if (!account) return;

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return;

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (user.length === 0) return;

    const timeZone = user[0].timeZone;

    // Get Day Plan sections for the specific date
    const dayPlansQuery = await db
      .select()
      .from(dayPlanSectionsTable)
      .innerJoin(dayPlansTable, eq(dayPlanSectionsTable.planId, dayPlansTable.id))
      .where(
        and(
          eq(dayPlanSectionsTable.userId, userId),
          eq(dayPlansTable.planDate, planDate)
        )
      );

    // Process each local task
    for (const row of dayPlansQuery) {
      const task = row.day_plan_sections;
      const existingMapping = await db
        .select()
        .from(dayPlannerGoogleSyncMappingTable)
        .where(eq(dayPlannerGoogleSyncMappingTable.dayPlanSectionId, task.id));

      if (existingMapping.length === 0 && !task.completedAt) {
        // CREATE: New task without mapping - create Google event
        const eventData = convertLocalTaskToGoogleEvent(task, planDate, timeZone);
        const googleEvent = await googleCalendarApiClient.createEvent(
          account.googleCalendarId,
          accessToken,
          eventData
        );

        // Create mapping
        await db.insert(dayPlannerGoogleSyncMappingTable).values({
          userId,
          dayPlanSectionId: task.id,
          googleEventId: googleEvent.id as string,
          googleCalendarId: account.googleCalendarId,
          localLastModified: task.updatedAt,
          googleLastModified: new Date(),
          syncStatus: "synced",
        });
      } else if (existingMapping.length > 0 && !task.completedAt) {
        // UPDATE: Task has mapping and local changes - update Google event
        const mapping = existingMapping[0];
        
        // Check if local task was modified since last sync
        const localLastSync = mapping.localLastModified || mapping.createdAt;
        if (task.updatedAt > localLastSync) {
          // Local task was modified, push changes to Google
          const eventData = convertLocalTaskToGoogleEvent(task, planDate, timeZone);
          
          await googleCalendarApiClient.updateEvent(
            account.googleCalendarId,
            mapping.googleEventId,
            accessToken,
            eventData
          );

          // Update mapping with new sync timestamps
          await db
            .update(dayPlannerGoogleSyncMappingTable)
            .set({
              localLastModified: task.updatedAt,
              googleLastModified: new Date(),
              syncStatus: "synced",
            })
            .where(eq(dayPlannerGoogleSyncMappingTable.id, mapping.id));
        }
      }
    }
  } catch (error) {
    console.error("Error syncing local tasks to Google:", error);
    throw error;
  }
}

/**
 * Handles bidirectional sync (pull and push with conflict detection)
 */
export async function handleBidirectionalSync(userId: number, planDate: string) {
  try {
    // First pull from Google
    await syncGoogleEventsToLocalPlan(userId, planDate);

    // Then push local changes
    await syncLocalTasksToGoogle(userId, planDate);

    // Detect and flag conflicts
    await detectAndFlagConflicts(userId, planDate);
  } catch (error) {
    console.error("Error during bidirectional sync:", error);
    throw error;
  }
}

/**
 * Detects and flags sync conflicts
 */
export async function detectAndFlagConflicts(userId: number, planDate: string) {
  try {
    // Get mappings for this user and date with valid local tasks
    const mappings = await db
      .select()
      .from(dayPlannerGoogleSyncMappingTable)
      .innerJoin(dayPlanSectionsTable, eq(dayPlannerGoogleSyncMappingTable.dayPlanSectionId, dayPlanSectionsTable.id))
      .innerJoin(dayPlansTable, eq(dayPlanSectionsTable.planId, dayPlansTable.id))
      .where(
        and(
          eq(dayPlannerGoogleSyncMappingTable.userId, userId),
          eq(dayPlansTable.planDate, planDate)
        )
      );

    const account = await getGoogleCalendarAccount(userId);
    if (!account) return;

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return;

    for (const row of mappings) {
      const mapping = row.day_planner_google_sync_mapping;
      const localTask = row.day_plan_sections;

      // Get Google event
      try {
        const googleEvent = await googleCalendarApiClient.getEvent(
          account.googleCalendarId,
          mapping.googleEventId,
          accessToken
        );

        // Compare timestamps to detect real conflicts
        // A conflict occurs if the local task was modified since the last sync AND the Google event was modified since the last sync
        const googleUpdated = new Date(googleEvent.updated as string | number);
        const localLastSync = mapping.localLastModified ? new Date(mapping.localLastModified) : new Date(mapping.createdAt);
        const googleLastSync = mapping.googleLastModified ? new Date(mapping.googleLastModified) : new Date(mapping.createdAt);

        const localModifiedSinceSync = localTask.updatedAt > localLastSync;
        const googleModifiedSinceSync = googleUpdated > googleLastSync;

        if (localModifiedSinceSync && googleModifiedSinceSync) {
          // Real conflict detected: both were modified since their last sync
          await db
            .update(dayPlannerGoogleSyncMappingTable)
            .set({
              syncStatus: "conflict",
              updatedAt: new Date(),
            })
            .where(eq(dayPlannerGoogleSyncMappingTable.id, mapping.id));
        } else if (mapping.syncStatus === "conflict") {
          // Clear the conflict status if no longer a conflict
          await db
            .update(dayPlannerGoogleSyncMappingTable)
            .set({
              syncStatus: "synced",
              updatedAt: new Date(),
            })
            .where(eq(dayPlannerGoogleSyncMappingTable.id, mapping.id));
        }
      } catch (error) {
        // Event might have been deleted
        console.error("Error fetching Google event during conflict detection:", error);
      }
    }
  } catch (error) {
    console.error("Error detecting conflicts:", error);
    throw error;
  }
}

/**
 * Gets sync status for tasks on a specific date
 */
export async function getTaskSyncStatus(userId: number, planDate: string) {
  try {
    const mappings = await db
      .select()
      .from(dayPlannerGoogleSyncMappingTable)
      .where(eq(dayPlannerGoogleSyncMappingTable.userId, userId));

    // Build a map of taskId -> syncStatus
    const syncStatusMap = new Map();
    for (const mapping of mappings) {
      syncStatusMap.set(mapping.dayPlanSectionId, {
        syncStatus: mapping.syncStatus,
        conflictResolution: mapping.conflictResolution,
        googleEventId: mapping.googleEventId,
      });
    }

    return syncStatusMap;
  } catch (error) {
    console.error("Error getting task sync status:", error);
    return new Map();
  }
}

/**
 * Auto-sync trigger - orchestrates sync based on user's sync direction preference
 * Used internally for automatic syncing when tasks are created or page loads
 * Errors are logged but not thrown to prevent blocking operations
 */
export async function triggerAutoSync(
  userId: number,
  planDate: string
): Promise<{ success: boolean; syncAttempted: boolean; message: string }> {
  try {
    // Check if user has Google Calendar sync enabled
    const account = await getGoogleCalendarAccount(userId);
    if (!account || account.isSyncEnabled !== 1) {
      return {
        success: true,
        syncAttempted: false,
        message: "Google Calendar sync not enabled",
      };
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      console.warn(`[Auto-Sync] Failed to get valid access token for user ${userId}`);
      return {
        success: true,
        syncAttempted: false,
        message: "Could not authenticate with Google Calendar",
      };
    }

    // Perform sync based on direction preference
    try {
      switch (account.syncDirection) {
        case "pull-only":
          await syncGoogleEventsToLocalPlan(userId, planDate);
          break;
        case "push-only":
          await syncLocalTasksToGoogle(userId, planDate);
          break;
        case "bidirectional":
          await handleBidirectionalSync(userId, planDate);
          break;
        default:
          console.warn(`[Auto-Sync] Unknown sync direction: ${account.syncDirection}`);
          return {
            success: true,
            syncAttempted: false,
            message: "Unknown sync direction",
          };
      }

      // Update last sync timestamp
      await db
        .update(googleCalendarAccountsTable)
        .set({
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(googleCalendarAccountsTable.userId, userId));

      return {
        success: true,
        syncAttempted: true,
        message: "Auto-sync completed successfully",
      };
    } catch (syncError) {
      console.error(`[Auto-Sync] Sync operation failed for user ${userId}:`, syncError);
      // Return success:true to indicate the auto-sync attempt was made (even if it failed)
      // This prevents blocking the main operation
      return {
        success: true,
        syncAttempted: true,
        message: "Sync operation encountered an error but operation continued",
      };
    }
  } catch (error) {
    console.error(`[Auto-Sync] Unexpected error during auto-sync for user ${userId}:`, error);
    return {
      success: true,
      syncAttempted: false,
      message: "Auto-sync encountered an unexpected error",
    };
  }
}
