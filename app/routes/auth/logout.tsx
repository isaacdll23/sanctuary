import { Form, redirect } from "react-router";
import type { Route } from "./+types/logout";
import { getSession, destroySession } from "~/modules/sessions.server";
import { requireAuth } from "~/modules/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Logout" }];
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export default function Logout() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center gap-8 w-full max-w-md md:w-96">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-4">
          Logout
        </h1>
        <p className="text-gray-500 dark:text-gray-300 text-center">
          Are you sure you want to logout?
        </p>
        <Form method="post" className="w-full">
          <button
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
          >
            Confirm Logout
          </button>
        </Form>
      </div>
    </div>
  );
}
