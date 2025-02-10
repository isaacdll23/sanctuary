import { redirect } from "react-router";
import { getSession, destroySession } from "~/sessions.server";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
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
