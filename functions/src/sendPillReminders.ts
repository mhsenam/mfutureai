import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin SDK if not already initialized
try {
  admin.initializeApp();
} catch (error: unknown) {
  // App might already be initialized
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.log("Firebase admin initialization error:", errorMessage);
}

// Define the PillReminder interface to match the Firestore document structure
interface PillReminder {
  id?: string;
  name: string;
  frequency: "daily" | "weekly" | "specific_date";
  time: string;
  daysOfWeek?: string[];
  specificDate?: string | null;
  userId: string;
  createdAt: string;
  notificationEmail: string;
  sendNotifications: boolean;
}

// Configure nodemailer with your email service credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
});

export const sendPillReminders = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });

    try {
      // Get all pill reminders
      const pillsSnapshot = await admin
        .firestore()
        .collection("pillReminders")
        .get();

      for (const doc of pillsSnapshot.docs) {
        const reminder = doc.data() as PillReminder;
        const reminderTime = reminder.time.split(":");
        const reminderHour = parseInt(reminderTime[0]);
        const reminderMinute = parseInt(reminderTime[1]);

        // Check if it's time to send the reminder
        if (
          reminderHour === currentHour &&
          Math.abs(reminderMinute - currentMinute) < 5 // Within 5 minutes of the scheduled time
        ) {
          // Check frequency conditions
          let shouldSendReminder = false;

          switch (reminder.frequency) {
            case "daily":
              shouldSendReminder = true;
              break;
            case "weekly":
              if (reminder.daysOfWeek && Array.isArray(reminder.daysOfWeek)) {
                shouldSendReminder = reminder.daysOfWeek.includes(currentDay);
              }
              break;
            case "specific_date":
              if (reminder.specificDate) {
                const specificDate = new Date(reminder.specificDate);
                shouldSendReminder =
                  specificDate.getDate() === now.getDate() &&
                  specificDate.getMonth() === now.getMonth() &&
                  specificDate.getFullYear() === now.getFullYear();
              }
              break;
          }

          if (shouldSendReminder && reminder.sendNotifications) {
            // Send email to the notification email specified in the reminder
            const mailOptions = {
              from: functions.config().email.user,
              to: reminder.notificationEmail,
              subject: "Pill Reminder",
              html: `
                <h2>Time to Take Your Medicine</h2>
                <p>This is a reminder to take your medicine: ${reminder.name}</p>
                <p>Scheduled time: ${reminder.time}</p>
                <br>
                <p>Stay healthy!</p>
                <p>- Your FitAmIn Team</p>
              `,
            };

            await transporter.sendMail(mailOptions);
            console.log(
              `Reminder email sent to ${reminder.notificationEmail} for ${reminder.name}`
            );
          }
        }
      }

      return null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending reminders:", errorMessage);
      return null;
    }
  });
