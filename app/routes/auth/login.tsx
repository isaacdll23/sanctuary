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
    return redirect("/golf");
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
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center bg-gray-800 border-2 border-gray-700 rounded-xl p-8 gap-8 w-1/3">
        <h1 className="text-2xl">Login</h1>
        <fetcher.Form method="post" className="w-full">
          <div className="w-full flex flex-col items-center justify-center gap-4">
            {errors?.invalid ? (
              <p className="text-red-500 text-sm">{errors.invalid}</p>
            ) : null}
            <input
              className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
              type="text"
              placeholder="Username"
              name="username"
              required
            />
            <input
              className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
              type="password"
              placeholder="Password"
              name="password"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-blue-700 text-white hover:bg-blue-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Login
            </button>
          </div>
        </fetcher.Form>
        <p>
          Not registered?{" "}
          <Link to="/auth/register" className="text-blue-500 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
