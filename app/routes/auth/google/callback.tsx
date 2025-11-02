import { redirect } from "react-router";

export const meta = () => [{ title: "Connecting Google Calendar..." }];

/**
 * Handles Google OAuth callback
 * Exchanges authorization code for access/refresh tokens and creates account record
 */
export async function loader({ request }: { request: Request }) {
  try {
    // Dynamic imports to keep server code away from client bundle
    const { getUserFromSession, exchangeGoogleAuthCode } = await import("~/modules/auth.server");
    const { db } = await import("~/db");
    const { googleCalendarAccountsTable, usersTable } = await import("~/db/schema");
    const { encryptToken } = await import("~/modules/services/TokenEncryptionService");
    const { googleCalendarApiClient } = await import("~/modules/services/GoogleCalendarApiClient");
    const { eq } = await import("drizzle-orm");

    // Get user from session
    const user = await getUserFromSession(request);

    // Parse authorization code from URL
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle user cancellation or error
    if (error) {
      const errorDescription = url.searchParams.get("error_description");
      console.error("Google OAuth error:", error, errorDescription);
      throw redirect("/settings?error=google_auth_failed");
    }

    if (!code) {
      console.error("No authorization code in callback");
      throw redirect("/settings?error=no_auth_code");
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } = await exchangeGoogleAuthCode(code);

    // Get primary calendar info
    const calendarInfo = await googleCalendarApiClient.getCalendar("primary", accessToken);
    const googleCalendarId = calendarInfo.id as string;
    const googleAccountEmail = calendarInfo.summary as string;

    // Calculate token expiration time
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = encryptToken(refreshToken);

    // Check if account already exists
    const existingAccount = await db
      .select()
      .from(googleCalendarAccountsTable)
      .where(eq(googleCalendarAccountsTable.userId, user.id));

    if (existingAccount.length > 0) {
      // Update existing account
      await db
        .update(googleCalendarAccountsTable)
        .set({
          googleAccountEmail,
          googleCalendarId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt,
          isSyncEnabled: 1,
          connectedAt: new Date(),
          disconnectedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(googleCalendarAccountsTable.userId, user.id));
    } else {
      // Create new account
      await db.insert(googleCalendarAccountsTable).values({
        userId: user.id,
        googleAccountEmail,
        googleCalendarId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        isSyncEnabled: 1,
      });
    }

    // Update user's googleCalendarConnected flag
    await db
      .update(usersTable)
      .set({
        googleCalendarConnected: 1,
      })
      .where(eq(usersTable.id, user.id));

    // Redirect to settings with success message
    throw redirect("/settings?success=connected");
  } catch (error) {
    // If it's a redirect, throw it
    if (error instanceof Response) {
      throw error;
    }

    // Log error and redirect
    console.error("Google OAuth callback error:", error);
    throw redirect("/settings?error=google_connection_failed");
  }
}

// This component is never rendered, it only exists to satisfy React Router's route requirements
export default function GoogleCallbackRoute() {
  return null;
}
