import { Form, Link, redirect, data, useFetcher } from "react-router";
import type { Route } from "./+types/login";
import { getSession, commitSession } from "~/modules/sessions.server";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { verify } from "argon2";
import { requireNoAuth } from "~/modules/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login" }];
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    return redirect("/dashboard");
  }

  let formData = await request.formData();
  let username = String(formData.get("username"));
  let password = String(formData.get("password"));

  const errors = {
    invalid: "",
  };

  let dbUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (dbUser.length === 0) {
    errors.invalid = "Invalid username or password";
    return data({ errors }, { status: 400 });
  }

  // Check password
  var validPassword = false;
  try {
    validPassword = await verify(dbUser[0].passwordHash, password);
  } catch {
    errors.invalid = "Invalid username or password";
    return data({ errors }, { status: 400 });
  }

  if (!validPassword) {
    errors.invalid = "Invalid username or password";
    return data({ errors }, { status: 400 });
  }

  session.set("userId", dbUser[0].id);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireNoAuth(request);
  return {};
}

export default function Login() {
  let fetcher = useFetcher();
  let errors = fetcher.data?.errors;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center gap-8 w-full max-w-md md:w-96">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-6">
          Login
        </h1>
        <fetcher.Form method="post" className="w-full">
          <div className="w-full flex flex-col items-center justify-center gap-6">
            {errors?.invalid ? (
              <p className="text-red-400 text-sm self-start -mb-2">
                {errors.invalid}
              </p>
            ) : null}
            <input
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-400"
              type="text"
              placeholder="Username"
              name="username"
              required
              aria-label="Username"
            />
            <input
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-400"
              type="password"
              placeholder="Password"
              name="password"
              required
              aria-label="Password"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Logging in..." : "Login"}
            </button>
          </div>
        </fetcher.Form>
        <p className="text-sm text-slate-400">
          Not registered?{" "}
          <Link
            to="/auth/register"
            className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
