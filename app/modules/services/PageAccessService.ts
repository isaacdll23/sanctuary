import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";

export type PageAccessAction = {
  userId: number;
  pageId: string;
  action: "grant" | "revoke";
};

export async function handlePageAccessAction(request: Request, formData?: FormData) {
  // Verify that the current user is an admin
  const currentUser = await getUserFromSession(request);
  if (currentUser.role !== "admin") {
    throw new Error("Unauthorized: Only admins can manage page access");
  }

  // Use provided formData or parse from request
  const data = formData || await request.formData();
  const intent = data.get("intent");

  // Handle page access updates
  if (intent === "updatePageAccess") {
    const userId = Number(data.get("userId"));
    const pageId = data.get("pageId") as string;
    const action = data.get("action") as "grant" | "revoke";

    if (!userId || !pageId || !action) {
      throw new Error("Missing required parameters for updating page access");
    }

    // Get the current user data
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (users.length === 0) {
      throw new Error("User not found");
    }

    const user = users[0];

    // Get current allowed pages or default to empty array
    const allowedPages: string[] = user.allowedPages
      ? typeof user.allowedPages === "string"
        ? JSON.parse(user.allowedPages)
        : user.allowedPages
      : [];

    if (action === "grant" && !allowedPages.includes(pageId)) {
      // Add the page to allowed pages
      allowedPages.push(pageId);
    } else if (action === "revoke") {
      // Remove the page from allowed pages
      const index = allowedPages.indexOf(pageId);
      if (index !== -1) {
        allowedPages.splice(index, 1);
      }
    }

    // Update the user with the new allowed pages
    await db
      .update(usersTable)
      .set({
        allowedPages: allowedPages,
      })
      .where(eq(usersTable.id, userId));

    return {
      success: true,
      message: `Page access ${
        action === "grant" ? "granted" : "revoked"
      } successfully`,
    };
  }

  // Default return for unhandled intents
  return {
    success: false,
    message: "Unknown action or missing required parameters",
  };
}

// Helper function to check if a user has access to a specific page
export async function hasPageAccess(
  userId: number,
  pageId: string
): Promise<boolean> {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (users.length === 0) {
    return false;
  }

  const user = users[0];

  // Admins always have access to all pages
  if (user.role === "admin") {
    return true;
  }

  // Check if the pageId is in the allowedPages array
  const allowedPages: string[] = user.allowedPages
    ? typeof user.allowedPages === "string"
      ? JSON.parse(user.allowedPages)
      : user.allowedPages
    : [];

  return allowedPages.includes(pageId);
}

// Helper function to get all pages a user has access to
export async function getUserAccessiblePages(
  userId: number
): Promise<string[]> {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (users.length === 0) {
    return [];
  }

  const user = users[0];

  // Admins have access to all pages
  if (user.role === "admin") {
    // Return all possible page IDs (this should ideally be pulled from a central registry)
    return [
      "dashboard",
      "finance",
      "tasks",
      "notes", // Updated from principles to notes
      "utilities/commands",
      "admin",
      "profile", // Ensure admin always sees profile page
    ];
  }

  // Parse allowed pages
  const allowedPages: string[] = user.allowedPages
    ? typeof user.allowedPages === "string"
      ? JSON.parse(user.allowedPages)
      : user.allowedPages
    : [];

  // Everyone has access to dashboard by default
  if (!allowedPages.includes("dashboard")) {
    allowedPages.push("dashboard");
  }

  return allowedPages;
}

// Export the hasPageAccess function directly for convenience when working with client components
export const hasPageAccessClient = hasPageAccess;
