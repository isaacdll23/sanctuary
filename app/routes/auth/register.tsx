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
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center bg-gray-800 border-2 border-gray-700 rounded-xl p-8 gap-8 w-1/3">
        <h1 className="text-2xl">Register</h1>
        <fetcher.Form method="post" className="w-full">
          <div className="w-full flex flex-col items-center justify-center gap-4">
            {errors?.identity ? (
              <p className="text-red-500">{errors.identity}</p>
            ) : null}
            <input
              className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
              type="text"
              placeholder="Username"
              name="username"
            />
            <input
              className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
              type="text"
              placeholder="Email"
              name="email"
            />
            {errors?.password ? (
              <p className="text-red-500">{errors.password}</p>
            ) : null}
            <input
              className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
              type="password"
              placeholder="Password"
              name="password"
            />
            <input
              className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
            />

            <button
              type="submit"
              className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-blue-700 text-white hover:bg-blue-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Register
            </button>
          </div>
        </fetcher.Form>
        <p>
          Already registered?{" "}
          <Link to="/auth/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
