import { db } from "~/db";
import {
  budgetsTable,
  budgetMembersTable,
  budgetTransactionsTable,
  usersTable,
} from "~/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";

export async function handleSharedBudgetAction(
  request: Request,
  providedFormData?: FormData
) {
  try {
    const user = await getUserFromSession(request);
    const formData = providedFormData || (await request.formData());
    const intent = formData.get("intent");

    if (intent === "createBudget") {
      return await createBudget(String(user.id), formData);
    }
    if (intent === "addTransaction") {
      return await addTransaction(
        String(formData.get("budgetId") || ""),
        String(user.id),
        formData
      );
    }
    if (intent === "inviteMember") {
      return await inviteMember(
        String(formData.get("budgetId") || ""),
        String(formData.get("email") || ""),
        String(formData.get("role") || "contributor"),
        String(user.id)
      );
    }
    if (intent === "updateMemberRole") {
      return await updateMemberRole(
        String(formData.get("budgetId") || ""),
        String(formData.get("memberId") || ""),
        String(formData.get("role") || "contributor"),
        String(user.id)
      );
    }
    if (intent === "removeMember") {
      return await removeBudgetMember(
        String(formData.get("budgetId") || ""),
        String(formData.get("memberId") || ""),
        String(user.id)
      );
    }
    if (intent === "updateBudget") {
      return await updateBudget(
        String(formData.get("budgetId") || ""),
        String(user.id),
        formData
      );
    }
    if (intent === "deleteBudget") {
      return await deleteBudget(
        String(formData.get("budgetId") || ""),
        String(user.id)
      );
    }
    return { success: false, message: "Unknown intent" };
  } catch (error) {
    console.error("Error handling shared budget action:", error);
    return {
      success: false,
      message: "An error occurred while processing your request",
    };
  }
}

export async function createBudget(userId: string, formData: FormData) {
  const name = String(formData.get("name") || "");
  const description = String(formData.get("description") || "");
  const totalAmount = String(formData.get("totalAmount") || "0");
  const period = String(formData.get("period") || "monthly");
  if (!name || !totalAmount || !period) {
    return { success: false, message: "Missing required fields" };
  }
  const [budget] = await db
    .insert(budgetsTable)
    .values({
      name,
      description,
      totalAmount,
      period: period as "monthly" | "weekly" | "yearly",
      createdById: parseInt(userId),
    })
    .returning();
  if (!budget) {
    return { success: false, message: "Failed to create budget" };
  }
  await db.insert(budgetMembersTable).values({
    budgetId: budget.id,
    userId: parseInt(userId),
    email: "", // Owner's email not needed for self
    role: "owner",
    status: "active",
    invitedAt: new Date(),
    joinedAt: new Date(),
  });
  return { success: true, message: "Budget created", data: budget };
}

export async function getBudgetsForUser(userId: string) {
  const budgets = await db
    .select({ budget: budgetsTable, member: budgetMembersTable })
    .from(budgetsTable)
    .innerJoin(
      budgetMembersTable,
      eq(budgetsTable.id, budgetMembersTable.budgetId)
    )
    .where(
      and(
        eq(budgetMembersTable.userId, parseInt(userId)),
        eq(budgetMembersTable.status, "active")
      )
    );

  // Get additional data for each budget
  const enrichedBudgets = await Promise.all(
    budgets.map(async ({ budget, member }) => {
      // Get all members for this budget
      const allMembers = await db
        .select({
          id: budgetMembersTable.id,
          userId: budgetMembersTable.userId,
          email: budgetMembersTable.email,
          role: budgetMembersTable.role,
          status: budgetMembersTable.status,
          user: usersTable,
        })
        .from(budgetMembersTable)
        .leftJoin(usersTable, eq(budgetMembersTable.userId, usersTable.id))
        .where(eq(budgetMembersTable.budgetId, budget.id));

      // Get total spent amount from transactions
      const transactions = await db
        .select({ amount: budgetTransactionsTable.amount })
        .from(budgetTransactionsTable)
        .where(eq(budgetTransactionsTable.budgetId, budget.id));

      const spentAmount = transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );

      return {
        budget,
        member,
        members: allMembers,
        spentAmount,
      };
    })
  );

  return { success: true, data: enrichedBudgets };
}

