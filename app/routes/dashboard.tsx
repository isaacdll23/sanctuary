import { requireAuth } from "~/modules/auth";
import type { Route } from "./+types/dashboard";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <h1 className="text-3xl mb-4">Dashboard</h1>
      <p>Dashboard content goes here</p>
    </div>
  );
}
