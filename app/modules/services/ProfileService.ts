import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";
import { sendEmail } from "~/modules/services/NotificationService";
import crypto from "crypto";

export async function handleProfileAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateProfile") {
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

  if (intent === "requestPasswordReset") {
    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await db
      .update(usersTable)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      })
      .where(eq(usersTable.id, user.id));

    // Send reset email
    const resetUrl = `${
      process.env.BASE_URL || "http://localhost:5173"
    }/auth/reset-password?token=${resetToken}`;
    const subject = "Password Reset Request - Sanctuary";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hello ${user.username},</p>
        <p>You have requested a password reset for your Sanctuary account. Click the link below to reset your password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.</p>
        <p>If you're having trouble clicking the link, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>Best regards,<br>The Sanctuary Team</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html,
    });

    if (!emailResult.success) {
      return {
        success: false,
        message: "Failed to send reset email. Please try again later.",
      };
    }

    return {
      success: true,
      message: "Password reset email sent to your email address.",
    };
  }

  return { success: false, errors: { general: "Unknown action" } };
}
