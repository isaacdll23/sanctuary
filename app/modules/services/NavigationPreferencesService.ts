import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";
import { getUserAccessiblePages } from "~/modules/services/PageAccessService";
import {
  parseMobileTabIdsInput,
  parseNavigationPreferences,
  type NavigationPreferences,
} from "~/modules/navigation";

export async function getNavigationPreferencesForUser(
  userId: number
): Promise<NavigationPreferences> {
  const users = await db
    .select({ navigationPreferences: usersTable.navigationPreferences })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return parseNavigationPreferences(users[0]?.navigationPreferences);
}

export async function handleNavigationPreferencesAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateMobileTabs") {
    const parsed = parseMobileTabIdsInput(
      String(formData.get("tabIds") ?? "")
    );
    if (!parsed.ok) {
      return { success: false, message: parsed.error };
    }

    // Stored preferences are not an authorization path: only pages the user
    // can already access resolve to visible tabs. Pinnable ids the user lost
    // access to are silently dropped here rather than rejected, so the form
    // keeps working after access changes.
    const accessiblePages = new Set(await getUserAccessiblePages(user.id));
    const tabIds = parsed.tabIds.filter((pageId) => accessiblePages.has(pageId));

    await db
      .update(usersTable)
      .set({ navigationPreferences: { mobileTabIds: tabIds } })
      .where(eq(usersTable.id, user.id));

    return {
      success: true,
      message: "Mobile tabs updated.",
    };
  }

  return { success: false, message: "Unknown action" };
}
