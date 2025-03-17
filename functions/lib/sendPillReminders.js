"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPillReminders = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
// Initialize Firebase Admin SDK if not already initialized
try {
    admin.initializeApp();
}
catch (error) {
    // App might already be initialized
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log("Firebase admin initialization error:", errorMessage);
}
// Configure nodemailer with your email service credentials
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: functions.config().email.user,
        pass: functions.config().email.password,
    },
});
exports.sendPillReminders = functions.pubsub
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
            const reminder = doc.data();
            const reminderTime = reminder.time.split(":");
            const reminderHour = parseInt(reminderTime[0]);
            const reminderMinute = parseInt(reminderTime[1]);
            // Check if it's time to send the reminder
            if (reminderHour === currentHour &&
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
                    console.log(`Reminder email sent to ${reminder.notificationEmail} for ${reminder.name}`);
                }
            }
        }
        return null;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error sending reminders:", errorMessage);
        return null;
    }
});
//# sourceMappingURL=sendPillReminders.js.map