export async function getBudgetDetails(budgetId: string, userId: string) {
  // Verify user is a member
  const member = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.userId, parseInt(userId)),
        eq(budgetMembersTable.status, "active")
      )
    );
  if (!member.length) {
    return { success: false, message: "Access denied" };
  }

  const budget = await db
    .select()
    .from(budgetsTable)
    .where(eq(budgetsTable.id, budgetId));

  const members = await db
    .select({
      id: budgetMembersTable.id,
      userId: budgetMembersTable.userId,
      email: budgetMembersTable.email,
      role: budgetMembersTable.role,
      status: budgetMembersTable.status,
      invitedAt: budgetMembersTable.invitedAt,
      joinedAt: budgetMembersTable.joinedAt,
      user: usersTable,
    })
    .from(budgetMembersTable)
    .leftJoin(usersTable, eq(budgetMembersTable.userId, usersTable.id))
    .where(eq(budgetMembersTable.budgetId, budgetId));

  const transactions = await db
    .select({
      id: budgetTransactionsTable.id,
      amount: budgetTransactionsTable.amount,
      description: budgetTransactionsTable.description,
      category: budgetTransactionsTable.category,
      transactionDate: budgetTransactionsTable.transactionDate,
      createdAt: budgetTransactionsTable.createdAt,
      addedBy: usersTable,
    })
    .from(budgetTransactionsTable)
    .leftJoin(usersTable, eq(budgetTransactionsTable.addedById, usersTable.id))
    .where(eq(budgetTransactionsTable.budgetId, budgetId))
    .orderBy(desc(budgetTransactionsTable.transactionDate));

  // Calculate spent amount
  const spentAmount = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  );

  return {
    success: true,
    data: {
      budget: budget[0],
      members,
      transactions,
      spentAmount,
      currentUserRole: member[0].role,
    },
  };
}

export async function removeBudgetMember(
  budgetId: string,
  memberId: string,
  requesterId: string
) {
  // Only owner can remove
  const owner = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.userId, parseInt(requesterId)),
        eq(budgetMembersTable.role, "owner"),
        eq(budgetMembersTable.status, "active")
      )
    );
  if (!owner.length) {
    return { success: false, message: "Only owner can remove members" };
  }
  await db
    .update(budgetMembersTable)
    .set({ status: "removed" })
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.id, memberId)
      )
    );
  return { success: true, message: "Member removed" };
}

export async function addTransaction(
  budgetId: string,
  userId: string,
  formData: FormData
) {
  // Verify user can add transactions (owner or contributor only)
  const member = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.userId, parseInt(userId)),
        eq(budgetMembersTable.status, "active")
      )
    );

  if (!member.length) {
    return { success: false, message: "Access denied" };
  }

  const amount = String(formData.get("amount") || "0");
  const description = String(formData.get("description") || "");
  const category = String(formData.get("category") || "");
  const transactionDate = String(
    formData.get("transactionDate") || new Date().toISOString().split("T")[0]
  );

  if (!amount || parseFloat(amount) <= 0) {
    return { success: false, message: "Amount must be greater than 0" };
  }

  await db.insert(budgetTransactionsTable).values({
    budgetId,
    addedById: parseInt(userId),
    amount,
    description,
    category,
    transactionDate: transactionDate,
  });

  return { success: true, message: "Transaction added" };
}

