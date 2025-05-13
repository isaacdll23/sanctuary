import { Form, Link, redirect, useFetcher, data } from "react-router";
import type { Route } from "./+types/register";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq, or } from "drizzle-orm";
import { hash } from "argon2";
import { requireNoAuth } from "~/modules/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Register" }];
}

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();

  let username = String(formData.get("username"));
  let email = String(formData.get("email"));
  let password = String(formData.get("password"));
  let confirmPassword = String(formData.get("confirmPassword"));

  const errors = {
    identity: "",
    password: "",
  };

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
    return data({ errors }, { status: 400 });
  }

  if (password !== confirmPassword) {
    errors.password = "Passwords do not match";
    return data({ errors }, { status: 400 });
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.username, username), eq(usersTable.email, email)));

  if (users.length > 0) {
    errors.identity = "Username and/or email is already taken";
    return data({ errors }, { status: 400 });
  }

  const hashedPassword = await hash(password);

  const newUser: typeof usersTable.$inferInsert = {
    username: username,
    email: email,
    passwordHash: hashedPassword,
  };

  await db.insert(usersTable).values(newUser);

  return redirect("/auth/login");
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireNoAuth(request);
  return {};
}

export default function Register(_: Route.ComponentProps) {
  let fetcher = useFetcher();
  let errors = fetcher.data?.errors;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center gap-8 w-full max-w-md md:w-96">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-6">
          Create Account
        </h1>
        <fetcher.Form method="post" className="w-full">
          <div className="w-full flex flex-col items-center justify-center gap-6">
            {errors?.identity ? (
              <p className="text-red-400 text-sm self-start -mb-2">
                {errors.identity}
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
              type="email"
              placeholder="Email"
              name="email"
              required
              aria-label="Email"
            />
            {errors?.password ? (
              <p className="text-red-400 text-sm self-start -mb-2">
                {errors.password}
              </p>
            ) : null}
            <input
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-400"
              type="password"
              placeholder="Password (min. 8 characters)"
              name="password"
              required
              aria-label="Password"
            />
            <input
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-400"
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              required
              aria-label="Confirm Password"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting"
                ? "Creating Account..."
                : "Register"}
            </button>
          </div>
        </fetcher.Form>
        <p className="text-sm text-slate-400">
          Already registered?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
