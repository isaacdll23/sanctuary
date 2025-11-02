import { redirect } from "react-router";
import { getUserFromSession, exchangeGoogleAuthCode, refreshGoogleAccessToken } from "~/modules/auth.server";
import { db } from "~/db";
import { googleCalendarAccountsTable, usersTable } from "~/db/schema";
import { encryptToken } from "~/modules/services/TokenEncryptionService";
import { googleCalendarApiClient } from "~/modules/services/GoogleCalendarApiClient";
import { eq } from "drizzle-orm";

export const meta = () => [{ title: "Connecting Google Calendar..." }];

/**
 * Handles Google OAuth callback
 * Exchanges authorization code for access/refresh tokens and creates account record
 */
export async function loader({ request }: { request: Request }) {
  try {
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
      throw redirect("/profile?error=google_auth_failed");
    }

    if (!code) {
      console.error("No authorization code in callback");
      throw redirect("/profile?error=no_auth_code");
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

    // Redirect to profile with success message
    throw redirect("/profile/calendar-settings?success=connected");
  } catch (error) {
    // If it's a redirect, throw it
    if (error instanceof Response) {
      throw error;
    }

    // Log error and redirect
    console.error("Google OAuth callback error:", error);
    throw redirect("/profile?error=google_connection_failed");
  }
}

export default function GoogleCallbackLoader() {
  return null;
}
