import type { Route } from "./+types/commands";
import { db } from "~/db";
import {
  utilitiesCommandsTable,
  utilitiesCommandsVersionsTable,
} from "~/db/schema";
import { getUserFromSession, requireAuth } from "~/modules/auth.server";
import { eq, desc } from "drizzle-orm";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Commands" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const user = await getUserFromSession(request);

  const userCommands = await db
    .select()
    .from(utilitiesCommandsTable)
    .where(eq(utilitiesCommandsTable.userId, user.id))
    .orderBy(desc(utilitiesCommandsTable.createdAt));

  const userCommandVersions = await db
    .select()
    .from(utilitiesCommandsVersionsTable)
    .where(eq(utilitiesCommandsVersionsTable.userId, user.id))
    .orderBy(desc(utilitiesCommandsVersionsTable.createdAt));

  return { userCommands, userCommandVersions };
}

export default function Commands({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Commands</h1>
      <div className="flex flex-col gap-2">
        {loaderData.userCommands.map((command) => (
          <div key={command.id} className="p-4 border rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">{command.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
