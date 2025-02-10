import { requireAuth } from "~/modules/auth";
import type { Route } from "./+types/golf";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export default function Golf() {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <h1 className="text-3xl">Golf!</h1>
    </div>
  );
}
