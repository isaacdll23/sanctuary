import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useFetcher,
  data,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";
import type { Route } from "./+types/reset-password";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hash } from "argon2";
import { requireNoAuth } from "~/modules/auth.server";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState, type ComponentProps } from "react";

export function meta({}) {
  return [{ title: "Reset Password" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireNoAuth(request);

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw redirect("/auth/login?error=invalid-reset-link");
  }

  // Verify token exists and hasn't expired
  const users = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.resetPasswordToken, token),
        gt(usersTable.resetPasswordExpires, new Date())
      )
    );

  if (users.length === 0) {
    throw redirect("/auth/login?error=invalid-or-expired-reset-link");
  }

  return { token, email: users[0].email };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = String(formData.get("token"));
  const password = String(formData.get("password"));
  const confirmPassword = String(formData.get("confirmPassword"));

  const errors = {
    password: "",
    general: "",
  };

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
    return data({ errors }, { status: 400 });
  }

  if (password !== confirmPassword) {
    errors.password = "Passwords do not match";
    return data({ errors }, { status: 400 });
  }

  // Find user with valid token
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.resetPasswordToken, token),
        gt(usersTable.resetPasswordExpires, new Date())
      )
    );

  if (users.length === 0) {
    errors.general = "Invalid or expired reset token";
    return data({ errors }, { status: 400 });
  }

  const hashedPassword = await hash(password);

  // Update password and clear reset token
  await db
    .update(usersTable)
    .set({
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    })
    .where(eq(usersTable.id, users[0].id));

  return redirect("/auth/login?success=password-reset");
}

export default function ResetPassword() {
  const { token, email } = useLoaderData() as {
    token: string;
    email: string;
  };
  const fetcher = useFetcher();
  const errors = fetcher.data?.errors;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center gap-8 w-full max-w-md md:w-96">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-6">
          Reset Password
        </h1>
        <p className="text-gray-500 dark:text-gray-300 text-sm text-center mb-4">
          Enter a new password for {email}
        </p>
        <fetcher.Form method="post" className="w-full">
          <input type="hidden" name="token" value={token} />
          <div className="w-full flex flex-col items-center justify-center gap-6">
            {errors?.general ? (
              <p className="text-red-400 text-sm self-start -mb-2">
                {errors.general}
              </p>
            ) : null}

            <div className="w-full relative">
              <input
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-300"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                name="password"
                required
                aria-label="New Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="w-full relative">
              <input
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-300"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                name="confirmPassword"
                required
                aria-label="Confirm New Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {errors?.password ? (
              <p className="text-red-400 text-sm self-start -mb-2">
                {errors.password}
              </p>
            ) : null}

            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              type="submit"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting"
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </div>
        </fetcher.Form>
        <div className="text-center">
          <Link
            to="/auth/login"
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
