import { db } from "~/db";
import { budgetMembersTable } from "~/db/schema";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "~/modules/services/NotificationService";

const INVITE_SECRET =
  process.env.BUDGET_INVITE_SECRET || "budget-invite-secret";
const INVITE_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

export async function sendBudgetInvite(
  budgetId: string,
  email: string,
  inviterName: string
) {
  const token = generateInviteToken(budgetId, email);
  const inviteUrl = `${process.env.APP_URL}/budgets/join?token=${token}`;
  await sendEmail({
    to: email,
    subject: `Budget Invite from ${inviterName}`,
    html: `<p>You've been invited to join a shared budget. <a href='${inviteUrl}'>Click here to join</a></p>`,
  });
  return { success: true, message: "Invite sent" };
}

export function generateInviteToken(budgetId: string, email: string) {
  return jwt.sign({ budgetId, email }, INVITE_SECRET, {
    expiresIn: INVITE_EXPIRY,
  });
}

export function validateInviteToken(token: string) {
  try {
    const decoded = jwt.verify(token, INVITE_SECRET);
    return { success: true, data: decoded };
  } catch (err) {
    return { success: false, message: "Invalid or expired token" };
  }
}

export async function processBudgetJoin(token: string, userId: string) {
  const validation = validateInviteToken(token);
  if (!validation.success) {
    return validation;
  }
  const { budgetId, email } = validation.data as {
    budgetId: string;
    email: string;
  };

  // Find pending invite
  const invite = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.email, email),
        eq(budgetMembersTable.status, "pending")
      )
    );

  if (!invite.length) {
    return { success: false, message: "Invite not found or already used" };
  }

  // Update member to active and link to user account
  await db
    .update(budgetMembersTable)
    .set({
      userId: parseInt(userId),
      status: "active",
      joinedAt: new Date(),
    })
    .where(eq(budgetMembersTable.id, invite[0].id));

  return { success: true, message: "Successfully joined the budget!" };
}
