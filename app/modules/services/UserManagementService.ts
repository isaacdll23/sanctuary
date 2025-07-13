import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq, ne } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";
import { hash } from "argon2";

export type UserManagementAction = {
  userId: number;
  action: "edit" | "delete" | "changeRole" | "resetPassword";
  data?: any;
};

export async function handleUserManagementAction(request: Request, formData?: FormData) {
  // Verify that the current user is an admin
  const currentUser = await getUserFromSession(request);
  if (currentUser.role !== "admin") {
    throw new Error("Unauthorized: Only admins can manage users");
  }

  // Use provided formData or parse from request
  const data = formData || await request.formData();
  const intent = data.get("intent");

  // Handle user edit
  if (intent === "editUser") {
    const userId = Number(data.get("userId"));
    const username = data.get("username") as string;
    const email = data.get("email") as string;

    if (!userId || !username || !email) {
      return {
        success: false,
        message: "Missing required parameters for editing user",
      };
    }

    // Check if username already exists (excluding current user)
    const existingUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (existingUsername.length > 0 && existingUsername[0].id !== userId) {
      return {
        success: false,
        message: "Username already exists",
      };
    }

    // Check if email already exists (excluding current user)
    const existingEmail = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingEmail.length > 0 && existingEmail[0].id !== userId) {
      return {
        success: false,
        message: "Email already exists",
      };
    }

    // Update the user
    await db
      .update(usersTable)
      .set({
        username,
        email,
      })
      .where(eq(usersTable.id, userId));

    return {
      success: true,
      message: `User ${username} updated successfully`,
    };
  }

  // Handle role change
  if (intent === "changeRole") {
    const userId = Number(data.get("userId"));
    const newRole = data.get("role") as string;

    if (!userId || !newRole) {
      return {
        success: false,
        message: "Missing required parameters for changing role",
      };
    }

    // Prevent admin from changing their own role
    if (userId === currentUser.id) {
      return {
        success: false,
        message: "You cannot change your own role",
      };
    }

    // Validate role
    if (!["admin", "user"].includes(newRole)) {
      return {
        success: false,
        message: "Invalid role specified",
      };
    }

    await db
      .update(usersTable)
      .set({ role: newRole })
      .where(eq(usersTable.id, userId));

    return {
      success: true,
      message: `User role updated to ${newRole}`,
    };
  }

  // Handle user deletion
  if (intent === "deleteUser") {
    const userId = Number(data.get("userId"));

    if (!userId) {
      return {
        success: false,
        message: "Missing user ID for deletion",
      };
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return {
        success: false,
        message: "You cannot delete your own account",
      };
    }

    // Get user details before deletion for the response message
    const userToDelete = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (userToDelete.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Delete the user (this will cascade delete related data)
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    return {
      success: true,
      message: `User ${userToDelete[0].username} deleted successfully`,
    };
  }

  // Handle password reset
  if (intent === "resetPassword") {
    const userId = Number(data.get("userId"));
    const newPassword = data.get("newPassword") as string;

    if (!userId || !newPassword) {
      return {
        success: false,
        message: "Missing required parameters for password reset",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long",
      };
    }

    // Hash the new password
    const passwordHash = await hash(newPassword);

    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, userId));

    return {
      success: true,
      message: "Password reset successfully",
    };
  }

  // Default return for unhandled intents
  return {
    success: false,
    message: "Unknown action or missing required parameters",
  };
}

// Helper function to get user by ID
export async function getUserById(userId: number) {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return users.length > 0 ? users[0] : null;
}
