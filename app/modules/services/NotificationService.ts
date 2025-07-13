import { Resend } from "resend";

console.log("[NotificationService] Initializing NotificationService...");

const resendApiKey = process.env.RESEND_API_KEY;
console.log("[NotificationService] RESEND_API_KEY present:", !!resendApiKey);

if (!resendApiKey) {
  console.error(
    "[NotificationService] ERROR: RESEND_API_KEY environment variable is not set."
  );
  throw new Error("RESEND_API_KEY environment variable is not set.");
}

console.log("[NotificationService] Creating Resend instance...");
const resend = new Resend(resendApiKey);
console.log("[NotificationService] Resend instance created successfully");

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  console.log("[NotificationService] sendEmail called with parameters:");
  console.log("[NotificationService] - to:", to);
  console.log("[NotificationService] - subject:", subject);
  console.log("[NotificationService] - html length:", html.length);

  try {
    console.log("[NotificationService] Attempting to send email via Resend...");

    const emailPayload = {
      from: "notifications@sanctuary.isaacdelalama.dev",
      to,
      subject,
      html,
    };

    console.log("[NotificationService] Email payload:", {
      ...emailPayload,
      html: `${html.substring(0, 100)}${html.length > 100 ? "..." : ""}`,
    });

    const response = await resend.emails.send(emailPayload);

    console.log("[NotificationService] Resend API response:", response);

    // Check if Resend returned an error in the response
    if (response.error) {
      console.error(
        "[NotificationService] ERROR: Resend API returned an error"
      );
      console.error("[NotificationService] Resend error:", response.error);
      return { success: false, error: response.error };
    }

    console.log("[NotificationService] Email sent successfully!");
    return { success: true, response };
  } catch (error) {
    console.error("[NotificationService] ERROR: Failed to send email");
    console.error("[NotificationService] Error details:", error);
    console.error(
      "[NotificationService] Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "[NotificationService] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return { success: false, error };
  }
}
