import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: number;
};

function getSessionSecrets(): string[] {
  const rawSecrets = process.env.SESSION_SECRETS || process.env.SESSION_SECRET;

  if (!rawSecrets) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET (or SESSION_SECRETS) is required in production."
      );
    }

    return ["dev-insecure-session-secret-change-me"];
  }

  const secrets = rawSecrets
    .split(",")
    .map((secret) => secret.trim())
    .filter(Boolean);

  if (secrets.length === 0) {
    throw new Error("SESSION_SECRET (or SESSION_SECRETS) is empty.");
  }

  return secrets;
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: "sanctuary-session",
      secrets: getSessionSecrets(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  });

export { getSession, commitSession, destroySession };
