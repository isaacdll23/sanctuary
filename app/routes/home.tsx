import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { isSessionCreated } from "~/modules/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sanctuary" },
    { name: "description", content: "Welcome to Sanctuary!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await isSessionCreated(request)) {
    throw redirect("/dashboard");
  }

  throw redirect("/auth/login");
}

export default function Home() {
  return null;
}
