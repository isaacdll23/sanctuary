import { db } from "~/db";
import { principlesTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";

export async function handlePrincipleAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create new principle
  if (intent === "createPrinciple") {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!title || !content) {
      throw new Error("Title and Content are required for creating a principle.");
    }

    const newPrinciple = await db
      .insert(principlesTable)
      .values({
        userId: user.id,
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date()
      })
      .returning();
    
    return { success: true, message: "Principle created.", principle: newPrinciple[0] };
  }

  // Update principle
  if (intent === "updatePrinciple") {
    const principleId = Number(formData.get("principleId"));
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!principleId || !title || !content) {
      throw new Error("Principle ID, Title, and Content are required for updating.");
    }

    await db
      .update(principlesTable)
      .set({
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date()
      })
      .where(eq(principlesTable.id, principleId));
    
    return { success: true, message: "Principle updated." };
  }

  // Delete principle
  if (intent === "deletePrinciple") {
    const principleId = Number(formData.get("principleId"));

    if (!principleId) {
      throw new Error("Principle ID is required for deletion.");
    }

    await db
      .delete(principlesTable)
      .where(eq(principlesTable.id, principleId));
    
    return { success: true, message: "Principle deleted." };
  }

  // If no matching intent was found
  return { 
    success: false, 
    message: "Unknown action or missing required parameters." 
  };
}

export async function getPrinciples(userId: number) {
  return db
    .select()
    .from(principlesTable)
    .where(eq(principlesTable.userId, userId))
    .orderBy(principlesTable.updatedAt);
}

export async function getPrinciple(principleId: number, userId: number) {
  const results = await db
    .select()
    .from(principlesTable)
    .where(
      and(
        eq(principlesTable.id, principleId),
        eq(principlesTable.userId, userId)
      )
    );
  
  return results[0] || null;
}
