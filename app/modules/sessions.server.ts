import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: number;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: "sanctuary-session",
      secrets: ["s3cret"],
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  });

export { getSession, commitSession, destroySession };