export async function inviteMember(
  budgetId: string,
  email: string,
  role: string,
  invitedById: string
) {
  try {
    // Only owner can invite
    const owner = await db
      .select()
      .from(budgetMembersTable)
      .where(
        and(
          eq(budgetMembersTable.budgetId, budgetId),
          eq(budgetMembersTable.userId, parseInt(invitedById)),
          eq(budgetMembersTable.role, "owner"),
          eq(budgetMembersTable.status, "active")
        )
      );
    if (!owner.length) {
      return { success: false, message: "Only owner can invite members" };
    }

    // Check if email is already invited or active member (ignore removed members)
    const existingMember = await db
      .select()
      .from(budgetMembersTable)
      .where(
        and(
          eq(budgetMembersTable.budgetId, budgetId),
          eq(budgetMembersTable.email, email),
          or(
            eq(budgetMembersTable.status, "active"),
            eq(budgetMembersTable.status, "pending")
          )
        )
      );

    if (existingMember.length) {
      return { success: false, message: "User already invited or member" };
    }

    await db.insert(budgetMembersTable).values({
      budgetId,
      email,
      role: role as "owner" | "contributor",
      status: "pending",
      invitedAt: new Date(),
    });

    // Get budget details for email content
    const budget = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId));

    if (budget.length > 0) {
      // Generate invitation token
      const { generateInviteToken } = await import("./BudgetInviteService");
      const inviteToken = generateInviteToken(budgetId, email);
      const joinUrl = `${
        process.env.APP_URL || "http://localhost:5173"
      }/finance/budgets/join/${inviteToken}`;

      // Send invitation email
      const { sendEmail } = await import("./NotificationService");

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join a shared budget!</h2>
          <p>You have been invited to join the budget "<strong>${budget[0].name}</strong>" as a ${role}.</p>
          <p><strong>Budget Details:</strong></p>
          <ul>
            <li>Name: ${budget[0].name}</li>
            <li>Total Amount: $${budget[0].totalAmount}</li>
            <li>Your Role: ${role}</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" 
               style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${joinUrl}" style="color: #1f2937; word-break: break-all;">${joinUrl}</a>
          </p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            This invitation will expire in 7 days. If you don't have a Sanctuary account, you'll need to create one first.
          </p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            This invitation was sent from Sanctuary Budget Management.
          </p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: email,
        subject: `Invitation to join "${budget[0].name}" budget`,
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error("Failed to send invitation email:", emailResult.error);
        // Don't fail the invitation if email fails, just log it
      }
    }

    return { success: true, message: "Invitation sent" };
  } catch (error) {
    console.error("Error inviting member:", error);
    return { success: false, message: "Failed to send invitation" };
  }
}

export async function updateMemberRole(
  budgetId: string,
  memberId: string,
  newRole: string,
  requesterId: string
) {
  // Only owner can update roles
  const owner = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.userId, parseInt(requesterId)),
        eq(budgetMembersTable.role, "owner"),
        eq(budgetMembersTable.status, "active")
      )
    );
  if (!owner.length) {
    return { success: false, message: "Only owner can update member roles" };
  }

  await db
    .update(budgetMembersTable)
    .set({ role: newRole as "owner" | "contributor" })
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.id, memberId)
      )
    );

  return { success: true, message: "Member role updated" };
}

export async function updateBudget(
  budgetId: string,
  userId: string,
  formData: FormData
) {
  // Only owner can update budget
  const owner = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.userId, parseInt(userId)),
        eq(budgetMembersTable.role, "owner"),
        eq(budgetMembersTable.status, "active")
      )
    );
  if (!owner.length) {
    return { success: false, message: "Only owner can update budget" };
  }

  const name = String(formData.get("name") || "");
  const description = String(formData.get("description") || "");
  const totalAmount = String(formData.get("totalAmount") || "0");

  if (!name || !totalAmount || parseFloat(totalAmount) <= 0) {
    return { success: false, message: "Name and valid amount are required" };
  }

  await db
    .update(budgetsTable)
    .set({
      name,
      description,
      totalAmount,
      updatedAt: new Date(),
    })
    .where(eq(budgetsTable.id, budgetId));

  return { success: true, message: "Budget updated" };
}

export async function deleteBudget(budgetId: string, userId: string) {
  // Only owner can delete budget
  const owner = await db
    .select()
    .from(budgetMembersTable)
    .where(
      and(
        eq(budgetMembersTable.budgetId, budgetId),
        eq(budgetMembersTable.userId, parseInt(userId)),
        eq(budgetMembersTable.role, "owner"),
        eq(budgetMembersTable.status, "active")
      )
    );
  if (!owner.length) {
    return { success: false, message: "Only owner can delete budget" };
  }

  // Delete related records first (budget members, transactions)
  await db
    .delete(budgetMembersTable)
    .where(eq(budgetMembersTable.budgetId, budgetId));
  await db
    .delete(budgetTransactionsTable)
    .where(eq(budgetTransactionsTable.budgetId, budgetId));
  await db.delete(budgetsTable).where(eq(budgetsTable.id, budgetId));

  return { success: true, message: "Budget deleted" };
}
