import { Form, redirect } from "react-router";
import type { Route } from "./+types/logout";
import { getSession, destroySession } from "~/sessions.server";
import { requireAuth } from "~/modules/auth";

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
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <p>Are you sure you want to logout?</p>
      <Form method="post">
        <button
          className="rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-black text-white hover:bg-gray-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
        >
          Logout
        </button>
      </Form>
    </div>
  );
}
