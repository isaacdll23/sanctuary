// This script checks for tasks with a reminderDate in the past and reminderSent = 0, then sends an email and marks them as sent.
import { db } from "../app/db";
import { tasksTable, usersTable } from "../app/db/schema";
import { sendEmail } from "../app/modules/services/NotificationService";
import { eq, and, lt, sql } from "drizzle-orm";

async function sendReminders() {
  // Find all tasks with a reminderDate in the past and not sent
  const now = new Date();
  const tasks = await db
    .select({
      id: tasksTable.id,
      userId: tasksTable.userId,
      title: tasksTable.title,
      description: tasksTable.description,
      reminderDate: tasksTable.reminderDate,
      reminderSent: tasksTable.reminderSent,
    })
    .from(tasksTable)
    .where(
      and(
        sql`${tasksTable.reminderDate} IS NOT NULL`,
        lt(tasksTable.reminderDate, now),
        eq(tasksTable.reminderSent, 0)
      )
    );

  for (const task of tasks) {
    // Get user email
    const user = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, task.userId))
      .then((rows) => rows[0]);
    if (!user?.email) continue;

    // Send email
    const subject = `Task Reminder: ${task.title}`;
    const html = `<p>This is a reminder for your task: <b>${
      task.title
    }</b></p><p>${task.description || ""}</p>`;
    await sendEmail({ to: user.email, subject, html });

    // Mark as sent
    await db
      .update(tasksTable)
      .set({ reminderSent: 1 })
      .where(eq(tasksTable.id, task.id));
  }
}

sendReminders().then(() => {
  console.log("Reminders processed.");
  process.exit(0);
});
