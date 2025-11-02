import { redirect } from "react-router";
import { getSession, destroySession } from "~/modules/sessions.server";
import { db } from "~/db";
import { usersTable, googleCalendarAccountsTable } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(request: Request): Promise<void> {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    throw redirect("/auth/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
}

export async function requireNoAuth(request: Request): Promise<void> {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    throw redirect("/dashboard");
  }
}

export async function isSessionCreated(request: Request): Promise<boolean> {
  const session = await getSession(request.headers.get("Cookie"));

  return session.has("userId");
}

export async function isUserAdmin(request: Request): Promise<boolean> {
  try {
    const user = await getUserFromSession(request);
    return user.role === "admin";
  } catch (error) {
    return false;
  }
}

export async function getUserFromSession(
  request: Request
): Promise<typeof usersTable.$inferSelect> {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    throw new Error("User not authenticated");
  }

  const userId = Number(session.data.userId);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (users.length === 0) {
    throw new Error("User not found");
  }

  return users[0];
}

/**
 * Google OAuth Functions
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn(
    "Google OAuth environment variables not configured. Google Calendar integration will not work."
  );
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/**
 * Generates the Google OAuth authorization URL
 */
export function getGoogleOAuthUrl(state?: string): string {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state && { state }),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Exchanges authorization code for access and refresh tokens
 */
export async function exchangeGoogleAuthCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: GOOGLE_REDIRECT_URI,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to exchange Google auth code: ${error.error_description || response.statusText}`
    );
  }

  const data: GoogleTokenResponse = await response.json();

  if (!data.refresh_token) {
    throw new Error(
      "No refresh token in Google OAuth response. Make sure user clicked consent."
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refreshes an expired Google access token using the refresh token
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to refresh Google access token: ${error.error_description || response.statusText}`
    );
  }

  const data: GoogleTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
