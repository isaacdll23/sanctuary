import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";

export async function handleProfileAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent !== "updateProfile") {
    return { success: false, errors: { general: "Unknown action" } };
  }
  const username = String(formData.get("username"));
  const email = String(formData.get("email"));
  let errors: any = {};
  if (!username) errors.username = "Username is required.";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    errors.email = "Valid email is required.";
  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  await db
    .update(usersTable)
    .set({ username, email })
    .where(eq(usersTable.id, user.id));
  return { success: true };
}
